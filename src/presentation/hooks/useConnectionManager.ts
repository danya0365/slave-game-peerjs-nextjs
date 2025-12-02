"use client";

import { usePeerStore } from "@/src/presentation/stores/peerStore";
import { useCallback, useEffect, useRef, useState } from "react";

interface ConnectionManagerOptions {
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  heartbeatInterval?: number;
}

interface ConnectionManagerState {
  isReconnecting: boolean;
  reconnectAttempts: number;
  lastHeartbeat: number | null;
  connectionQuality: "good" | "poor" | "disconnected";
}

/**
 * Hook to manage P2P connection health and reconnection
 */
export function useConnectionManager(options: ConnectionManagerOptions = {}) {
  const {
    maxReconnectAttempts = 3,
    reconnectDelay = 2000,
    heartbeatInterval = 5000,
  } = options;

  const {
    connectionStatus,
    room,
    peerId,
    hostConnection,
    peer,
    createRoom,
    joinRoom,
    cleanup,
  } = usePeerStore();

  const [state, setState] = useState<ConnectionManagerState>({
    isReconnecting: false,
    reconnectAttempts: 0,
    lastHeartbeat: null,
    connectionQuality: "good",
  });

  // Store last room info for reconnection
  const lastRoomInfoRef = useRef<{
    roomCode: string;
    isHost: boolean;
    playerInfo: {
      peerId: string;
      id: string;
      name: string;
      avatar: string;
    };
  } | null>(null);

  // Heartbeat interval ref
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Save room info when connected
  useEffect(() => {
    if (room && connectionStatus === "connected") {
      const selfPlayer = room.players.find((p) => p.peerId === peerId);
      if (selfPlayer) {
        lastRoomInfoRef.current = {
          roomCode: room.roomCode,
          isHost: room.isHost,
          playerInfo: {
            peerId: selfPlayer.peerId,
            id: selfPlayer.id,
            name: selfPlayer.name,
            avatar: selfPlayer.avatar,
          },
        };
      }
    }
  }, [room, connectionStatus, peerId]);

  // Handle disconnection
  useEffect(() => {
    if (connectionStatus === "disconnected" && lastRoomInfoRef.current) {
      // Start reconnection attempt
      attemptReconnect();
    }
  }, [connectionStatus]);

  /**
   * Attempt to reconnect to the room
   */
  const attemptReconnect = useCallback(async () => {
    const roomInfo = lastRoomInfoRef.current;
    if (!roomInfo || state.reconnectAttempts >= maxReconnectAttempts) {
      setState((prev) => ({
        ...prev,
        isReconnecting: false,
        connectionQuality: "disconnected",
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      isReconnecting: true,
      reconnectAttempts: prev.reconnectAttempts + 1,
    }));

    console.log(
      `[ConnectionManager] Reconnection attempt ${
        state.reconnectAttempts + 1
      }/${maxReconnectAttempts}`
    );

    // Wait before reconnecting
    await new Promise((resolve) => setTimeout(resolve, reconnectDelay));

    try {
      // Cleanup old connection
      cleanup();

      // Create player info for reconnection
      const playerForReconnect = {
        peerId: "",
        id: roomInfo.playerInfo.id,
        name: roomInfo.playerInfo.name,
        avatar: roomInfo.playerInfo.avatar,
        isHost: roomInfo.isHost,
        isReady: false,
        isConnected: true,
      };

      if (roomInfo.isHost) {
        // Try to recreate the room as host
        createRoom(roomInfo.roomCode, playerForReconnect);
      } else {
        // Try to rejoin the room
        const success = await joinRoom(roomInfo.roomCode, playerForReconnect);
        if (!success) {
          // Schedule another attempt
          reconnectTimeoutRef.current = setTimeout(() => {
            attemptReconnect();
          }, reconnectDelay);
        }
      }

      setState((prev) => ({
        ...prev,
        isReconnecting: false,
        connectionQuality: "good",
      }));
    } catch (error) {
      console.error("[ConnectionManager] Reconnection failed:", error);

      // Schedule another attempt
      reconnectTimeoutRef.current = setTimeout(() => {
        attemptReconnect();
      }, reconnectDelay);
    }
  }, [
    state.reconnectAttempts,
    maxReconnectAttempts,
    reconnectDelay,
    cleanup,
    createRoom,
    joinRoom,
  ]);

  /**
   * Start heartbeat monitoring
   */
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(() => {
      const { hostConnection, room, peerId, broadcastToAll, connections } =
        usePeerStore.getState();

      if (room?.isHost) {
        // Host sends ping to all clients
        broadcastToAll({
          type: "ping",
          senderId: peerId!,
          timestamp: Date.now(),
        });
      } else if (hostConnection?.open) {
        // Client sends ping to host
        hostConnection.send({
          type: "ping",
          senderId: peerId,
          timestamp: Date.now(),
        });
      }

      setState((prev) => ({
        ...prev,
        lastHeartbeat: Date.now(),
      }));
    }, heartbeatInterval);
  }, [heartbeatInterval]);

  /**
   * Stop heartbeat monitoring
   */
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  /**
   * Reset reconnection state
   */
  const resetReconnection = useCallback(() => {
    setState({
      isReconnecting: false,
      reconnectAttempts: 0,
      lastHeartbeat: null,
      connectionQuality: "good",
    });

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  /**
   * Manual reconnect trigger
   */
  const manualReconnect = useCallback(() => {
    setState((prev) => ({
      ...prev,
      reconnectAttempts: 0,
    }));
    attemptReconnect();
  }, [attemptReconnect]);

  // Start/stop heartbeat based on connection status
  useEffect(() => {
    if (connectionStatus === "connected" && room) {
      startHeartbeat();
      resetReconnection();
    } else {
      stopHeartbeat();
    }

    return () => {
      stopHeartbeat();
    };
  }, [
    connectionStatus,
    room,
    startHeartbeat,
    stopHeartbeat,
    resetReconnection,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopHeartbeat();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [stopHeartbeat]);

  return {
    ...state,
    maxReconnectAttempts,
    attemptReconnect: manualReconnect,
    resetReconnection,
    canReconnect:
      lastRoomInfoRef.current !== null &&
      state.reconnectAttempts < maxReconnectAttempts,
  };
}

/**
 * Hook for host migration
 */
export function useHostMigration() {
  const { room, peerId, connections, cleanup } = usePeerStore();
  const [isMigrating, setIsMigrating] = useState(false);

  /**
   * Check if current player should become host
   * (when original host disconnects)
   */
  const shouldBecomeHost = useCallback(() => {
    if (!room || room.isHost) return false;

    // Check if host is still connected
    const hostPlayer = room.players.find((p) => p.isHost);
    if (!hostPlayer) return true;

    // If we can't reach host, we might need to migrate
    // This would be detected via heartbeat timeout
    return false;
  }, [room]);

  /**
   * Migrate to become the new host
   */
  const migrateToHost = useCallback(async () => {
    if (!room || room.isHost || isMigrating) return;

    setIsMigrating(true);

    try {
      const { createRoom } = usePeerStore.getState();
      const selfPlayer = room.players.find((p) => p.peerId === peerId);

      if (!selfPlayer) {
        throw new Error("Cannot find self in players");
      }

      // Cleanup current connection
      cleanup();

      // Create room as new host
      const newHostPlayer = {
        ...selfPlayer,
        isHost: true,
      };

      createRoom(room.roomCode, newHostPlayer);

      console.log("[HostMigration] Successfully migrated to host");
    } catch (error) {
      console.error("[HostMigration] Migration failed:", error);
    } finally {
      setIsMigrating(false);
    }
  }, [room, peerId, isMigrating, cleanup]);

  return {
    isMigrating,
    shouldBecomeHost,
    migrateToHost,
  };
}
