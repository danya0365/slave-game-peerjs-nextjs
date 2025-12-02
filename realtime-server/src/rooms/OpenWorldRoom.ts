import { Client, Room } from "@colyseus/core";
import {
  Building,
  OpenWorldPlayer,
  OpenWorldState,
} from "./schema/OpenWorldState";

// Constants matching client-side
const PLAYER_SPEED = 150;
const PLAYER_SPRINT_SPEED = 250;
const STAMINA_DRAIN_RATE = 20;
const STAMINA_RECOVER_RATE = 10;
const SERVER_TICK_RATE = 60; // 60 FPS

interface PlayerInput {
  sequenceNumber: number;
  velocityX: number;
  velocityY: number;
  isRunning: boolean;
  timestamp: number;
}

interface PlaceBuildingInput {
  worldX: number;
  worldY: number;
  chunkX: number;
  chunkY: number;
  tileX: number;
  tileY: number;
}

interface OpenWorldRoomOptions {
  roomName?: string;
  maxClients?: number;
}

export class OpenWorldRoom extends Room<OpenWorldState> {
  maxClients = 50;
  private updateInterval?: NodeJS.Timeout;
  private buildingIdCounter = 0;

  onCreate(options: OpenWorldRoomOptions) {
    console.log("🌍 OpenWorldRoom created!", options);

    this.setState(new OpenWorldState());

    // Set metadata
    this.setMetadata({
      roomName: options.roomName || "Open World",
      maxClients: options.maxClients || this.maxClients,
      playerCount: 0,
    });

    // Message handlers
    this.onMessage("player_input", (client, message: PlayerInput) => {
      this.handlePlayerInput(client, message);
    });

    this.onMessage("place_building", (client, message: PlaceBuildingInput) => {
      this.handlePlaceBuilding(client, message);
    });

    // Start authoritative server tick
    this.startGameLoop();

    console.log(
      "✅ OpenWorldRoom initialized with authoritative server at 60 FPS"
    );
  }

  onJoin(client: Client, options: { username?: string }) {
    console.log(`👤 Player ${client.sessionId} joined!`);

    // Find safe spawn point
    const spawnPoint = this.findSafeSpawnPoint();

    // Create new player
    const player = new OpenWorldPlayer();
    player.id = `player_${this.state.players.length}`;
    player.clientId = client.sessionId; // Track which client controls this player
    player.username =
      options.username || `Player${this.state.players.length + 1}`;
    player.x = spawnPoint.x;
    player.y = spawnPoint.y;
    player.health = 100;
    player.stamina = 100;
    player.isInvincible = true; // Start with invincibility
    player.timestamp = Date.now();
    player.lastProcessedInput = 0;

    // Add to array
    this.state.players.push(player);

    // Update metadata
    this.setMetadata({
      ...this.metadata,
      playerCount: this.state.players.length,
    });

    // Send initial state to client with player index
    const playerIndex = this.state.players.length - 1;
    client.send("player_spawned", {
      playerIndex,
      playerId: player.id,
      clientId: player.clientId,
      username: player.username,
      x: player.x,
      y: player.y,
    });

    console.log(
      `✅ Player "${player.username}" spawned at (${player.x.toFixed(
        2
      )}, ${player.y.toFixed(2)})`
    );
  }

  onLeave(client: Client, consented: boolean) {
    console.log(`👋 Player ${client.sessionId} left (consented: ${consented})`);

    // Find and remove player by clientId
    const playerIndex = this.state.players.findIndex(
      (p) => p.clientId === client.sessionId
    );

    if (playerIndex !== -1) {
      const player = this.state.players[playerIndex];
      console.log(`🗑️  Removing player "${player.username}" from game`);

      // Remove from array
      this.state.players.splice(playerIndex, 1);

      // Update metadata
      this.setMetadata({
        ...this.metadata,
        playerCount: this.state.players.length,
      });

      // Broadcast to other clients
      this.broadcast("player_left", {
        clientId: client.sessionId,
        playerIndex,
      });
    }
  }

  onDispose() {
    console.log("🔴 OpenWorldRoom disposing...");

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  /**
   * Start the authoritative game loop
   */
  private startGameLoop() {
    const deltaTime = 1000 / SERVER_TICK_RATE;

    this.updateInterval = setInterval(() => {
      this.updateGameState(deltaTime);
    }, deltaTime);
  }

  /**
   * Handle player input (authoritative server)
   * Server validates and processes all inputs
   */
  private handlePlayerInput(client: Client, input: PlayerInput) {
    const player = this.state.players.find(
      (p) => p.clientId === client.sessionId
    );

    if (!player) return;

    // Store input sequence for reconciliation
    player.lastProcessedInput = input.sequenceNumber;

    // Validate and sanitize input
    const velocityX = this.clamp(input.velocityX, -1, 1);
    const velocityY = this.clamp(input.velocityY, -1, 1);
    const isRunning = input.isRunning && player.stamina > 0;

    // Update player state
    player.velocityX = velocityX;
    player.velocityY = velocityY;
    player.isRunning = isRunning;
    player.isMoving = velocityX !== 0 || velocityY !== 0;
  }

  /**
   * Handle building placement
   */
  private handlePlaceBuilding(client: Client, input: PlaceBuildingInput) {
    // Check if player exists
    const player = this.state.players.find(
      (p) => p.clientId === client.sessionId
    );
    if (!player) return;

    // Check if building already exists at this location
    const existingBuilding = this.state.buildings.find(
      (b) =>
        b.chunkX === input.chunkX &&
        b.chunkY === input.chunkY &&
        b.tileX === input.tileX &&
        b.tileY === input.tileY
    );

    if (existingBuilding) {
      client.send("building_placement_failed", {
        reason: "Building already exists at this location",
      });
      return;
    }

    // Create building
    const building = new Building();
    building.id = `building_${this.buildingIdCounter++}`;
    building.placedBy = client.sessionId;
    building.worldX = input.worldX;
    building.worldY = input.worldY;
    building.chunkX = input.chunkX;
    building.chunkY = input.chunkY;
    building.tileX = input.tileX;
    building.tileY = input.tileY;
    building.timestamp = Date.now();

    this.state.buildings.push(building);

    console.log(
      `🏗️  Building placed by ${player.username} at (${input.chunkX}, ${input.chunkY})`
    );
  }

  /**
   * Update game state (authoritative server tick)
   */
  private updateGameState(deltaTime: number) {
    const deltaSeconds = deltaTime / 1000;

    // Increment server tick
    this.state.serverTick++;
    this.state.serverTime = Date.now();

    // Update all players
    this.state.players.forEach((player) => {
      this.updatePlayer(player, deltaSeconds);
    });
  }

  /**
   * Update individual player (server-authoritative)
   */
  private updatePlayer(player: OpenWorldPlayer, deltaSeconds: number) {
    // Update invincibility timer
    if (player.isInvincible && Date.now() - player.timestamp > 3000) {
      player.isInvincible = false;
    }

    // Calculate speed
    const currentSpeed = player.isRunning ? PLAYER_SPRINT_SPEED : PLAYER_SPEED;

    // Apply movement
    if (player.isMoving) {
      // Normalize velocity if diagonal movement
      const length = Math.sqrt(
        player.velocityX * player.velocityX +
          player.velocityY * player.velocityY
      );

      if (length > 0) {
        const normalizedVx = player.velocityX / length;
        const normalizedVy = player.velocityY / length;

        // Calculate new position
        const newX = player.x + normalizedVx * currentSpeed * deltaSeconds;
        const newY = player.y + normalizedVy * currentSpeed * deltaSeconds;

        // Check if new position is valid (not deep ocean)
        if (!this.isDeepOcean(newX, newY)) {
          player.x = newX;
          player.y = newY;
        }
        // If in deep ocean, don't update position (collision)
      }

      // Manage stamina
      if (player.isRunning) {
        player.stamina = Math.max(
          0,
          player.stamina - STAMINA_DRAIN_RATE * deltaSeconds
        );

        // Stop running if stamina depleted
        if (player.stamina <= 0) {
          player.isRunning = false;
        }
      }
    } else {
      // Recover stamina when not moving
      player.stamina = Math.min(
        100,
        player.stamina + STAMINA_RECOVER_RATE * deltaSeconds
      );
    }

    // Check water collision (simple noise-based check)
    if (!player.isInvincible) {
      const noise = this.simpleNoise(player.x * 0.003, player.y * 0.003);

      if (noise < -0.3) {
        // Player is in water
        player.health = Math.max(0, player.health - 0.5);

        if (player.health <= 0) {
          this.respawnPlayer(player);
        }
      }
    }

    player.timestamp = Date.now();
  }

  /**
   * Respawn player at safe location
   */
  private respawnPlayer(player: OpenWorldPlayer) {
    const spawnPoint = this.findSafeSpawnPoint();

    player.x = spawnPoint.x;
    player.y = spawnPoint.y;
    player.velocityX = 0;
    player.velocityY = 0;
    player.health = 100;
    player.stamina = 100;
    player.isInvincible = true;
    player.timestamp = Date.now();

    console.log(`🔄 Player "${player.username}" respawned`);
  }

  /**
   * Find a safe spawn point (not in water)
   */
  private findSafeSpawnPoint(): { x: number; y: number } {
    const maxAttempts = 100;

    for (let i = 0; i < maxAttempts; i++) {
      const testX = (Math.random() - 0.5) * 500;
      const testY = (Math.random() - 0.5) * 500;

      const noise = this.simpleNoise(testX * 0.003, testY * 0.003);

      // Not water
      if (noise >= -0.3) {
        return { x: testX, y: testY };
      }
    }

    return { x: 100, y: 100 };
  }

  /**
   * Simple noise function (matches client-side)
   */
  private simpleNoise(x: number, y: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }

  /**
   * Check if position is in deep ocean (NOT walkable)
   * Same logic as client-side generateTile()
   */
  private isDeepOcean(worldX: number, worldY: number): boolean {
    const islands = [
      { x: 0, y: 0, radius: 800 },
      { x: 1500, y: 300, radius: 500 },
      { x: -1200, y: -800, radius: 600 },
      { x: 800, y: -1000, radius: 400 },
    ];

    // Find minimum distance to any island
    let minDist = Infinity;
    let nearestIsland = islands[0];

    for (const island of islands) {
      const dx = worldX - island.x;
      const dy = worldY - island.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        nearestIsland = island;
      }
    }

    const distRatio = minDist / nearestIsland.radius;

    // If far from all islands (distRatio > 1.3), it's deep ocean
    return distRatio > 1.3;
  }

  /**
   * Clamp value between min and max
   */
  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
}
