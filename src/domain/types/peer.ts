/**
 * P2P Message Types for Slave Game
 */

import type { Card, PlayedHand } from "./card";

// Player connection health status
export type PlayerConnectionStatus = "online" | "unstable" | "offline";

// Player info sent over P2P
export interface PeerPlayer {
  peerId: string;
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  isAI?: boolean; // AI player flag
  connectionHealth?: PlayerConnectionStatus;
  lastPingTime?: number;
}

// Message types
export type MessageType =
  | "player_join"
  | "player_leave"
  | "player_ready"
  | "player_unready"
  | "game_start"
  | "game_state"
  | "deal_cards"
  | "play_cards"
  | "pass_turn"
  | "round_end"
  | "game_end"
  | "new_round"
  | "chat"
  | "ping"
  | "pong"
  | "sync_players"
  | "sync_request"
  | "sync_game_state"
  | "resume_game"
  | "player_disconnected"
  | "player_reconnected"
  | "kick_player"
  | "error";

// Base message structure
export interface BaseMessage {
  type: MessageType;
  senderId: string;
  timestamp: number;
}

// Player join message
export interface PlayerJoinMessage extends BaseMessage {
  type: "player_join";
  player: PeerPlayer;
}

// Player leave message
export interface PlayerLeaveMessage extends BaseMessage {
  type: "player_leave";
  playerId: string;
}

// Player ready message
export interface PlayerReadyMessage extends BaseMessage {
  type: "player_ready";
  playerId: string;
}

// Player unready message
export interface PlayerUnreadyMessage extends BaseMessage {
  type: "player_unready";
  playerId: string;
}

// Sync players message (host sends to new players)
export interface SyncPlayersMessage extends BaseMessage {
  type: "sync_players";
  players: PeerPlayer[];
  roomCode: string;
  roomStatus?: "waiting" | "ready" | "playing" | "finished";
}

// Game start message (host broadcasts to all players)
export interface GameStartMessage extends BaseMessage {
  type: "game_start";
  hands: Card[][]; // Cards for each player (indexed by player order)
  startingPlayerIndex: number;
}

// Deal cards message (host sends to each player individually)
export interface DealCardsMessage extends BaseMessage {
  type: "deal_cards";
  hand: Card[];
  playerIndex: number;
  startingPlayerIndex: number;
  allHandCounts: number[]; // Card count for each player (so others know hand sizes)
  // All players including AI (for client to initialize game correctly)
  allPlayers?: Array<{
    id: string;
    name: string;
    avatar: string;
    isAI?: boolean;
  }>;
}

// Play cards message
export interface PlayCardsMessage extends BaseMessage {
  type: "play_cards";
  playerId: string;
  cards: Card[];
  playedHand: PlayedHand;
}

// Pass turn message
export interface PassTurnMessage extends BaseMessage {
  type: "pass_turn";
  playerId: string;
}

// Round end message
export interface RoundEndMessage extends BaseMessage {
  type: "round_end";
  winnerId: string; // Player who won the round
}

// Game end message
export interface GameEndMessage extends BaseMessage {
  type: "game_end";
  rankings: { playerId: string; rank: number }[]; // 1=King, 2=Noble, 3=Commoner, 4=Slave
}

// New round message (host broadcasts to start a new round)
export interface NewRoundMessage extends BaseMessage {
  type: "new_round";
}

// Chat message
export interface ChatMessage extends BaseMessage {
  type: "chat";
  message: string;
  playerName: string;
}

// Ping/Pong for connection check
export interface PingMessage extends BaseMessage {
  type: "ping";
}

export interface PongMessage extends BaseMessage {
  type: "pong";
}

// Sync request message (client asks host for current game state)
export interface SyncRequestMessage extends BaseMessage {
  type: "sync_request";
  playerId: string;
}

// Sync game state message (host sends current game state)
export interface SyncGameStateMessage extends BaseMessage {
  type: "sync_game_state";
  gameState: {
    phase: string;
    currentPlayerIndex: number;
    roundNumber: number;
    finishOrder: string[];
    lastPlayerId: string | null;
    passCount: number;
    // Hand counts for each player
    handCounts: number[];
  };
  players: PeerPlayer[];
}

// Resume game message (host sends to reconnecting player)
export interface ResumeGameMessage extends BaseMessage {
  type: "resume_game";
  hand: Card[];
  playerIndex: number;
  gameState: {
    phase: string;
    currentPlayerIndex: number;
    roundNumber: number;
    finishOrder: string[];
    lastPlayerId: string | null;
    passCount: number;
    isFirstTurn: boolean;
    currentHand: PlayedHand | null;
  };
  discardPile: PlayedHand[];
  allPlayers: {
    id: string;
    name: string;
    avatar: string;
    handCount: number;
    hasPassed: boolean;
    isCurrentTurn: boolean;
    finishOrder?: number;
  }[];
}

// Player disconnected notification
export interface PlayerDisconnectedMessage extends BaseMessage {
  type: "player_disconnected";
  playerId: string;
  playerName: string;
}

// Player reconnected notification
export interface PlayerReconnectedMessage extends BaseMessage {
  type: "player_reconnected";
  playerId: string;
  playerName: string;
}

// Error message
export interface ErrorMessage extends BaseMessage {
  type: "error";
  error: string;
}

// Union type for all messages
export type PeerMessage =
  | PlayerJoinMessage
  | PlayerLeaveMessage
  | PlayerReadyMessage
  | PlayerUnreadyMessage
  | SyncPlayersMessage
  | GameStartMessage
  | DealCardsMessage
  | PlayCardsMessage
  | PassTurnMessage
  | RoundEndMessage
  | GameEndMessage
  | NewRoundMessage
  | ChatMessage
  | PingMessage
  | PongMessage
  | SyncRequestMessage
  | SyncGameStateMessage
  | ResumeGameMessage
  | PlayerDisconnectedMessage
  | PlayerReconnectedMessage
  | ErrorMessage;

// Connection status
export type ConnectionStatus =
  | "idle"
  | "initializing"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

// Room state
export interface RoomState {
  roomCode: string;
  players: PeerPlayer[];
  isHost: boolean;
  hostPeerId: string | null;
  status: "waiting" | "ready" | "playing" | "finished";
}
