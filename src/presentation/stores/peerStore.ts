import type {
  ConnectionStatus,
  PeerMessage,
  PeerPlayer,
  RoomState,
} from "@/src/domain/types/peer";
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
}

interface PeerActions {
  // Initialize peer
  initializePeer: () => Promise<string>;

  // Set game message handler
  setOnGameMessage: (handler: ((message: PeerMessage) => void) | null) => void;

  // Host actions
  createRoom: (roomCode: string, player: PeerPlayer) => void;
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

  // Set game message handler
  setOnGameMessage: (handler) => {
    set({ onGameMessage: handler });
  },

  // Initialize PeerJS instance
  initializePeer: async () => {
    return new Promise((resolve, reject) => {
      set({ connectionStatus: "initializing", error: null });

      const clientPeerId = generateClientPeerId();

      const peer = new Peer(clientPeerId, {
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
      console.log("[PeerJS] Received data:", data);
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
  createRoom: (roomCode: string, player: PeerPlayer) => {
    const { peer, cleanup } = get();

    // Cleanup any existing connection
    cleanup();

    set({ connectionStatus: "initializing", error: null });

    const hostPeerId = getHostPeerId(roomCode);

    const newPeer = new Peer(hostPeerId, {
      debug: 2,
    });

    newPeer.on("open", (id) => {
      console.log("[PeerJS] Host connected with ID:", id);

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

      // Check if the error is because the room already exists
      if (err.type === "unavailable-id") {
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
  },

  // Join a room (as client)
  joinRoom: async (roomCode: string, player: PeerPlayer) => {
    return new Promise((resolve) => {
      const { peer, cleanup } = get();

      // Cleanup any existing connection
      cleanup();

      set({ connectionStatus: "initializing", error: null });

      const clientPeerId = generateClientPeerId();
      const hostPeerId = getHostPeerId(roomCode);

      const newPeer = new Peer(clientPeerId, {
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
          console.log("[PeerJS] Received from host:", data);
          get().handleMessage(data as PeerMessage, hostPeerId);
        });

        conn.on("close", () => {
          console.log("[PeerJS] Disconnected from host");
          set({
            connectionStatus: "disconnected",
            hostConnection: null,
            room: null,
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

    console.log(
      "[PeerJS] Handling message:",
      message.type,
      "from:",
      fromPeerId
    );

    switch (message.type) {
      case "player_join": {
        if (!room || !room.isHost) return;

        const joinMsg =
          message as import("@/src/domain/types/peer").PlayerJoinMessage;
        const newPlayer = joinMsg.player;

        // Check if player already exists (prevent duplicates)
        const playerExists = room.players.some(
          (p) => p.id === newPlayer.id || p.peerId === newPlayer.peerId
        );
        if (playerExists) {
          console.log(
            "[PeerJS] Player already exists, skipping:",
            newPlayer.id
          );
          // Still send sync to this player so they see current state
          const conn = connections.get(fromPeerId);
          if (conn?.open) {
            conn.send({
              type: "sync_players",
              senderId: peerId,
              timestamp: Date.now(),
              players: room.players,
              roomCode: room.roomCode,
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
            } as PeerMessage);
          }
        });
        break;
      }

      case "sync_players": {
        const syncMsg =
          message as import("@/src/domain/types/peer").SyncPlayersMessage;

        set({
          room: {
            roomCode: syncMsg.roomCode,
            players: syncMsg.players,
            isHost: false,
            hostPeerId: fromPeerId,
            status: "waiting",
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

      // Game messages - forward to game handler and relay if host
      case "deal_cards":
      case "play_cards":
      case "pass_turn":
      case "round_end":
      case "game_end":
      case "game_start":
      case "new_round": {
        const { onGameMessage, room, connections } = get();

        // Forward to local game handler
        if (onGameMessage) {
          onGameMessage(message);
        } else {
          console.log("[PeerJS] No game message handler for:", message.type);
        }

        // If host, relay to all OTHER clients (not back to sender)
        if (
          room?.isHost &&
          (message.type === "play_cards" || message.type === "pass_turn")
        ) {
          connections.forEach((conn, connPeerId) => {
            // Don't send back to the sender
            if (connPeerId !== fromPeerId && conn.open) {
              conn.send(message);
            }
          });
        }
        break;
      }

      default:
        console.log("[PeerJS] Unknown message type:", message.type);
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
    const { peer, connections, hostConnection } = get();

    // Close all connections
    connections.forEach((conn) => conn.close());

    if (hostConnection) {
      hostConnection.close();
    }

    if (peer) {
      peer.destroy();
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
