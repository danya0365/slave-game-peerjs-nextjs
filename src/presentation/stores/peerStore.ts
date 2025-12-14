import type {
  ConnectionStatus,
  PeerMessage,
  PeerPlayer,
  RoomState,
} from "@/src/domain/types/peer";
import { PEER_SERVER_CONFIG } from "@/src/infrastructure/config/peer.config";
import { useConnectionStore } from "@/src/presentation/stores/connectionStore";
import { useGameStore } from "@/src/presentation/stores/gameStore";
import Peer, { DataConnection } from "peerjs";
import { create } from "zustand";

interface PeerState {
  // Peer instance
  peer: Peer | null;
  peerId: string | null;

  // Connection state
  connectionStatus: ConnectionStatus;
  error: string | null;

  // Room state
  room: RoomState | null;

  // Connections (for host)
  connections: Map<string, DataConnection>;

  // Host connection (for client)
  hostConnection: DataConnection | null;

  // Game message callback (for game-related messages)
  onGameMessage: ((message: PeerMessage) => void) | null;

  // Player reconnect callback (for host to send resume_game)
  onPlayerReconnect:
    | ((playerId: string, peerId: string, playerName: string) => void)
    | null;
}

interface PeerActions {
  // Initialize peer
  initializePeer: () => Promise<string>;

  // Set game message handler
  setOnGameMessage: (handler: ((message: PeerMessage) => void) | null) => void;

  // Set player reconnect handler
  setOnPlayerReconnect: (
    handler:
      | ((playerId: string, peerId: string, playerName: string) => void)
      | null
  ) => void;

  // Set room status
  setRoomStatus: (status: "waiting" | "ready" | "playing" | "finished") => void;

  // Host actions
  createRoom: (
    roomCode: string,
    player: PeerPlayer,
    retryCount?: number
  ) => void;
  handleIncomingConnection: (conn: DataConnection) => void;

  // Client actions
  joinRoom: (roomCode: string, player: PeerPlayer) => Promise<boolean>;

  // Common actions
  setReady: (isReady: boolean) => void;
  sendMessage: (message: PeerMessage) => void;
  leaveRoom: () => void;
  cleanup: () => void;

  // Internal actions
  handleMessage: (message: PeerMessage, fromPeerId: string) => void;
  broadcastToAll: (message: PeerMessage) => void;
  updatePlayers: (players: PeerPlayer[]) => void;
}

type PeerStore = PeerState & PeerActions;

/**
 * Generate a peer ID based on room code
 * Host always has the predictable ID: SLAVE_{roomCode}
 */
const getHostPeerId = (roomCode: string): string => {
  return `SLAVE_${roomCode}`;
};

/**
 * Generate a random peer ID for clients
 */
const generateClientPeerId = (): string => {
  return `SLAVE_CLIENT_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 8)}`;
};

/**
 * Module-level tracking for room creation to prevent React Strict Mode double initialization
 * This persists across component re-renders and Strict Mode cleanup cycles
 */
const roomCreationInProgress = new Map<string, number>(); // roomCode -> timestamp
const ROOM_CREATION_COOLDOWN = 2000; // 2 seconds cooldown

export const usePeerStore = create<PeerStore>((set, get) => ({
  // Initial state
  peer: null,
  peerId: null,
  connectionStatus: "idle",
  error: null,
  room: null,
  connections: new Map(),
  hostConnection: null,
  onGameMessage: null,
  onPlayerReconnect: null,

  // Set game message handler
  setOnGameMessage: (handler) => {
    set({ onGameMessage: handler });
  },

  // Set player reconnect handler
  setOnPlayerReconnect: (handler) => {
    set({ onPlayerReconnect: handler });
  },

  // Set room status
  setRoomStatus: (status) => {
    const { room } = get();
    if (room) {
      set({ room: { ...room, status } });
    }
  },

  // Initialize PeerJS instance
  initializePeer: async () => {
    return new Promise((resolve, reject) => {
      set({ connectionStatus: "initializing", error: null });

      const clientPeerId = generateClientPeerId();

      const peer = new Peer(clientPeerId, {
        ...PEER_SERVER_CONFIG,
        debug: 2,
      });

      peer.on("open", (id) => {
        console.log("[PeerJS] Connected with ID:", id);
        set({ peer, peerId: id, connectionStatus: "connected" });
        resolve(id);
      });

      peer.on("error", (err) => {
        console.error("[PeerJS] Error:", err);
        set({ connectionStatus: "error", error: err.message });
        reject(err);
      });

      peer.on("disconnected", () => {
        console.log("[PeerJS] Disconnected from server");
        set({ connectionStatus: "disconnected" });
      });

      peer.on("close", () => {
        console.log("[PeerJS] Connection closed");
        set({ connectionStatus: "idle", peer: null, peerId: null });
      });

      // Handle incoming connections (for host)
      peer.on("connection", (conn) => {
        console.log("[PeerJS] Incoming connection from:", conn.peer);
        get().handleIncomingConnection(conn);
      });
    });
  },

  // Handle incoming connection (host only)
  handleIncomingConnection: (conn: DataConnection) => {
    const { room, connections } = get();

    if (!room || !room.isHost) {
      conn.close();
      return;
    }

    // Don't check room full here - check when player_join is received
    // This prevents race conditions with multiple players joining

    conn.on("open", () => {
      console.log("[PeerJS] Connection opened with:", conn.peer);
      connections.set(conn.peer, conn);
      set({ connections: new Map(connections) });
    });

    conn.on("data", (data) => {
      //console.log("[PeerJS] Received data:", data);
      get().handleMessage(data as PeerMessage, conn.peer);
    });

    conn.on("close", () => {
      console.log("[PeerJS] Connection closed:", conn.peer);
      const { room, connections } = get();
      connections.delete(conn.peer);
      set({ connections: new Map(connections) });

      if (room) {
        const updatedPlayers = room.players.filter(
          (p) => p.peerId !== conn.peer
        );
        get().updatePlayers(updatedPlayers);

        // Notify other players
        get().broadcastToAll({
          type: "player_leave",
          senderId: get().peerId!,
          timestamp: Date.now(),
          playerId: conn.peer,
        });
      }
    });

    conn.on("error", (err) => {
      console.error("[PeerJS] Connection error:", err);
    });
  },

  // Create a room (as host)
  createRoom: (roomCode: string, player: PeerPlayer, retryCount = 0) => {
    const { peer, peerId, connectionStatus } = get();
    const hostPeerId = getHostPeerId(roomCode);

    // Check module-level cooldown to prevent React Strict Mode double initialization
    const lastCreationTime = roomCreationInProgress.get(roomCode);
    const now = Date.now();
    if (
      lastCreationTime &&
      now - lastCreationTime < ROOM_CREATION_COOLDOWN &&
      retryCount === 0
    ) {
      console.log(
        "[PeerJS] Room creation in cooldown, skipping duplicate call for:",
        roomCode
      );
      return;
    }

    // If we already have a valid peer with the correct ID, reuse it
    if (
      peer &&
      !peer.destroyed &&
      peerId === hostPeerId &&
      connectionStatus === "connected"
    ) {
      console.log("[PeerJS] Reusing existing host connection:", peerId);
      return;
    }

    // If we're already initializing with the same room, skip (but not for retries)
    if (connectionStatus === "initializing" && retryCount === 0) {
      console.log(
        "[PeerJS] Already initializing, skipping duplicate createRoom call"
      );
      return;
    }

    // Mark room creation as in progress
    roomCreationInProgress.set(roomCode, now);

    const { cleanup } = get();

    // Cleanup any existing connection (but only if not a retry)
    if (retryCount === 0) {
      cleanup();
    }

    set({ connectionStatus: "initializing", error: null });

    // Add small delay after cleanup to let PeerJS server release the ID
    const createPeer = () => {
      // Double check we're still in initializing state (prevent race conditions)
      if (get().connectionStatus !== "initializing") {
        console.log("[PeerJS] State changed, aborting createPeer");
        return;
      }
      const newPeer = new Peer(hostPeerId, {
        ...PEER_SERVER_CONFIG,
        debug: 2,
      });

      newPeer.on("open", (id) => {
        console.log("[PeerJS] Host connected with ID:", id);

        // Clear the cooldown now that connection is established
        roomCreationInProgress.delete(roomCode);

        const hostPlayer: PeerPlayer = {
          ...player,
          peerId: id,
          isHost: true,
        };

        const room: RoomState = {
          roomCode,
          players: [hostPlayer],
          isHost: true,
          hostPeerId: id,
          status: "waiting",
        };

        set({
          peer: newPeer,
          peerId: id,
          connectionStatus: "connected",
          room,
        });
      });

      newPeer.on("error", (err) => {
        console.error("[PeerJS] Host error:", err);

        // Check if the error is because the ID is taken (stale from previous session)
        if (err.type === "unavailable-id" && retryCount < 3) {
          console.log(`[PeerJS] ID taken, retrying... (${retryCount + 1}/3)`);
          newPeer.destroy();
          // Wait longer and retry
          setTimeout(() => {
            get().createRoom(roomCode, player, retryCount + 1);
          }, 1000 * (retryCount + 1)); // Exponential backoff: 1s, 2s, 3s
        } else if (err.type === "unavailable-id") {
          set({
            connectionStatus: "error",
            error: "รหัสห้องนี้มีคนใช้แล้ว กรุณาสร้างรหัสใหม่",
          });
        } else {
          set({ connectionStatus: "error", error: err.message });
        }
      });

      newPeer.on("connection", (conn) => {
        console.log("[PeerJS] Incoming connection from:", conn.peer);
        get().handleIncomingConnection(conn);
      });

      newPeer.on("disconnected", () => {
        console.log("[PeerJS] Host disconnected");
        set({ connectionStatus: "disconnected" });
      });
    };

    // If this is a retry, wait before creating new peer
    if (retryCount > 0) {
      createPeer();
    } else {
      // First attempt: longer delay to ensure cleanup is complete
      // PeerJS server needs time to release the ID
      setTimeout(createPeer, 300);
    }
  },

  // Join a room (as client)
  joinRoom: async (roomCode: string, player: PeerPlayer) => {
    return new Promise((resolve) => {
      const { cleanup } = get();

      // Cleanup any existing connection
      cleanup();

      set({ connectionStatus: "initializing", error: null });

      const clientPeerId = generateClientPeerId();
      const hostPeerId = getHostPeerId(roomCode);

      const newPeer = new Peer(clientPeerId, {
        ...PEER_SERVER_CONFIG,
        debug: 2,
      });

      newPeer.on("open", (id) => {
        console.log("[PeerJS] Client connected with ID:", id);
        set({ peer: newPeer, peerId: id, connectionStatus: "connecting" });

        // Connect to host
        const conn = newPeer.connect(hostPeerId, {
          reliable: true,
        });

        conn.on("open", () => {
          console.log("[PeerJS] Connected to host");

          const clientPlayer: PeerPlayer = {
            ...player,
            peerId: id,
            isHost: false,
          };

          // Send join message
          conn.send({
            type: "player_join",
            senderId: id,
            timestamp: Date.now(),
            player: clientPlayer,
          } as PeerMessage);

          set({
            hostConnection: conn,
            connectionStatus: "connected",
          });
        });

        conn.on("data", (data) => {
          //console.log("[PeerJS] Received from host:", data);
          get().handleMessage(data as PeerMessage, hostPeerId);
        });

        conn.on("close", () => {
          console.log("[PeerJS] Disconnected from host");
          // Keep room info so ConnectionLostModal can show
          set({
            connectionStatus: "disconnected",
            hostConnection: null,
            error: "Host ออกจากห้องแล้ว",
          });
        });

        conn.on("error", (err) => {
          console.error("[PeerJS] Connection error:", err);
          set({
            connectionStatus: "error",
            error: "ไม่สามารถเชื่อมต่อกับห้องได้",
          });
          resolve(false);
        });

        // Set timeout for connection
        setTimeout(() => {
          if (get().connectionStatus === "connecting") {
            set({
              connectionStatus: "error",
              error: "ไม่พบห้อง หรือห้องอาจปิดแล้ว",
            });
            resolve(false);
          } else {
            resolve(true);
          }
        }, 10000);
      });

      newPeer.on("error", (err) => {
        console.error("[PeerJS] Client error:", err);
        set({ connectionStatus: "error", error: err.message });
        resolve(false);
      });
    });
  },

  // Handle incoming messages
  handleMessage: (message: PeerMessage, fromPeerId: string) => {
    const { room, peerId, connections } = get();

    // Client-side: Update last message time from host for connection health tracking
    // This helps detect when the connection to host becomes stale
    if (!room?.isHost) {
      // We're a client receiving a message (presumably from host)
      useConnectionStore.getState().updateLastHostMessage();
    }

    switch (message.type) {
      case "player_join": {
        if (!room || !room.isHost) return;

        const joinMsg =
          message as import("@/src/domain/types/peer").PlayerJoinMessage;
        const newPlayer = joinMsg.player;

        // Check if player already exists by ID OR by name (could be reconnecting with new ID)
        let existingPlayerIndex = room.players.findIndex(
          (p) => p.id === newPlayer.id
        );

        // If not found by ID, try matching by name (for reconnection after refresh)
        if (existingPlayerIndex < 0) {
          existingPlayerIndex = room.players.findIndex(
            (p) => p.name === newPlayer.name
          );
        }

        let existingPlayer =
          existingPlayerIndex >= 0 ? room.players[existingPlayerIndex] : null;

        // If not found in peerStore but game is playing, check gameStore
        // (player might have been removed from peerStore on disconnect)
        let foundInGameStore = false;
        if (!existingPlayer && room.status === "playing") {
          // Check gameStore for player
          const gameStorePlayers = useGameStore.getState().players;
          const gamePlayerIndex = gameStorePlayers.findIndex(
            (p: { name: string }) => p.name === newPlayer.name
          );

          if (gamePlayerIndex >= 0) {
            foundInGameStore = true;
            existingPlayerIndex = gamePlayerIndex;
            // Create existingPlayer from gameStore data
            const gp = gameStorePlayers[gamePlayerIndex];
            existingPlayer = {
              peerId: "",
              id: gp.id,
              name: gp.name,
              avatar: gp.avatar,
              isHost: false,
              isReady: true,
              isConnected: false,
            };
          }
        }

        // Handle reconnection during game
        if (existingPlayer && room.status === "playing") {
          let updatedPlayers: PeerPlayer[];

          if (foundInGameStore) {
            // Player was removed from room.players but exists in gameStore
            // Add them back to room.players
            updatedPlayers = [
              ...room.players,
              {
                ...existingPlayer,
                id: newPlayer.id,
                peerId: fromPeerId,
                isConnected: true,
              },
            ];
          } else {
            // Player exists in room.players, just update their peerId
            updatedPlayers = room.players.map((p, idx) =>
              idx === existingPlayerIndex
                ? {
                    ...p,
                    id: newPlayer.id,
                    peerId: fromPeerId,
                    isConnected: true,
                  }
                : p
            );
          }
          get().updatePlayers(updatedPlayers);

          // Notify via callback to send resume_game (use OLD player ID for gameStore lookup)
          const { onPlayerReconnect } = get();
          if (onPlayerReconnect) {
            // Pass the original player ID (from existingPlayer) since gameStore uses that
            onPlayerReconnect(existingPlayer.id, fromPeerId, newPlayer.name);
          } else {
            console.warn("[PeerJS] No onPlayerReconnect callback set!");
          }

          // Broadcast player reconnected to all
          connections.forEach((conn) => {
            if (conn.open) {
              conn.send({
                type: "player_reconnected",
                senderId: peerId,
                timestamp: Date.now(),
                playerId: newPlayer.id,
                playerName: newPlayer.name,
              } as PeerMessage);
            }
          });
          return;
        }

        // Check if player already exists (prevent duplicates in waiting room)
        if (existingPlayer) {
          // Update their peerId (and ID if changed) and send sync
          const updatedPlayers = room.players.map((p, idx) =>
            idx === existingPlayerIndex
              ? { ...p, id: newPlayer.id, peerId: fromPeerId }
              : p
          );
          get().updatePlayers(updatedPlayers);

          const conn = connections.get(fromPeerId);
          if (conn?.open) {
            conn.send({
              type: "sync_players",
              senderId: peerId,
              timestamp: Date.now(),
              players: updatedPlayers,
              roomCode: room.roomCode,
              roomStatus: room.status,
            } as PeerMessage);
          }
          return;
        }

        // Check if room is full (check here instead of at connection time)
        if (room.players.length >= 4) {
          console.log("[PeerJS] Room is full, rejecting player:", newPlayer.id);
          const conn = connections.get(fromPeerId);
          if (conn?.open) {
            conn.send({
              type: "error",
              senderId: peerId,
              timestamp: Date.now(),
              error: "ห้องเต็มแล้ว",
            } as PeerMessage);
            setTimeout(() => {
              conn.close();
              connections.delete(fromPeerId);
              set({ connections: new Map(connections) });
            }, 100);
          }
          return;
        }

        // Add player to room
        const updatedPlayers = [...room.players, newPlayer];
        get().updatePlayers(updatedPlayers);

        // Broadcast to all players (including new player)
        connections.forEach((conn) => {
          if (conn.open) {
            conn.send({
              type: "sync_players",
              senderId: peerId,
              timestamp: Date.now(),
              players: updatedPlayers,
              roomCode: room.roomCode,
              roomStatus: room.status,
            } as PeerMessage);
          }
        });
        break;
      }

      case "sync_players": {
        const syncMsg =
          message as import("@/src/domain/types/peer").SyncPlayersMessage;

        const roomStatus = syncMsg.roomStatus ?? "waiting";
        set({
          room: {
            roomCode: syncMsg.roomCode,
            players: syncMsg.players,
            isHost: false,
            hostPeerId: fromPeerId,
            status: roomStatus,
          },
        });
        break;
      }

      case "player_leave": {
        if (!room) return;

        const leaveMsg =
          message as import("@/src/domain/types/peer").PlayerLeaveMessage;
        const updatedPlayers = room.players.filter(
          (p) => p.peerId !== leaveMsg.playerId
        );
        get().updatePlayers(updatedPlayers);
        break;
      }

      case "player_ready": {
        if (!room) return;

        const readyMsg =
          message as import("@/src/domain/types/peer").PlayerReadyMessage;
        const updatedPlayers = room.players.map((p) =>
          p.peerId === readyMsg.playerId ? { ...p, isReady: true } : p
        );
        get().updatePlayers(updatedPlayers);

        if (room.isHost) {
          get().broadcastToAll({
            type: "sync_players",
            senderId: peerId!,
            timestamp: Date.now(),
            players: updatedPlayers,
            roomCode: room.roomCode,
            roomStatus: room.status,
          });
        }
        break;
      }

      case "player_unready": {
        if (!room) return;

        const unreadyMsg =
          message as import("@/src/domain/types/peer").PlayerUnreadyMessage;
        const updatedPlayers = room.players.map((p) =>
          p.peerId === unreadyMsg.playerId ? { ...p, isReady: false } : p
        );
        get().updatePlayers(updatedPlayers);

        if (room.isHost) {
          get().broadcastToAll({
            type: "sync_players",
            senderId: peerId!,
            timestamp: Date.now(),
            players: updatedPlayers,
            roomCode: room.roomCode,
            roomStatus: room.status,
          });
        }
        break;
      }

      case "error": {
        const errorMsg =
          message as import("@/src/domain/types/peer").ErrorMessage;
        set({
          error: errorMsg.error,
          connectionStatus: "error",
          room: null, // Clear room on error
        });
        break;
      }

      // Game messages - forward to game handler
      // NOTE: play_cards and pass_turn relay is handled by GamePlayView to include nextPlayerIndex
      case "deal_cards":
      case "play_cards":
      case "pass_turn":
      case "round_end":
      case "game_end":
      case "game_start":
      case "new_round":
      case "resume_game":
      case "sync_game_state": {
        const { onGameMessage } = get();

        // Forward to local game handler (relay is handled there for play_cards/pass_turn)
        if (onGameMessage) {
          onGameMessage(message);
        } else {
          console.log("[PeerJS] No game message handler for:", message.type);
        }
        break;
      }

      // Chat messages - forward to handler and relay to all
      case "chat": {
        const { onGameMessage, room, connections } = get();

        // Forward to local handler
        if (onGameMessage) {
          onGameMessage(message);
        }

        // If host, relay to all OTHER clients
        if (room?.isHost) {
          connections.forEach((conn, connPeerId) => {
            if (connPeerId !== fromPeerId && conn.open) {
              conn.send(message);
            }
          });
        }
        break;
      }

      // Ping/Pong for connection health
      case "ping": {
        // Respond with pong
        //console.log("[PeerJS] Ping received from:", fromPeerId);
        const { room, connections, hostConnection, peerId } = get();
        const pongMessage: PeerMessage = {
          type: "pong",
          senderId: peerId!,
          timestamp: Date.now(),
        };

        if (room?.isHost) {
          // Host sends pong back to the client who pinged
          const conn = connections.get(fromPeerId);
          if (conn?.open) {
            conn.send(pongMessage);
            //console.log("[PeerJS] Host sent pong to:", fromPeerId);
          }
        } else if (hostConnection?.open) {
          // Client sends pong back to host
          hostConnection.send(pongMessage);
          //console.log("[PeerJS] Client sent pong to host");
        }
        break;
      }

      case "pong": {
        // Update player connection status when pong is received
        // console.log("[PeerJS] Pong received from:", fromPeerId);
        useConnectionStore.getState().updatePlayerPing(fromPeerId);
        break;
      }

      // Sync request (client asks for current game state)
      case "sync_request": {
        const { room, onGameMessage } = get();

        // Only host handles sync requests
        if (room?.isHost && onGameMessage) {
          onGameMessage(message);
        }
        break;
      }

      // Player disconnected/reconnected notifications
      case "player_disconnected":
      case "player_reconnected": {
        const { onGameMessage } = get();
        if (onGameMessage) {
          onGameMessage(message);
        }
        break;
      }

      // Turn timer sync (host broadcasts timer deadline to all clients)
      case "turn_timer_sync": {
        const { onGameMessage } = get();
        if (onGameMessage) {
          onGameMessage(message);
        }
        break;
      }

      // Auto action (host triggers auto-action when timer expires)
      case "auto_action": {
        const { onGameMessage } = get();
        if (onGameMessage) {
          onGameMessage(message);
        }
        break;
      }

      // State check request (host asks clients for state hash)
      case "state_check_request": {
        const { onGameMessage } = get();
        if (onGameMessage) {
          onGameMessage(message);
        }
        break;
      }

      // State check response (client sends state hash to host)
      case "state_check_response": {
        const { onGameMessage } = get();
        if (onGameMessage) {
          onGameMessage(message);
        }
        break;
      }

      // Force sync (host forces client to sync state)
      case "force_sync": {
        const { onGameMessage } = get();
        if (onGameMessage) {
          onGameMessage(message);
        }
        break;
      }

      default:
        console.log(
          "[PeerJS] Unknown message type:",
          (message as { type: string }).type
        );
    }
  },

  // Set player ready status
  setReady: (isReady: boolean) => {
    const { room, peerId, hostConnection } = get();
    if (!room || !peerId) return;

    const message: PeerMessage = {
      type: isReady ? "player_ready" : "player_unready",
      senderId: peerId,
      timestamp: Date.now(),
      playerId: peerId,
    } as import("@/src/domain/types/peer").PlayerReadyMessage;

    if (room.isHost) {
      // Update local state
      const updatedPlayers = room.players.map((p) =>
        p.peerId === peerId ? { ...p, isReady } : p
      );
      get().updatePlayers(updatedPlayers);

      // Broadcast to all
      get().broadcastToAll({
        type: "sync_players",
        senderId: peerId,
        timestamp: Date.now(),
        players: updatedPlayers,
        roomCode: room.roomCode,
        roomStatus: room.status,
      });
    } else if (hostConnection) {
      hostConnection.send(message);
    }
  },

  // Send message (route based on role)
  sendMessage: (message: PeerMessage) => {
    const { room, hostConnection } = get();

    if (room?.isHost) {
      get().broadcastToAll(message);
    } else if (hostConnection) {
      hostConnection.send(message);
    }
  },

  // Broadcast to all connected peers (host only)
  broadcastToAll: (message: PeerMessage) => {
    const { connections } = get();

    connections.forEach((conn) => {
      if (conn.open) {
        conn.send(message);
      }
    });
  },

  // Update players in room
  updatePlayers: (players: PeerPlayer[]) => {
    const { room } = get();
    if (!room) return;

    set({
      room: {
        ...room,
        players,
      },
    });
  },

  // Leave room
  leaveRoom: () => {
    const { room, peerId, hostConnection, connections } = get();

    if (room && !room.isHost && hostConnection) {
      hostConnection.send({
        type: "player_leave",
        senderId: peerId,
        timestamp: Date.now(),
        playerId: peerId,
      } as PeerMessage);
    }

    // Close all connections
    connections.forEach((conn) => conn.close());

    if (hostConnection) {
      hostConnection.close();
    }

    set({
      room: null,
      connections: new Map(),
      hostConnection: null,
    });
  },

  // Cleanup everything
  cleanup: () => {
    const { peer, connections, hostConnection, room } = get();

    // Check if any room creation is in cooldown - if so, don't cleanup
    // This prevents React Strict Mode from destroying the peer during initialization
    const now = Date.now();
    for (const [roomCode, timestamp] of roomCreationInProgress.entries()) {
      if (now - timestamp < ROOM_CREATION_COOLDOWN) {
        console.log(
          "[PeerJS] Cleanup skipped - room creation in cooldown for:",
          roomCode
        );
        return;
      }
    }

    // Close all connections
    connections.forEach((conn) => conn.close());

    if (hostConnection) {
      hostConnection.close();
    }

    if (peer) {
      peer.destroy();
    }

    // Clear the cooldown tracking for the current room
    if (room?.roomCode) {
      roomCreationInProgress.delete(room.roomCode);
    }

    set({
      peer: null,
      peerId: null,
      connectionStatus: "idle",
      error: null,
      room: null,
      connections: new Map(),
      hostConnection: null,
    });
  },
}));

// Stable empty array for selectors
const EMPTY_PLAYERS: PeerPlayer[] = [];

// Selector hooks
export const useIsHost = () =>
  usePeerStore((state) => state.room?.isHost ?? false);
export const usePlayers = () =>
  usePeerStore((state) => state.room?.players ?? EMPTY_PLAYERS);
export const useRoomCode = () =>
  usePeerStore((state) => state.room?.roomCode ?? "");
export const useConnectionStatus = () =>
  usePeerStore((state) => state.connectionStatus);
export const usePeerError = () => usePeerStore((state) => state.error);
