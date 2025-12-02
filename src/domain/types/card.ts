/**
 * Card Types for Slave Game
 */

// Card suits (ดอกไพ่) - ordered from highest to lowest
export type Suit = "spade" | "heart" | "diamond" | "club";

// Card ranks - 2 is highest, 3 is lowest
export type Rank =
  | "2"
  | "A"
  | "K"
  | "Q"
  | "J"
  | "10"
  | "9"
  | "8"
  | "7"
  | "6"
  | "5"
  | "4"
  | "3";

// Card interface
export interface Card {
  id: string; // Unique identifier (e.g., "spade-A")
  suit: Suit;
  rank: Rank;
  value: number; // Numeric value for comparison (2=15, A=14, K=13... 3=3)
  suitValue: number; // Suit value for comparison (spade=4, heart=3, diamond=2, club=1)
}

// Hand types (รูปแบบการลงไพ่)
export type HandType =
  | "single" // ใบเดียว
  | "pair" // คู่
  | "triple" // ตอง
  | "four" // โฟร์
  | "straight" // สเตรท (เรียง 3+ ใบ)
  | "pair_straight" // คู่เรียง (2+ คู่)
  | "triple_straight"; // ตองเรียง (2+ ตอง)

// Played hand (ไพ่ที่ลง)
export interface PlayedHand {
  cards: Card[];
  type: HandType;
  highCard: Card; // ไพ่สูงสุดในมือ
  playerId: string;
}

// Suit display info
export const SUIT_DISPLAY: Record<
  Suit,
  { symbol: string; name: string; color: string }
> = {
  spade: { symbol: "♠", name: "โพดำ", color: "text-black" },
  heart: { symbol: "♥", name: "โพแดง", color: "text-red-500" },
  diamond: { symbol: "♦", name: "ข้าวหลามตัด", color: "text-red-500" },
  club: { symbol: "♣", name: "ดอกจิก", color: "text-black" },
};

// Rank display info
export const RANK_DISPLAY: Record<Rank, { display: string; thaiName: string }> =
  {
    "2": { display: "2", thaiName: "สอง" },
    A: { display: "A", thaiName: "เอซ" },
    K: { display: "K", thaiName: "คิง" },
    Q: { display: "Q", thaiName: "ควีน" },
    J: { display: "J", thaiName: "แจ็ค" },
    "10": { display: "10", thaiName: "สิบ" },
    "9": { display: "9", thaiName: "เก้า" },
    "8": { display: "8", thaiName: "แปด" },
    "7": { display: "7", thaiName: "เจ็ด" },
    "6": { display: "6", thaiName: "หก" },
    "5": { display: "5", thaiName: "ห้า" },
    "4": { display: "4", thaiName: "สี่" },
    "3": { display: "3", thaiName: "สาม" },
  };

// Rank values for comparison (2 is highest = 15)
export const RANK_VALUES: Record<Rank, number> = {
  "2": 15,
  A: 14,
  K: 13,
  Q: 12,
  J: 11,
  "10": 10,
  "9": 9,
  "8": 8,
  "7": 7,
  "6": 6,
  "5": 5,
  "4": 4,
  "3": 3,
};

// Suit values for comparison (spade is highest = 4)
export const SUIT_VALUES: Record<Suit, number> = {
  spade: 4,
  heart: 3,
  diamond: 2,
  club: 1,
};

// All suits in order
export const ALL_SUITS: Suit[] = ["spade", "heart", "diamond", "club"];

// All ranks in order (high to low)
export const ALL_RANKS: Rank[] = [
  "2",
  "A",
  "K",
  "Q",
  "J",
  "10",
  "9",
  "8",
  "7",
  "6",
  "5",
  "4",
  "3",
];

// Player position types
export type PlayerPosition = "bottom" | "left" | "top" | "right";

// Game result rankings
export type PlayerRank = "king" | "noble" | "commoner" | "slave";

export const PLAYER_RANK_DISPLAY: Record<
  PlayerRank,
  { name: string; emoji: string }
> = {
  king: { name: "เจ้านาย", emoji: "👑" },
  noble: { name: "ไพร่", emoji: "🥈" },
  commoner: { name: "ประชาชน", emoji: "🥉" },
  slave: { name: "ทาส", emoji: "⛓️" },
};
