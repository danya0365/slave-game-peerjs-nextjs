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
  score: number; // Accumulated score across rounds
  roundScore: number; // Score earned this round
  isAI?: boolean; // AI player flag
}

// Score constants
export const RANK_SCORES: Record<PlayerRank, number> = {
  king: 3,
  noble: 2,
  commoner: 1,
  slave: 0,
};

// Turn timer duration in seconds
export const TURN_TIMER_DURATION = 30;

// Game state
interface GameState {
  // Game info
  phase: GamePhase;
  roundNumber: number;

  // Turn timer
  turnDeadline: number | null; // Unix timestamp when current turn expires
  currentTurnPlayerId: string | null; // Player whose turn it is (for timer sync)

  // Players
  players: GamePlayer[];
  currentPlayerIndex: number;

  // Table state
  currentHand: PlayedHand | null;
  lastPlayerId: string | null;
  passCount: number;
  discardPile: PlayedHand[]; // All played hands on the table

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
  checkRoundEnd: () => boolean; // Returns true if round ended
  checkGameEnd: () => void;

  // Reset
  resetGame: () => void;
  resetRound: () => void;

  // Turn timer
  setTurnDeadline: (deadline: number, playerId: string) => void;
  clearTurnDeadline: () => void;
}

type GameStore = GameState & GameActions;

const initialState: GameState = {
  phase: "waiting",
  roundNumber: 0,
  turnDeadline: null,
  currentTurnPlayerId: null,
  players: [],
  currentPlayerIndex: 0,
  currentHand: null,
  lastPlayerId: null,
  passCount: 0,
  discardPile: [],
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
      score: 0,
      roundScore: 0,
      isAI: (info as { isAI?: boolean }).isAI ?? false,
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
      discardPile: [...state.discardPile, playedHand],
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

    // Check if round should end - if true, turn is already set to lastPlayer
    const roundEnded = get().checkRoundEnd();

    // Only call nextTurn if round didn't end
    if (!roundEnded && get().phase === "playing") {
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
      discardPile: [...state.discardPile, playedHand],
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

    // Check if round should end - if true, turn is already set to lastPlayer
    const roundEnded = get().checkRoundEnd();

    // Only call nextTurn if round didn't end
    if (!roundEnded && get().phase === "playing") {
      get().nextTurn();
    }
  },

  // Check if player can play these cards
  canPlayCards: (playerId, cards) => {
    const {
      players,
      currentPlayerIndex,
      currentHand,
      isFirstTurn,
      phase,
      finishOrder,
    } = get();

    if (phase !== "playing") return false;
    if (cards.length === 0) return false;

    // Player already finished
    if (finishOrder.includes(playerId)) return false;

    const playerIndex = players.findIndex((p) => p.id === playerId);
    if (playerIndex !== currentPlayerIndex) return false;

    const player = players[playerIndex];

    // Player has no cards
    if (player.hand.length === 0) return false;

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
    const {
      players,
      currentPlayerIndex,
      isFirstTurn,
      phase,
      currentHand,
      finishOrder,
    } = get();

    if (phase !== "playing") return false;
    if (isFirstTurn) return false;

    // Player already finished
    if (finishOrder.includes(playerId)) return false;

    // Cannot pass if no current hand (round just reset - must play new cards)
    if (currentHand === null) return false;

    const playerIndex = players.findIndex((p) => p.id === playerId);
    if (playerIndex !== currentPlayerIndex) return false;

    // Player has no cards
    if (players[playerIndex].hand.length === 0) return false;

    return true;
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
    const { players, currentPlayerIndex, finishOrder, lastPlayerId } = get();

    // Find next active player
    let nextIndex = currentPlayerIndex;
    let attempts = 0;

    do {
      nextIndex = (nextIndex + 1) % 4;
      attempts++;

      // Skip players who have finished OR passed this round
      const candidate = players[nextIndex];
      const hasFinished = finishOrder.includes(candidate.id);
      const hasPassed = candidate.hasPassed;

      // Only stop if player hasn't finished AND hasn't passed
      if (!hasFinished && !hasPassed) {
        break;
      }
    } while (attempts < 4);

    let nextPlayer = players[nextIndex];

    // Safety check: if the selected next player has finished, skip to next active
    if (finishOrder.includes(nextPlayer.id)) {
      // All remaining players might have finished - check game end
      const activePlayers = players.filter((p) => !finishOrder.includes(p.id));
      if (activePlayers.length <= 1) {
        // Game should end
        get().checkGameEnd();
        return;
      }
      // Find any active player
      for (let i = 0; i < 4; i++) {
        const idx = (nextIndex + i) % 4;
        if (!finishOrder.includes(players[idx].id)) {
          nextIndex = idx;
          nextPlayer = players[nextIndex]; // Update nextPlayer reference
          break;
        }
      }
    }

    // Check if next player is the same as lastPlayer (everyone else passed)
    // This means round should reset - the next player won this round
    if (nextPlayer && nextPlayer.id === lastPlayerId) {
      // Check if lastPlayer has finished - if so, find next active player
      const lastPlayerFinished = finishOrder.includes(lastPlayerId);

      let roundWinnerIndex = nextIndex;
      if (lastPlayerFinished) {
        // Find next active player after the finished player
        let searchIndex = nextIndex;
        for (let i = 0; i < 4; i++) {
          searchIndex = (searchIndex + 1) % 4;
          const candidate = players[searchIndex];
          if (!finishOrder.includes(candidate.id)) {
            roundWinnerIndex = searchIndex;
            break;
          }
        }
      }

      // Reset the round - winner starts fresh
      const updatedPlayers = players.map((player, index) => ({
        ...player,
        hasPassed: false,
        isCurrentTurn: index === roundWinnerIndex,
      }));

      set({
        players: updatedPlayers,
        currentPlayerIndex: roundWinnerIndex,
        currentHand: null, // Clear the table - player can play anything
        discardPile: [], // Clear discard pile for new round
        passCount: 0,
        roundNumber: get().roundNumber + 1,
      });
      return;
    }

    // Normal turn change
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
  // Returns true if round ended and turn was set to lastPlayer
  checkRoundEnd: () => {
    const { passCount, players, finishOrder, lastPlayerId } = get();

    // Count active players (not finished)
    const activePlayers = players.filter((p) => !finishOrder.includes(p.id));

    // Round ends when all other active players have passed
    if (passCount >= activePlayers.length - 1 && lastPlayerId) {
      // Check if lastPlayer has finished - if so, find next active player
      const lastPlayerFinished = finishOrder.includes(lastPlayerId);
      let roundWinnerIndex = players.findIndex((p) => p.id === lastPlayerId);

      if (lastPlayerFinished) {
        // Find next active player after the finished player
        for (let i = 1; i <= 4; i++) {
          const searchIndex = (roundWinnerIndex + i) % 4;
          const candidate = players[searchIndex];
          if (!finishOrder.includes(candidate.id)) {
            roundWinnerIndex = searchIndex;
            break;
          }
        }
      }

      // Reset for new round
      const updatedPlayers = players.map((player, index) => ({
        ...player,
        hasPassed: false,
        isCurrentTurn: index === roundWinnerIndex,
      }));

      set({
        players: updatedPlayers,
        currentHand: null,
        discardPile: [], // Clear discard pile for new round
        passCount: 0,
        currentPlayerIndex: roundWinnerIndex,
        roundNumber: get().roundNumber + 1,
      });

      return true; // Round ended, turn already set
    }

    return false; // Round didn't end, need to call nextTurn
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

      // Assign ranks and calculate scores
      const ranks: PlayerRank[] = ["king", "noble", "commoner", "slave"];
      const updatedPlayers = players.map((player) => {
        const orderIndex = finalOrder.indexOf(player.id);
        const rank = orderIndex >= 0 ? ranks[orderIndex] : null;
        const roundScore = rank ? RANK_SCORES[rank] : 0;

        return {
          ...player,
          rank,
          finishOrder: orderIndex >= 0 ? orderIndex + 1 : null,
          roundScore,
          score: player.score + roundScore, // Add to accumulated score
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

  // Reset for new round (keep players and accumulated scores)
  resetRound: () => {
    const { players } = get();

    // Keep player info and accumulated scores but reset round state
    const resetPlayers = players.map((player) => ({
      ...player,
      hand: [],
      isCurrentTurn: false,
      hasPassed: false,
      finishOrder: null,
      rank: null,
      roundScore: 0, // Reset round score
      // score is preserved!
    }));

    set({
      phase: "waiting",
      currentPlayerIndex: 0,
      currentHand: null,
      lastPlayerId: null,
      passCount: 0,
      discardPile: [],
      isFirstTurn: true,
      finishOrder: [],
      players: resetPlayers,
      turnDeadline: null,
      currentTurnPlayerId: null,
      // roundNumber is preserved for next round
    });
  },

  // Set turn deadline
  setTurnDeadline: (deadline, playerId) => {
    set({
      turnDeadline: deadline,
      currentTurnPlayerId: playerId,
    });
  },

  // Clear turn deadline
  clearTurnDeadline: () => {
    set({
      turnDeadline: null,
      currentTurnPlayerId: null,
    });
  },
}));

// Selector hooks
export const useGamePhase = () => useGameStore((state) => state.phase);
export const useGamePlayers = () => useGameStore((state) => state.players);
export const useCurrentHand = () => useGameStore((state) => state.currentHand);
export const useIsFirstTurn = () => useGameStore((state) => state.isFirstTurn);
export const useFinishOrder = () => useGameStore((state) => state.finishOrder);
export const useTurnDeadline = () =>
  useGameStore((state) => state.turnDeadline);
export const useCurrentTurnPlayerId = () =>
  useGameStore((state) => state.currentTurnPlayerId);
