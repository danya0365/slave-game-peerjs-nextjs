import { Schema, type, MapSchema } from "@colyseus/schema";

/**
 * Player Schema
 * Represents a player in the game
 */
export class Player extends Schema {
  @type("string") id: string = "";
  @type("string") username: string = "";
  @type("string") characterType: string = "warrior"; // warrior, mage, archer, rogue
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") z: number = 0;
  @type("number") rotation: number = 0;
  @type("boolean") isMoving: boolean = false;
  @type("number") timestamp: number = 0;
}

/**
 * NPC Schema
 * Represents a non-player character in the game
 */
export class NPC extends Schema {
  @type("string") id: string = "";
  @type("string") name: string = "";
  @type("string") type: string = "villager"; // villager, merchant, guard, animal
  @type("string") behavior: string = "idle"; // idle, wander, patrol
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") z: number = 0;
  @type("number") rotation: number = 0;
  @type("number") speed: number = 1.5;
  @type("number") health: number = 100;
  @type("number") maxHealth: number = 100;
  @type("boolean") isInteractable: boolean = true;
}

/**
 * Game State Schema
 * Root state that gets synchronized with all clients
 */
export class GameState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  @type({ map: NPC }) npcs = new MapSchema<NPC>();
  @type("number") serverTime: number = Date.now();
}
