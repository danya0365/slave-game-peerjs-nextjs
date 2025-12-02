"use client";

import type { Card } from "@/src/domain/types/card";
import type {
  DealCardsMessage,
  PassTurnMessage,
  PeerMessage,
  PlayCardsMessage,
} from "@/src/domain/types/peer";
import {
  createPlayedHand,
  dealCards,
  findStartingPlayer,
  sortCards,
} from "@/src/domain/utils/cardUtils";
import { useGameStore } from "@/src/presentation/stores/gameStore";
import { usePeerStore } from "@/src/presentation/stores/peerStore";
import { useCallback } from "react";

/**
 * Hook to synchronize game state across P2P connections
 */
export function useGameSync() {
  const {
    room,
    peerId,
    sendMessage,
    broadcastToAll,
    connections,
    hostConnection,
  } = usePeerStore();

  const {
    phase,
    players: gamePlayers,
    currentHand,
    currentPlayerIndex,
    isFirstTurn,
    finishOrder,
    initializeGame,
    startGame,
    playCards: gamePlayCards,
    pass: gamePass,
    canPlayCards,
    canPass,
    isPlayerTurn,
    getPlayerHand,
  } = useGameStore();

  const isHost = room?.isHost ?? false;

  /**
   * Start game (host only)
   * Deals cards and sends to all players
   */
  const hostStartGame = useCallback(() => {
    if (!isHost || !room || room.players.length !== 4) return;

    // Initialize game with players
    const playerInfos = room.players.map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
    }));
    initializeGame(playerInfos);

    // Deal cards
    const hands = dealCards();
    const startingPlayerIndex = findStartingPlayer(hands);
    const allHandCounts = hands.map((h) => h.length);

    // Send dealt cards to each player
    room.players.forEach((player, index) => {
      const message: DealCardsMessage = {
        type: "deal_cards",
        senderId: peerId!,
        timestamp: Date.now(),
        hand: hands[index],
        playerIndex: index,
        startingPlayerIndex,
        allHandCounts,
      };

      // Send to specific player
      if (player.peerId === peerId) {
        // Local player (host)
        handleDealCards(message);
      } else {
        // Remote player
        const conn = connections.get(player.peerId);
        if (conn?.open) {
          conn.send(message);
        }
      }
    });
  }, [isHost, room, peerId, connections, initializeGame]);

  /**
   * Handle receiving dealt cards
   */
  const handleDealCards = useCallback((message: DealCardsMessage) => {
    const { hand, playerIndex, startingPlayerIndex } = message;

    // Update game store with dealt hand
    useGameStore.setState((state) => {
      const updatedPlayers = state.players.map((player, index) => ({
        ...player,
        hand: index === playerIndex ? sortCards(hand) : player.hand,
        isCurrentTurn: index === startingPlayerIndex,
      }));

      return {
        ...state,
        phase: "playing",
        players: updatedPlayers,
        currentPlayerIndex: startingPlayerIndex,
        isFirstTurn: true,
        roundNumber: 1,
      };
    });
  }, []);

  /**
   * Play cards (any player)
   */
  const playCards = useCallback(
    (cards: Card[]) => {
      if (!room || !peerId) return false;

      // Find current player's ID
      const currentPlayer = gamePlayers.find((p) => isPlayerTurn(p.id));
      if (!currentPlayer) return false;

      // Validate move locally
      if (!canPlayCards(currentPlayer.id, cards)) return false;

      // Create played hand
      const playedHand = createPlayedHand(cards, currentPlayer.id);
      if (!playedHand) return false;

      // Execute locally
      const success = gamePlayCards(currentPlayer.id, cards);
      if (!success) return false;

      // Broadcast to others
      const message: PlayCardsMessage = {
        type: "play_cards",
        senderId: peerId,
        timestamp: Date.now(),
        playerId: currentPlayer.id,
        cards,
        playedHand,
      };

      if (isHost) {
        broadcastToAll(message);
      } else if (hostConnection?.open) {
        hostConnection.send(message);
      }

      return true;
    },
    [
      room,
      peerId,
      gamePlayers,
      isPlayerTurn,
      canPlayCards,
      gamePlayCards,
      isHost,
      broadcastToAll,
      hostConnection,
    ]
  );

  /**
   * Pass turn (any player)
   */
  const passTurn = useCallback(() => {
    if (!room || !peerId) return false;

    // Find current player's ID
    const currentPlayer = gamePlayers.find((p) => isPlayerTurn(p.id));
    if (!currentPlayer) return false;

    // Validate
    if (!canPass(currentPlayer.id)) return false;

    // Execute locally
    const success = gamePass(currentPlayer.id);
    if (!success) return false;

    // Broadcast to others
    const message: PassTurnMessage = {
      type: "pass_turn",
      senderId: peerId,
      timestamp: Date.now(),
      playerId: currentPlayer.id,
    };

    if (isHost) {
      broadcastToAll(message);
    } else if (hostConnection?.open) {
      hostConnection.send(message);
    }

    return true;
  }, [
    room,
    peerId,
    gamePlayers,
    isPlayerTurn,
    canPass,
    gamePass,
    isHost,
    broadcastToAll,
    hostConnection,
  ]);

  /**
   * Handle incoming game messages
   */
  const handleGameMessage = useCallback(
    (message: PeerMessage) => {
      switch (message.type) {
        case "deal_cards":
          handleDealCards(message as DealCardsMessage);
          break;

        case "play_cards": {
          const playMsg = message as PlayCardsMessage;
          // Only process if not from self
          if (playMsg.senderId !== peerId) {
            gamePlayCards(playMsg.playerId, playMsg.cards);
          }
          // If host, relay to other players
          if (isHost) {
            connections.forEach((conn, connPeerId) => {
              if (connPeerId !== playMsg.senderId && conn.open) {
                conn.send(message);
              }
            });
          }
          break;
        }

        case "pass_turn": {
          const passMsg = message as PassTurnMessage;
          // Only process if not from self
          if (passMsg.senderId !== peerId) {
            gamePass(passMsg.playerId);
          }
          // If host, relay to other players
          if (isHost) {
            connections.forEach((conn, connPeerId) => {
              if (connPeerId !== passMsg.senderId && conn.open) {
                conn.send(message);
              }
            });
          }
          break;
        }

        case "round_end": {
          // Handle round end notification
          break;
        }

        case "game_end": {
          // Handle game end notification
          break;
        }
      }
    },
    [peerId, isHost, connections, handleDealCards, gamePlayCards, gamePass]
  );

  /**
   * Get current player's hand
   */
  const getMyHand = useCallback(() => {
    if (!room || !peerId) return [];

    // Find self in room players
    const selfInRoom = room.players.find((p) => p.peerId === peerId);
    if (!selfInRoom) return [];

    return getPlayerHand(selfInRoom.id);
  }, [room, peerId, getPlayerHand]);

  /**
   * Check if it's my turn
   */
  const isMyTurn = useCallback(() => {
    if (!room || !peerId) return false;

    const selfInRoom = room.players.find((p) => p.peerId === peerId);
    if (!selfInRoom) return false;

    return isPlayerTurn(selfInRoom.id);
  }, [room, peerId, isPlayerTurn]);

  /**
   * Get my player ID
   */
  const getMyPlayerId = useCallback(() => {
    if (!room || !peerId) return null;

    const selfInRoom = room.players.find((p) => p.peerId === peerId);
    return selfInRoom?.id ?? null;
  }, [room, peerId]);

  return {
    // State
    phase,
    gamePlayers,
    currentHand,
    currentPlayerIndex,
    isFirstTurn,
    finishOrder,
    isHost,

    // Actions
    hostStartGame,
    playCards,
    passTurn,
    handleGameMessage,

    // Helpers
    getMyHand,
    isMyTurn,
    getMyPlayerId,
    canPlayCards,
    canPass,
  };
}
