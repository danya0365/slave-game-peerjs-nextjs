import type { PlayerConnectionStatus } from "@/src/domain/types/peer";
import { create } from "zustand";

// Connection health tracking for each player
interface PlayerConnection {
  peerId: string;
  playerId: string;
  playerName: string;
  status: PlayerConnectionStatus;
  lastPingTime: number;
  missedPings: number;
}

interface ConnectionState {
  // Player connections (keyed by peerId)
  playerConnections: Map<string, PlayerConnection>;

  // Heartbeat interval ID
  heartbeatInterval: NodeJS.Timeout | null;

  // Self connection status
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempts: number;

  // Disconnected players for UI notification
  disconnectedPlayers: { playerId: string; playerName: string }[];

  // Toast messages queue
  toasts: {
    id: string;
    type: "info" | "warning" | "error" | "success";
    message: string;
    timestamp: number;
  }[];
}

interface ConnectionActions {
  // Initialize heartbeat for host
  startHeartbeat: (
    sendPing: (peerId: string) => void,
    onPlayerDisconnect: (peerId: string, playerName: string) => void
  ) => void;
  stopHeartbeat: () => void;

  // Track player connection
  registerPlayer: (
    peerId: string,
    playerId: string,
    playerName: string
  ) => void;
  unregisterPlayer: (peerId: string) => void;
  updatePlayerPing: (peerId: string) => void;

  // Connection status
  setConnected: (connected: boolean) => void;
  setReconnecting: (reconnecting: boolean) => void;
  incrementReconnectAttempts: () => void;
  resetReconnectAttempts: () => void;

  // Get player status
  getPlayerStatus: (peerId: string) => PlayerConnectionStatus;

  // Disconnected players
  addDisconnectedPlayer: (playerId: string, playerName: string) => void;
  removeDisconnectedPlayer: (playerId: string) => void;
  clearDisconnectedPlayers: () => void;

  // Toast management
  addToast: (
    type: "info" | "warning" | "error" | "success",
    message: string
  ) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  // Cleanup
  reset: () => void;
}

type ConnectionStore = ConnectionState & ConnectionActions;

// Constants
const HEARTBEAT_INTERVAL = 3000; // 3 seconds
const PING_TIMEOUT = 6000; // 6 seconds (2 missed pings = unstable)
const DISCONNECT_TIMEOUT = 12000; // 12 seconds (4 missed pings = offline)

export const useConnectionStore = create<ConnectionStore>((set, get) => ({
  // Initial state
  playerConnections: new Map(),
  heartbeatInterval: null,
  isConnected: true,
  isReconnecting: false,
  reconnectAttempts: 0,
  disconnectedPlayers: [],
  toasts: [],

  // Start heartbeat (host only)
  startHeartbeat: (sendPing, onPlayerDisconnect) => {
    // Clear existing interval
    const { heartbeatInterval } = get();
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }

    const interval = setInterval(() => {
      const { playerConnections } = get();
      const now = Date.now();

      playerConnections.forEach((conn, peerId) => {
        const timeSinceLastPing = now - conn.lastPingTime;

        // Check if player is disconnected
        if (timeSinceLastPing > DISCONNECT_TIMEOUT) {
          if (conn.status !== "offline") {
            // Mark as offline
            set((state) => {
              const updated = new Map(state.playerConnections);
              updated.set(peerId, {
                ...conn,
                status: "offline",
                missedPings: conn.missedPings + 1,
              });
              return { playerConnections: updated };
            });

            // Notify about disconnect
            onPlayerDisconnect(peerId, conn.playerName);
            get().addDisconnectedPlayer(conn.playerId, conn.playerName);
            get().addToast("warning", `${conn.playerName} หลุดการเชื่อมต่อ`);
          }
        } else if (timeSinceLastPing > PING_TIMEOUT) {
          // Mark as unstable
          if (conn.status !== "unstable") {
            set((state) => {
              const updated = new Map(state.playerConnections);
              updated.set(peerId, {
                ...conn,
                status: "unstable",
                missedPings: conn.missedPings + 1,
              });
              return { playerConnections: updated };
            });
          }
        }

        // Send ping to all online/unstable players
        if (conn.status !== "offline") {
          sendPing(peerId);
        }
      });
    }, HEARTBEAT_INTERVAL);

    set({ heartbeatInterval: interval });
  },

  stopHeartbeat: () => {
    const { heartbeatInterval } = get();
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      set({ heartbeatInterval: null });
    }
  },

  // Register player
  registerPlayer: (peerId, playerId, playerName) => {
    set((state) => {
      const updated = new Map(state.playerConnections);
      updated.set(peerId, {
        peerId,
        playerId,
        playerName,
        status: "online",
        lastPingTime: Date.now(),
        missedPings: 0,
      });
      return { playerConnections: updated };
    });
  },

  // Unregister player
  unregisterPlayer: (peerId) => {
    set((state) => {
      const updated = new Map(state.playerConnections);
      updated.delete(peerId);
      return { playerConnections: updated };
    });
  },

  // Update player ping (called when pong received)
  updatePlayerPing: (peerId) => {
    set((state) => {
      const updated = new Map(state.playerConnections);
      const conn = updated.get(peerId);
      if (conn) {
        const wasOffline = conn.status === "offline";
        updated.set(peerId, {
          ...conn,
          status: "online",
          lastPingTime: Date.now(),
          missedPings: 0,
        });

        // If player was offline and is now online, notify
        if (wasOffline) {
          get().removeDisconnectedPlayer(conn.playerId);
          get().addToast("success", `${conn.playerName} กลับมาออนไลน์แล้ว`);
        }
      }
      return { playerConnections: updated };
    });
  },

  // Get player status
  getPlayerStatus: (peerId) => {
    const { playerConnections } = get();
    return playerConnections.get(peerId)?.status ?? "online";
  },

  // Connection status
  setConnected: (connected) => set({ isConnected: connected }),
  setReconnecting: (reconnecting) => set({ isReconnecting: reconnecting }),
  incrementReconnectAttempts: () =>
    set((state) => ({ reconnectAttempts: state.reconnectAttempts + 1 })),
  resetReconnectAttempts: () => set({ reconnectAttempts: 0 }),

  // Disconnected players
  addDisconnectedPlayer: (playerId, playerName) => {
    set((state) => {
      if (state.disconnectedPlayers.some((p) => p.playerId === playerId)) {
        return state;
      }
      return {
        disconnectedPlayers: [
          ...state.disconnectedPlayers,
          { playerId, playerName },
        ],
      };
    });
  },

  removeDisconnectedPlayer: (playerId) => {
    set((state) => ({
      disconnectedPlayers: state.disconnectedPlayers.filter(
        (p) => p.playerId !== playerId
      ),
    }));
  },

  clearDisconnectedPlayers: () => set({ disconnectedPlayers: [] }),

  // Toast management
  addToast: (type, message) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    set((state) => ({
      toasts: [...state.toasts, { id, type, message, timestamp: Date.now() }],
    }));

    // Auto-remove after 5 seconds
    setTimeout(() => {
      get().removeToast(id);
    }, 5000);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearToasts: () => set({ toasts: [] }),

  // Reset all
  reset: () => {
    const { heartbeatInterval } = get();
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }
    set({
      playerConnections: new Map(),
      heartbeatInterval: null,
      isConnected: true,
      isReconnecting: false,
      reconnectAttempts: 0,
      disconnectedPlayers: [],
      toasts: [],
    });
  },
}));
