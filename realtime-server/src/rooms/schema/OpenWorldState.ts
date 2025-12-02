import { ArraySchema, Schema, type } from "@colyseus/schema";

/**
 * Player Schema for Open World
 * Uses array-based structure with clientId to track which client controls which player
 */
export class OpenWorldPlayer extends Schema {
  @type("string") id: string = "";
  @type("string") clientId: string = ""; // Which client is controlling this player
  @type("string") username: string = "";

  // Position (world coordinates)
  @type("number") x: number = 0;
  @type("number") y: number = 0;

  // Movement state
  @type("number") velocityX: number = 0;
  @type("number") velocityY: number = 0;
  @type("boolean") isRunning: boolean = false;
  @type("boolean") isMoving: boolean = false;

  // Stats
  @type("number") health: number = 100;
  @type("number") stamina: number = 100;
  @type("boolean") isInvincible: boolean = true;

  // Server timestamp for this state
  @type("number") timestamp: number = 0;

  // Input sequence number for client prediction
  @type("number") lastProcessedInput: number = 0;
}

/**
 * Building Schema
 * Represents buildings placed in the world
 */
export class Building extends Schema {
  @type("string") id: string = "";
  @type("string") placedBy: string = ""; // clientId who placed it
  @type("number") worldX: number = 0;
  @type("number") worldY: number = 0;
  @type("number") chunkX: number = 0;
  @type("number") chunkY: number = 0;
  @type("number") tileX: number = 0;
  @type("number") tileY: number = 0;
  @type("number") timestamp: number = 0;
}

/**
 * Open World State Schema
 * Root state for the open world multiplayer game
 * Uses array-based players for better performance and indexing
 */
export class OpenWorldState extends Schema {
  // Array-based players - each client can identify their controlled player by clientId
  @type([OpenWorldPlayer]) players = new ArraySchema<OpenWorldPlayer>();

  // Buildings placed in the world
  @type([Building]) buildings = new ArraySchema<Building>();

  // Server timestamp
  @type("number") serverTime: number = Date.now();

  // Server tick for synchronization
  @type("number") serverTick: number = 0;
}
