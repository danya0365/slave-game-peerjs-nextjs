import type { Card, PlayedHand, PlayerRank } from "@/src/domain/types/card";
import {
  canBeat,
  containsThreeOfClubs,
  createPlayedHand,
  dealCards,
  findStartingPlayer,
  sortCards,
} from "@/src/domain/utils/cardUtils";
import { create } from "zustand";

// Game phases
export type GamePhase =
  | "waiting" // Waiting for players
  | "dealing" // Dealing cards
  | "playing" // Game in progress
  | "round_end" // Round ended (someone cleared their hand)
  | "game_end"; // Game finished

// Player in game
export interface GamePlayer {
  id: string;
  name: string;
  avatar: string;
  hand: Card[];
  isCurrentTurn: boolean;
  hasPassed: boolean;
  finishOrder: number | null; // 1 = first out, 2 = second, etc.
  rank: PlayerRank | null;
}

// Game state
interface GameState {
  // Game info
  phase: GamePhase;
  roundNumber: number;

  // Players
  players: GamePlayer[];
  currentPlayerIndex: number;

  // Table state
  currentHand: PlayedHand | null;
  lastPlayerId: string | null;
  passCount: number;

  // First turn flag (must play 3♣)
  isFirstTurn: boolean;

  // Results
  finishOrder: string[]; // Player IDs in order of finishing
}

// Game actions
interface GameActions {
  // Setup
  initializeGame: (
    players: { id: string; name: string; avatar: string }[]
  ) => void;
  startGame: () => void;

  // Game actions
  playCards: (playerId: string, cards: Card[]) => boolean;
  pass: (playerId: string) => boolean;

  // Remote sync (for receiving plays from other players - no validation)
  applyRemotePlay: (
    playerId: string,
    cards: Card[],
    playedHand: PlayedHand
  ) => void;
  applyRemotePass: (playerId: string) => void;

  // Validation
  canPlayCards: (playerId: string, cards: Card[]) => boolean;
  canPass: (playerId: string) => boolean;

  // State queries
  getCurrentPlayer: () => GamePlayer | null;
  getPlayerHand: (playerId: string) => Card[];
  isPlayerTurn: (playerId: string) => boolean;

  // Game flow
  nextTurn: () => void;
  checkRoundEnd: () => void;
  checkGameEnd: () => void;

  // Reset
  resetGame: () => void;
  resetRound: () => void;
}

type GameStore = GameState & GameActions;

const initialState: GameState = {
  phase: "waiting",
  roundNumber: 0,
  players: [],
  currentPlayerIndex: 0,
  currentHand: null,
  lastPlayerId: null,
  passCount: 0,
  isFirstTurn: true,
  finishOrder: [],
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  // Initialize game with players
  initializeGame: (playerInfos) => {
    const players: GamePlayer[] = playerInfos.map((info) => ({
      id: info.id,
      name: info.name,
      avatar: info.avatar,
      hand: [],
      isCurrentTurn: false,
      hasPassed: false,
      finishOrder: null,
      rank: null,
    }));

    set({
      ...initialState,
      players,
      phase: "waiting",
    });
  },

  // Start the game - deal cards and set first player
  startGame: () => {
    const { players } = get();
    if (players.length !== 4) return;

    // Deal cards
    const hands = dealCards();

    // Find starting player (has 3♣)
    const startingPlayerIndex = findStartingPlayer(hands);

    // Update players with their hands
    const updatedPlayers = players.map((player, index) => ({
      ...player,
      hand: hands[index],
      isCurrentTurn: index === startingPlayerIndex,
      hasPassed: false,
      finishOrder: null,
      rank: null,
    }));

    set({
      phase: "playing",
      roundNumber: 1,
      players: updatedPlayers,
      currentPlayerIndex: startingPlayerIndex,
      currentHand: null,
      lastPlayerId: null,
      passCount: 0,
      isFirstTurn: true,
      finishOrder: [],
    });
  },

  // Play cards
  playCards: (playerId, cards) => {
    const state = get();
    const { players, currentPlayerIndex, currentHand, isFirstTurn } = state;

    // Validate
    if (!get().canPlayCards(playerId, cards)) {
      return false;
    }

    const playerIndex = players.findIndex((p) => p.id === playerId);
    if (playerIndex !== currentPlayerIndex) return false;

    // Create played hand
    const playedHand = createPlayedHand(cards, playerId);
    if (!playedHand) return false;

    // Check if can beat current hand
    if (!canBeat(playedHand, currentHand)) return false;

    // First turn must include 3♣
    if (isFirstTurn && !containsThreeOfClubs(cards)) return false;

    // Remove cards from player's hand
    const player = players[playerIndex];
    const remainingCards = player.hand.filter(
      (card) => !cards.some((c) => c.id === card.id)
    );

    // Check if player finished
    const finishedPlayers = state.finishOrder.length;
    const playerFinished = remainingCards.length === 0;

    // Update player
    const updatedPlayers = [...players];
    updatedPlayers[playerIndex] = {
      ...player,
      hand: sortCards(remainingCards),
      isCurrentTurn: false,
      hasPassed: false,
      finishOrder: playerFinished ? finishedPlayers + 1 : null,
    };

    // Reset pass count since someone played
    set({
      players: updatedPlayers,
      currentHand: playedHand,
      lastPlayerId: playerId,
      passCount: 0,
      isFirstTurn: false,
      finishOrder: playerFinished
        ? [...state.finishOrder, playerId]
        : state.finishOrder,
    });

    // Check for game end or move to next turn
    if (playerFinished) {
      get().checkGameEnd();
    }

    if (get().phase === "playing") {
      get().nextTurn();
    }

    return true;
  },

  // Pass turn
  pass: (playerId) => {
    const state = get();
    const { players, currentPlayerIndex, isFirstTurn } = state;

    // Can't pass on first turn
    if (isFirstTurn) return false;

    // Validate it's player's turn
    if (!get().canPass(playerId)) return false;

    const playerIndex = players.findIndex((p) => p.id === playerId);
    if (playerIndex !== currentPlayerIndex) return false;

    // Update player
    const updatedPlayers = [...players];
    updatedPlayers[playerIndex] = {
      ...players[playerIndex],
      isCurrentTurn: false,
      hasPassed: true,
    };

    set({
      players: updatedPlayers,
      passCount: state.passCount + 1,
    });

    // Check if round should end
    get().checkRoundEnd();

    if (get().phase === "playing") {
      get().nextTurn();
    }

    return true;
  },

  // Apply remote play (no validation - for syncing from other players)
  applyRemotePlay: (playerId, cards, playedHand) => {
    const state = get();
    const { players } = state;

    const playerIndex = players.findIndex((p) => p.id === playerId);
    if (playerIndex === -1) return;

    // Reduce card count for the player (remove cards.length dummy cards)
    const player = players[playerIndex];
    const newHandLength = Math.max(0, player.hand.length - cards.length);
    const remainingCards = player.hand.slice(0, newHandLength);

    // Check if player finished
    const finishedPlayers = state.finishOrder.length;
    const playerFinished = remainingCards.length === 0;

    // Update all players
    const updatedPlayers = players.map((p, index) => ({
      ...p,
      hand: index === playerIndex ? remainingCards : p.hand,
      isCurrentTurn: false, // Will be set by nextTurn
      hasPassed: false,
      finishOrder:
        index === playerIndex && playerFinished
          ? finishedPlayers + 1
          : p.finishOrder,
    }));

    set({
      players: updatedPlayers,
      currentHand: playedHand,
      lastPlayerId: playerId,
      passCount: 0,
      isFirstTurn: false,
      finishOrder: playerFinished
        ? [...state.finishOrder, playerId]
        : state.finishOrder,
    });

    // Check for game end or move to next turn
    if (playerFinished) {
      get().checkGameEnd();
    }

    if (get().phase === "playing") {
      get().nextTurn();
    }
  },

  // Apply remote pass (no validation - for syncing from other players)
  applyRemotePass: (playerId) => {
    const state = get();
    const { players } = state;

    const playerIndex = players.findIndex((p) => p.id === playerId);
    if (playerIndex === -1) return;

    // Update player
    const updatedPlayers = players.map((p, index) => ({
      ...p,
      isCurrentTurn: false, // Will be set by nextTurn
      hasPassed: index === playerIndex ? true : p.hasPassed,
    }));

    set({
      players: updatedPlayers,
      passCount: state.passCount + 1,
    });

    // Check if round should end
    get().checkRoundEnd();

    if (get().phase === "playing") {
      get().nextTurn();
    }
  },

  // Check if player can play these cards
  canPlayCards: (playerId, cards) => {
    const { players, currentPlayerIndex, currentHand, isFirstTurn, phase } =
      get();

    if (phase !== "playing") return false;
    if (cards.length === 0) return false;

    const playerIndex = players.findIndex((p) => p.id === playerId);
    if (playerIndex !== currentPlayerIndex) return false;

    const player = players[playerIndex];

    // Check if player has these cards
    const hasAllCards = cards.every((card) =>
      player.hand.some((c) => c.id === card.id)
    );
    if (!hasAllCards) return false;

    // Create hand and validate
    const playedHand = createPlayedHand(cards, playerId);
    if (!playedHand) return false;

    // First turn must include 3♣
    if (isFirstTurn && !containsThreeOfClubs(cards)) return false;

    // Must be able to beat current hand
    return canBeat(playedHand, currentHand);
  },

  // Check if player can pass
  canPass: (playerId) => {
    const { players, currentPlayerIndex, isFirstTurn, phase } = get();

    if (phase !== "playing") return false;
    if (isFirstTurn) return false;

    const playerIndex = players.findIndex((p) => p.id === playerId);
    return playerIndex === currentPlayerIndex;
  },

  // Get current player
  getCurrentPlayer: () => {
    const { players, currentPlayerIndex } = get();
    return players[currentPlayerIndex] || null;
  },

  // Get player's hand
  getPlayerHand: (playerId) => {
    const { players } = get();
    const player = players.find((p) => p.id === playerId);
    return player?.hand || [];
  },

  // Check if it's player's turn
  isPlayerTurn: (playerId) => {
    const { players, currentPlayerIndex, phase } = get();
    if (phase !== "playing") return false;
    const player = players[currentPlayerIndex];
    return player?.id === playerId;
  },

  // Move to next player's turn
  nextTurn: () => {
    const { players, currentPlayerIndex, finishOrder } = get();

    // Find next active player
    let nextIndex = currentPlayerIndex;
    let attempts = 0;

    do {
      nextIndex = (nextIndex + 1) % 4;
      attempts++;

      // Skip players who have finished or passed this round
      const nextPlayer = players[nextIndex];
      const hasFinished = finishOrder.includes(nextPlayer.id);

      if (!hasFinished) {
        break;
      }
    } while (attempts < 4);

    // Update current player
    const updatedPlayers = players.map((player, index) => ({
      ...player,
      isCurrentTurn: index === nextIndex,
    }));

    set({
      players: updatedPlayers,
      currentPlayerIndex: nextIndex,
    });
  },

  // Check if round should end (all other players passed)
  checkRoundEnd: () => {
    const { passCount, players, finishOrder, lastPlayerId } = get();

    // Count active players (not finished)
    const activePlayers = players.filter((p) => !finishOrder.includes(p.id));

    // Round ends when all other active players have passed
    if (passCount >= activePlayers.length - 1 && lastPlayerId) {
      // Reset for new round
      const updatedPlayers = players.map((player) => ({
        ...player,
        hasPassed: false,
        isCurrentTurn: player.id === lastPlayerId,
      }));

      const lastPlayerIndex = players.findIndex((p) => p.id === lastPlayerId);

      set({
        players: updatedPlayers,
        currentHand: null,
        passCount: 0,
        currentPlayerIndex: lastPlayerIndex,
      });
    }
  },

  // Check if game should end
  checkGameEnd: () => {
    const { finishOrder, players } = get();

    // Game ends when 3 players have finished (1 remains as slave)
    if (finishOrder.length >= 3) {
      // Find the remaining player (slave)
      const slavePlayer = players.find(
        (p) => !finishOrder.includes(p.id) && p.hand.length > 0
      );

      const finalOrder = slavePlayer
        ? [...finishOrder, slavePlayer.id]
        : finishOrder;

      // Assign ranks
      const ranks: PlayerRank[] = ["king", "noble", "commoner", "slave"];
      const updatedPlayers = players.map((player) => {
        const orderIndex = finalOrder.indexOf(player.id);
        return {
          ...player,
          rank: orderIndex >= 0 ? ranks[orderIndex] : null,
          finishOrder: orderIndex >= 0 ? orderIndex + 1 : null,
        };
      });

      set({
        phase: "game_end",
        players: updatedPlayers,
        finishOrder: finalOrder,
      });
    }
  },

  // Reset entire game
  resetGame: () => {
    set(initialState);
  },

  // Reset for new round (keep players)
  resetRound: () => {
    const { players } = get();

    // Keep player info but reset game state
    const resetPlayers = players.map((player) => ({
      ...player,
      hand: [],
      isCurrentTurn: false,
      hasPassed: false,
      finishOrder: null,
      rank: null,
    }));

    set({
      ...initialState,
      players: resetPlayers,
      phase: "waiting",
    });
  },
}));

// Selector hooks
export const useGamePhase = () => useGameStore((state) => state.phase);
export const useGamePlayers = () => useGameStore((state) => state.players);
export const useCurrentHand = () => useGameStore((state) => state.currentHand);
export const useIsFirstTurn = () => useGameStore((state) => state.isFirstTurn);
export const useFinishOrder = () => useGameStore((state) => state.finishOrder);
