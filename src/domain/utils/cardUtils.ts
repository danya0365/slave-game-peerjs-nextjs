/**
 * Card Utilities for Slave Game
 */

import type { Card, HandType, PlayedHand, Rank, Suit } from "../types/card";
import { ALL_RANKS, ALL_SUITS, RANK_VALUES, SUIT_VALUES } from "../types/card";

/**
 * Create a single card
 */
export function createCard(suit: Suit, rank: Rank): Card {
  return {
    id: `${suit}-${rank}`,
    suit,
    rank,
    value: RANK_VALUES[rank],
    suitValue: SUIT_VALUES[suit],
  };
}

/**
 * Generate a full 52-card deck
 */
export function generateDeck(): Card[] {
  const deck: Card[] = [];

  for (const suit of ALL_SUITS) {
    for (const rank of ALL_RANKS) {
      deck.push(createCard(suit, rank));
    }
  }

  return deck;
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Deal cards to 4 players (13 cards each)
 */
export function dealCards(): Card[][] {
  const deck = shuffle(generateDeck());
  const hands: Card[][] = [[], [], [], []];

  for (let i = 0; i < 52; i++) {
    hands[i % 4].push(deck[i]);
  }

  // Sort each hand
  return hands.map((hand) => sortCards(hand));
}

/**
 * Sort cards by value (high to low), then by suit
 */
export function sortCards(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => {
    // First compare by value (descending)
    if (b.value !== a.value) {
      return b.value - a.value;
    }
    // Then by suit (descending)
    return b.suitValue - a.suitValue;
  });
}

/**
 * Compare two cards
 * Returns: positive if card1 > card2, negative if card1 < card2, 0 if equal
 */
export function compareCards(card1: Card, card2: Card): number {
  if (card1.value !== card2.value) {
    return card1.value - card2.value;
  }
  return card1.suitValue - card2.suitValue;
}

/**
 * Get the highest card from a set of cards
 */
export function getHighCard(cards: Card[]): Card {
  return cards.reduce((highest, card) =>
    compareCards(card, highest) > 0 ? card : highest
  );
}

/**
 * Check if cards are all the same rank
 */
export function isSameRank(cards: Card[]): boolean {
  if (cards.length < 2) return true;
  return cards.every((card) => card.rank === cards[0].rank);
}

/**
 * Check if cards form a straight (consecutive ranks)
 */
export function isStraight(cards: Card[]): boolean {
  if (cards.length < 3) return false;

  // Sort by value ascending
  const sorted = [...cards].sort((a, b) => a.value - b.value);

  // Check if consecutive
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].value - sorted[i - 1].value !== 1) {
      return false;
    }
  }

  // Special rule: 2 cannot be in a straight (it's the highest card)
  if (cards.some((card) => card.rank === "2")) {
    return false;
  }

  return true;
}

/**
 * Detect the hand type from selected cards
 */
export function detectHandType(cards: Card[]): HandType | null {
  if (cards.length === 0) return null;

  // Single card
  if (cards.length === 1) {
    return "single";
  }

  // Check for same rank (pair, triple, four)
  if (isSameRank(cards)) {
    switch (cards.length) {
      case 2:
        return "pair";
      case 3:
        return "triple";
      case 4:
        return "four";
    }
  }

  // Check for straight (3+ consecutive cards)
  if (cards.length >= 3 && isStraight(cards)) {
    return "straight";
  }

  // Check for pair straight (2+ consecutive pairs)
  if (cards.length >= 4 && cards.length % 2 === 0) {
    const pairs = groupByRank(cards);
    if (
      Object.values(pairs).every((group) => group.length === 2) &&
      isPairStraight(cards)
    ) {
      return "pair_straight";
    }
  }

  // Check for triple straight (2+ consecutive triples)
  if (cards.length >= 6 && cards.length % 3 === 0) {
    const triples = groupByRank(cards);
    if (
      Object.values(triples).every((group) => group.length === 3) &&
      isTripleStraight(cards)
    ) {
      return "triple_straight";
    }
  }

  return null;
}

/**
 * Group cards by rank
 */
export function groupByRank(cards: Card[]): Record<Rank, Card[]> {
  return cards.reduce((groups, card) => {
    if (!groups[card.rank]) {
      groups[card.rank] = [];
    }
    groups[card.rank].push(card);
    return groups;
  }, {} as Record<Rank, Card[]>);
}

/**
 * Check if cards form a pair straight
 */
function isPairStraight(cards: Card[]): boolean {
  const groups = groupByRank(cards);
  const ranks = Object.keys(groups) as Rank[];

  if (ranks.length < 2) return false;

  // Sort ranks by value
  const sortedRanks = ranks.sort((a, b) => RANK_VALUES[a] - RANK_VALUES[b]);

  // Check consecutive
  for (let i = 1; i < sortedRanks.length; i++) {
    if (RANK_VALUES[sortedRanks[i]] - RANK_VALUES[sortedRanks[i - 1]] !== 1) {
      return false;
    }
  }

  // No 2s allowed
  return !ranks.includes("2");
}

/**
 * Check if cards form a triple straight
 */
function isTripleStraight(cards: Card[]): boolean {
  const groups = groupByRank(cards);
  const ranks = Object.keys(groups) as Rank[];

  if (ranks.length < 2) return false;

  // Sort ranks by value
  const sortedRanks = ranks.sort((a, b) => RANK_VALUES[a] - RANK_VALUES[b]);

  // Check consecutive
  for (let i = 1; i < sortedRanks.length; i++) {
    if (RANK_VALUES[sortedRanks[i]] - RANK_VALUES[sortedRanks[i - 1]] !== 1) {
      return false;
    }
  }

  // No 2s allowed
  return !ranks.includes("2");
}

/**
 * Create a PlayedHand from cards
 */
export function createPlayedHand(
  cards: Card[],
  playerId: string
): PlayedHand | null {
  const type = detectHandType(cards);
  if (!type) return null;

  return {
    cards: sortCards(cards),
    type,
    highCard: getHighCard(cards),
    playerId,
  };
}

/**
 * Check if a hand can beat the current hand on the table
 */
export function canBeat(
  newHand: PlayedHand,
  currentHand: PlayedHand | null
): boolean {
  // If no current hand, any valid hand can be played
  if (!currentHand) return true;

  // Must be same type (with some exceptions for special beats)
  if (newHand.type !== currentHand.type) {
    // Triple (ตอง) can beat any single card
    if (newHand.type === "triple" && currentHand.type === "single") {
      return true;
    }

    // Four of a kind can beat any single card
    if (newHand.type === "four" && currentHand.type === "single") {
      return true;
    }

    // Four of a kind can beat any pair
    if (newHand.type === "four" && currentHand.type === "pair") {
      return true;
    }

    return false;
  }

  // Same type - must have same number of cards
  if (newHand.cards.length !== currentHand.cards.length) {
    return false;
  }

  // Compare high cards
  return compareCards(newHand.highCard, currentHand.highCard) > 0;
}

/**
 * Find the player who has 3♣ (starts the game)
 */
export function findStartingPlayer(hands: Card[][]): number {
  for (let i = 0; i < hands.length; i++) {
    if (hands[i].some((card) => card.suit === "club" && card.rank === "3")) {
      return i;
    }
  }
  return 0; // Fallback
}

/**
 * Check if a hand contains 3♣
 */
export function containsThreeOfClubs(cards: Card[]): boolean {
  return cards.some((card) => card.suit === "club" && card.rank === "3");
}

/**
 * Get valid moves from a hand given the current table state
 */
export function getValidMoves(
  hand: Card[],
  currentHand: PlayedHand | null,
  mustIncludeThreeOfClubs: boolean = false
): Card[][] {
  const validMoves: Card[][] = [];

  // Generate all possible combinations
  const combinations = getAllCombinations(hand);

  for (const combo of combinations) {
    // Must include 3♣ if required
    if (mustIncludeThreeOfClubs && !containsThreeOfClubs(combo)) {
      continue;
    }

    const playedHand = createPlayedHand(combo, "");
    if (!playedHand) continue;

    if (canBeat(playedHand, currentHand)) {
      validMoves.push(combo);
    }
  }

  return validMoves;
}

/**
 * Get all possible card combinations from a hand
 */
function getAllCombinations(cards: Card[]): Card[][] {
  const result: Card[][] = [];

  // Singles
  for (const card of cards) {
    result.push([card]);
  }

  // Pairs, Triples, Fours
  const groups = groupByRank(cards);
  for (const rank in groups) {
    const group = groups[rank as Rank];

    // Pairs
    if (group.length >= 2) {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          result.push([group[i], group[j]]);
        }
      }
    }

    // Triples
    if (group.length >= 3) {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          for (let k = j + 1; k < group.length; k++) {
            result.push([group[i], group[j], group[k]]);
          }
        }
      }
    }

    // Four of a kind
    if (group.length === 4) {
      result.push([...group]);
    }
  }

  // Straights (3-13 cards)
  const sortedByValue = [...cards].sort((a, b) => a.value - b.value);
  for (let length = 3; length <= sortedByValue.length; length++) {
    for (let start = 0; start <= sortedByValue.length - length; start++) {
      const combo = sortedByValue.slice(start, start + length);
      if (isStraight(combo)) {
        result.push(combo);
      }
    }
  }

  return result;
}

/**
 * Check if player has any valid moves
 */
export function hasValidMoves(
  hand: Card[],
  currentHand: PlayedHand | null,
  mustIncludeThreeOfClubs: boolean = false
): boolean {
  return getValidMoves(hand, currentHand, mustIncludeThreeOfClubs).length > 0;
}
