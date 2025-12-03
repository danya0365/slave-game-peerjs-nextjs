/**
 * AI Service for Slave Game
 * Implements AI logic for playing the game
 */

import type { Card, PlayedHand } from "../types/card";
import {
  containsThreeOfClubs,
  createPlayedHand,
  getValidMoves,
  groupByRank,
  sortCards,
} from "../utils/cardUtils";

/**
 * AI Difficulty levels
 */
export type AIDifficulty = "easy" | "medium" | "hard";

/**
 * AI Player configuration
 */
export interface AIPlayerConfig {
  difficulty: AIDifficulty;
  thinkingDelayMs: number; // Delay before AI makes a move (for realism)
}

/**
 * Default AI configuration
 */
export const DEFAULT_AI_CONFIG: AIPlayerConfig = {
  difficulty: "medium",
  thinkingDelayMs: 1500, // 1.5 seconds
};

/**
 * AI Names for players
 */
export const AI_NAMES = ["AI-แดง", "AI-เขียว", "AI-น้ำเงิน", "AI-ม่วง"];

/**
 * AI Avatars for players
 */
export const AI_AVATARS = ["🤖", "🎮", "💻", "🎯"];

/**
 * Generate a unique AI player ID
 */
export function generateAIPlayerId(index: number): string {
  return `ai-player-${index}-${Date.now()}`;
}

/**
 * Check if a player ID is an AI player
 */
export function isAIPlayer(playerId: string): boolean {
  return playerId.startsWith("ai-player-");
}

/**
 * AI Decision Result
 */
export interface AIDecision {
  action: "play" | "pass";
  cards?: Card[];
  playedHand?: PlayedHand;
}

/**
 * Make AI decision based on current game state
 */
export function makeAIDecision(
  hand: Card[],
  currentHand: PlayedHand | null,
  isFirstTurn: boolean,
  difficulty: AIDifficulty = "medium"
): AIDecision {
  // Check if this is a "must play" situation (can't pass)
  // - First turn of the game (must include 3♣)
  // - Fresh round after everyone passed (currentHand is null)
  const mustPlay = isFirstTurn || currentHand === null;

  // Get all valid moves
  const validMoves = getValidMoves(hand, currentHand, isFirstTurn);

  // No valid moves - must pass (if allowed)
  if (validMoves.length === 0) {
    // On first turn, must find a move with 3♣
    if (isFirstTurn) {
      // This shouldn't happen, but just in case
      const threeOfClubsCard = hand.find(
        (c) => c.suit === "club" && c.rank === "3"
      );
      if (threeOfClubsCard) {
        const playedHand = createPlayedHand([threeOfClubsCard], "ai");
        return {
          action: "play",
          cards: [threeOfClubsCard],
          playedHand: playedHand!,
        };
      }
    }
    // If must play but no valid moves, play the lowest single card
    if (mustPlay && hand.length > 0) {
      const sortedHand = sortCards(hand);
      const lowestCard = sortedHand[0];
      const playedHand = createPlayedHand([lowestCard], "ai");
      if (playedHand) {
        return {
          action: "play",
          cards: [lowestCard],
          playedHand: playedHand,
        };
      }
    }
    return { action: "pass" };
  }

  // First turn - must include 3♣
  if (isFirstTurn) {
    const movesWithThreeClubs = validMoves.filter((move) =>
      containsThreeOfClubs(move)
    );
    if (movesWithThreeClubs.length > 0) {
      const selectedMove = selectMoveByDifficulty(
        movesWithThreeClubs,
        hand,
        difficulty,
        true
      );
      const playedHand = createPlayedHand(selectedMove, "ai");
      return {
        action: "play",
        cards: selectedMove,
        playedHand: playedHand!,
      };
    }
  }

  // Select move based on difficulty (pass mustPlay flag to prevent random pass)
  const selectedMove = selectMoveByDifficulty(
    validMoves,
    hand,
    difficulty,
    false,
    mustPlay
  );

  if (selectedMove.length === 0) {
    // If mustPlay is true, we should NOT return pass - pick any valid move
    if (mustPlay && validMoves.length > 0) {
      const playedHand = createPlayedHand(validMoves[0], "ai");
      return {
        action: "play",
        cards: validMoves[0],
        playedHand: playedHand!,
      };
    }
    return { action: "pass" };
  }

  const playedHand = createPlayedHand(selectedMove, "ai");
  return {
    action: "play",
    cards: selectedMove,
    playedHand: playedHand!,
  };
}

/**
 * Select a move based on AI difficulty
 */
function selectMoveByDifficulty(
  validMoves: Card[][],
  hand: Card[],
  difficulty: AIDifficulty,
  isFirstTurn: boolean = false,
  mustPlay: boolean = false
): Card[] {
  if (validMoves.length === 0) return [];

  switch (difficulty) {
    case "easy":
      return selectMoveEasy(validMoves);
    case "medium":
      return selectMoveMedium(validMoves, hand, isFirstTurn, mustPlay);
    case "hard":
      return selectMoveHard(validMoves, hand, isFirstTurn);
    default:
      return selectMoveMedium(validMoves, hand, isFirstTurn, mustPlay);
  }
}

/**
 * Easy AI: Random move selection
 */
function selectMoveEasy(validMoves: Card[][]): Card[] {
  const randomIndex = Math.floor(Math.random() * validMoves.length);
  return validMoves[randomIndex];
}

/**
 * Medium AI: Prefer playing lowest cards, sometimes passes
 */
function selectMoveMedium(
  validMoves: Card[][],
  hand: Card[],
  isFirstTurn: boolean,
  mustPlay: boolean = false
): Card[] {
  // Sometimes pass (20% chance) if not first turn, not mustPlay, and have valid moves
  if (!isFirstTurn && !mustPlay && Math.random() < 0.2) {
    return [];
  }

  // Sort moves by the lowest high card value (prefer playing weaker cards first)
  const sortedMoves = [...validMoves].sort((a, b) => {
    const aHighCard = getHighCard(a);
    const bHighCard = getHighCard(b);
    return aHighCard.value - bHighCard.value;
  });

  // Pick from the bottom 30% of moves (weaker moves)
  const bottomIndex = Math.min(
    Math.floor(sortedMoves.length * 0.3) || 1,
    sortedMoves.length
  );
  const randomIndex = Math.floor(Math.random() * bottomIndex);
  return sortedMoves[randomIndex];
}

/**
 * Hard AI: Strategic play - save 2s, play combos when advantageous
 */
function selectMoveHard(
  validMoves: Card[][],
  hand: Card[],
  _isFirstTurn: boolean
): Card[] {
  // Analyze hand
  const _twosInHand = hand.filter((c) => c.rank === "2");
  const groups = groupByRank(hand);

  // Score each move
  const scoredMoves = validMoves.map((move) => {
    let score = 0;

    // Prefer playing smaller cards first
    const avgValue = move.reduce((sum, c) => sum + c.value, 0) / move.length;
    score -= avgValue * 2; // Lower value = higher score

    // Avoid playing 2s unless necessary
    const twosInMove = move.filter((c) => c.rank === "2").length;
    score -= twosInMove * 50;

    // Prefer playing larger combos (pairs, triples) to clear hand faster
    score += move.length * 5;

    // If hand is small (< 5 cards), be more aggressive
    if (hand.length < 5) {
      score += 20; // Bonus for any play when hand is small
    }

    // Bonus for clearing matching groups (don't break up pairs/triples)
    const moveRank = move[0].rank;
    const groupSize = groups[moveRank]?.length ?? 0;
    if (move.length === groupSize) {
      score += 10; // Bonus for playing all cards of a rank
    }

    return { move, score };
  });

  // Sort by score (higher is better)
  scoredMoves.sort((a, b) => b.score - a.score);

  // Pick the best move (occasionally pick 2nd or 3rd best for unpredictability)
  const topIndex = Math.min(3, scoredMoves.length);
  const randomFactor = Math.floor(Math.random() * topIndex);
  return scoredMoves[randomFactor].move;
}

/**
 * Get the highest card from a set of cards
 */
function getHighCard(cards: Card[]): Card {
  return cards.reduce((highest, card) =>
    card.value > highest.value ||
    (card.value === highest.value && card.suitValue > highest.suitValue)
      ? card
      : highest
  );
}

/**
 * Create AI players for empty slots
 */
export function createAIPlayers(
  currentPlayerCount: number,
  targetPlayerCount: number = 4
): Array<{
  id: string;
  name: string;
  avatar: string;
  isAI: boolean;
}> {
  const aiPlayers: Array<{
    id: string;
    name: string;
    avatar: string;
    isAI: boolean;
  }> = [];

  for (let i = currentPlayerCount; i < targetPlayerCount; i++) {
    const aiIndex = i - currentPlayerCount;
    aiPlayers.push({
      id: generateAIPlayerId(aiIndex),
      name: AI_NAMES[aiIndex % AI_NAMES.length],
      avatar: AI_AVATARS[aiIndex % AI_AVATARS.length],
      isAI: true,
    });
  }

  return aiPlayers;
}
