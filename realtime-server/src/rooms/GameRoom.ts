import { Room, Client } from "@colyseus/core";
import { GameState, Player, NPC } from "./schema/GameState";

interface GameRoomOptions {
  roomName?: string;
  maxClients?: number;
  isPrivate?: boolean;
  username?: string;
  mode?: string;
  mapName?: string;
}

export class GameRoom extends Room<GameState> {
  maxClients = 50; // Maximum players per room
  state = new GameState();
  private updateInterval?: NodeJS.Timeout;
  private npcIdCounter = 0;
  private usedCharacters: Set<string> = new Set(); // Track which characters are in use

  onCreate(options: GameRoomOptions) {
    console.log("🎮 GameRoom created!", options);

    const {
      roomName,
      maxClients,
      isPrivate,
      username,
      mode,
      mapName,
    } = options ?? {};

    if (typeof maxClients === "number" && Number.isFinite(maxClients)) {
      const clampedMax = Math.max(1, Math.min(100, Math.floor(maxClients)));
      this.maxClients = clampedMax;
    }

    if (typeof isPrivate === "boolean") {
      this.setPrivate(isPrivate);
    }

    const metadata: Record<string, unknown> = {
      roomName: roomName?.trim() || "Game Room",
      maxClients: this.maxClients,
      isPrivate: !!isPrivate,
    };

    if (mode) {
      metadata.mode = mode;
    }

    if (mapName) {
      metadata.mapName = mapName;
    }

    if (username) {
      metadata.createdBy = username;
    }

    this.setMetadata(metadata);

    // Set up message handlers
    this.onMessage("move", (client, message) => {
      this.handlePlayerMove(client, message);
    });

    this.onMessage("chat", (client, message) => {
      this.broadcast(
        "chat",
        {
          playerId: client.sessionId,
          message: message.text,
          timestamp: Date.now(),
        },
        { except: client }
      );
    });
    
    this.onMessage("get_available_characters", (client) => {
      const allCharacters = ["warrior", "mage", "archer", "rogue"];
      const availableCharacters = allCharacters.filter(
        (char) => !this.usedCharacters.has(char)
      );
      
      client.send("available_characters", {
        available: availableCharacters,
        used: Array.from(this.usedCharacters),
      });
    });

    // Spawn initial NPCs
    this.spawnInitialNPCs();

    // Game loop - Update state every 16ms (~60 FPS)
    this.updateInterval = setInterval(() => {
      this.updateGameState();
    }, 1000 / 60);

    console.log("✅ GameRoom initialized with update loop at 60 FPS");
  }

  onJoin(client: Client, options: any) {
    console.log(`👤 Player ${client.sessionId} joined!`);

    const characterType = options.characterType || "warrior";
    
    // Check if character is already in use
    if (this.usedCharacters.has(characterType)) {
      console.warn(`⚠️  Character ${characterType} already in use, assigning to ${client.sessionId} anyway`);
    }

    // Create new player
    const player = new Player();
    player.id = client.sessionId;
    player.username = options.username || `Player${this.clients.length}`;
    player.characterType = characterType;
    
    // Random spawn position (-5 to 5)
    player.x = Math.random() * 10 - 5;
    player.y = 0;
    player.z = Math.random() * 10 - 5;
    player.rotation = 0;
    player.timestamp = Date.now();

    // Mark character as used
    this.usedCharacters.add(characterType);

    // Add player to state
    this.state.players.set(client.sessionId, player);

    // Broadcast join message to other players
    this.broadcast(
      "player_joined",
      {
        playerId: client.sessionId,
        username: player.username,
      },
      { except: client }
    );

    console.log(`✅ Player "${player.username}" spawned at (${player.x.toFixed(2)}, ${player.z.toFixed(2)})`);
  }

  onLeave(client: Client, consented: boolean) {
    console.log(`👋 Player ${client.sessionId} left (consented: ${consented})`);

    const player = this.state.players.get(client.sessionId);

    if (player) {
      // Free up the character
      this.usedCharacters.delete(player.characterType);
      
      // Broadcast leave message
      this.broadcast("player_left", {
        playerId: client.sessionId,
        username: player.username,
      });

      // Remove player from state
      this.state.players.delete(client.sessionId);
      console.log(`🗑️  Removed player "${player.username}" (${player.characterType}) from game`);
    }
  }

  onDispose() {
    console.log("🔴 GameRoom", this.roomId, "disposing...");

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  /**
   * Handle player movement updates
   */
  private handlePlayerMove(client: Client, message: any) {
    const player = this.state.players.get(client.sessionId);

    if (player && message) {
      player.x = message.x ?? player.x;
      player.y = message.y ?? player.y;
      player.z = message.z ?? player.z;
      player.rotation = message.rotation ?? player.rotation;
      player.isMoving = message.isMoving ?? false;
      player.timestamp = Date.now();
    }
  }

  /**
   * Spawn initial NPCs
   */
  private spawnInitialNPCs() {
    // Spawn villager
    const villager = new NPC();
    villager.id = `npc_${this.npcIdCounter++}`;
    villager.name = "John";
    villager.type = "villager";
    villager.behavior = "wander";
    villager.x = 5;
    villager.z = 5;
    this.state.npcs.set(villager.id, villager);

    // Spawn merchant
    const merchant = new NPC();
    merchant.id = `npc_${this.npcIdCounter++}`;
    merchant.name = "Merchant Bob";
    merchant.type = "merchant";
    merchant.behavior = "idle";
    merchant.x = -8;
    merchant.z = 3;
    this.state.npcs.set(merchant.id, merchant);

    // Spawn guard
    const guard = new NPC();
    guard.id = `npc_${this.npcIdCounter++}`;
    guard.name = "Guard Tom";
    guard.type = "guard";
    guard.behavior = "patrol";
    guard.x = 0;
    guard.z = -10;
    this.state.npcs.set(guard.id, guard);

    // Spawn animal
    const animal = new NPC();
    animal.id = `npc_${this.npcIdCounter++}`;
    animal.name = "Dog";
    animal.type = "animal";
    animal.behavior = "wander";
    animal.x = -5;
    animal.z = -5;
    this.state.npcs.set(animal.id, animal);

    console.log(`✅ Spawned ${this.state.npcs.size} NPCs`);
  }

  /**
   * Update game state (60 FPS)
   */
  private updateGameState() {
    // Update server timestamp
    this.state.serverTime = Date.now();

    // Update NPC AI
    this.state.npcs.forEach((npc) => {
      this.updateNPCAI(npc);
    });
  }

  /**
   * Update NPC AI behavior
   */
  private updateNPCAI(npc: NPC) {
    const deltaTime = 1 / 60; // 60 FPS

    switch (npc.behavior) {
      case "wander":
        // Random wandering
        if (Math.random() < 0.02) {
          const angle = Math.random() * Math.PI * 2;
          const distance = npc.speed * deltaTime;
          npc.x += Math.cos(angle) * distance;
          npc.z += Math.sin(angle) * distance;
          npc.rotation = angle;

          // Keep within bounds
          npc.x = Math.max(-45, Math.min(45, npc.x));
          npc.z = Math.max(-45, Math.min(45, npc.z));
        }
        break;

      case "patrol":
        // Simple patrol pattern (will implement full patrol points later)
        const time = Date.now() / 1000;
        const patrolRadius = 5;
        npc.x = Math.cos(time * 0.5) * patrolRadius;
        npc.z = -10 + Math.sin(time * 0.5) * patrolRadius;
        npc.rotation = Math.atan2(Math.sin(time * 0.5), Math.cos(time * 0.5));
        break;

      case "idle":
      default:
        // Do nothing
        break;
    }
  }
}
