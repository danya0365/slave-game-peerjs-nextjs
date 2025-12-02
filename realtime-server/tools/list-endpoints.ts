import express, { type Application } from "express";
import expressListEndpoints, {
  type RouteDefinition,
} from "express-list-endpoints";

import appConfig from "../src/app.config";

type RouteSummary = {
  methods: string;
  middlewares: string;
  path: string;
};

type RoomHandlerApi = {
  enableRealtimeListing(): RoomHandlerApi;
  filterBy(fields: string[]): RoomHandlerApi;
};

type RoomSummary = {
  filters?: string[];
  realtimeListing?: boolean;
  roomClass: string;
  roomName: string;
};

type GameServerAdapter = {
  define(roomName: string, roomClass: { name?: string }): RoomHandlerApi;
};

type AppConfig = {
  initializeExpress?: (app: Application) => void;
  initializeGameServer?: (gameServer: GameServerAdapter) => void;
};

class RoomHandlerMock implements RoomHandlerApi {
  constructor(private readonly summary: RoomSummary) {}

  filterBy(fields: string[]) {
    this.summary.filters = fields;
    return this;
  }

  enableRealtimeListing() {
    this.summary.realtimeListing = true;
    return this;
  }
}

class GameServerMock implements GameServerAdapter {
  public readonly rooms: RoomSummary[] = [];

  define(roomName: string, roomClass: { name?: string }) {
    const summary: RoomSummary = {
      roomName,
      roomClass: roomClass?.name ?? "AnonymousRoom",
    };

    this.rooms.push(summary);
    return new RoomHandlerMock(summary);
  }
}

async function main() {
  const app = express();
  const config = appConfig as AppConfig;

  config.initializeExpress?.(app);

  const expressRoutes = expressListEndpoints(app) as RouteDefinition[];
  const routeSummaries: RouteSummary[] = expressRoutes.map(
    (route: RouteDefinition) => ({
      path: route.path,
      methods: route.methods.join(", "),
      middlewares: route.middlewares.join(", ") || "-",
    })
  );

  if (routeSummaries.length > 0) {
    console.log("Express endpoints:");
    console.table(routeSummaries);
  } else {
    console.log("No express endpoints registered.");
  }

  const gameServerMock = new GameServerMock();
  config.initializeGameServer?.(gameServerMock);

  if (gameServerMock.rooms.length > 0) {
    console.log("\nColyseus rooms:");
    console.table(gameServerMock.rooms);
  } else {
    console.log("\nNo Colyseus rooms registered.");
  }
}

main().catch((error) => {
  console.error("Error listing endpoints:", error);
  process.exit(1);
});
