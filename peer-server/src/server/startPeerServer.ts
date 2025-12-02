import http from "node:http";
import express, { type Request, type Response } from "express";
import { ExpressPeerServer } from "peer";
import type { Logger } from "winston";

import type { EnvConfig } from "../config/env";

interface StartPeerServerDependencies {
  env: EnvConfig;
  logger: Logger;
}

type PeerClient = {
  getId?: () => string;
  id?: string;
};

const resolveClientId = (client: PeerClient | undefined): string => {
  if (!client) {
    return "unknown";
  }

  if (typeof client.getId === "function") {
    return client.getId();
  }

  return client.id ?? "unknown";
};

export const startPeerServer = ({ env, logger }: StartPeerServerDependencies) => {
  const app = express();

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  const httpServer = http.createServer(app);

  const peerServer = ExpressPeerServer(httpServer, { path: env.PEERJS_PATH });

  app.use(env.PEERJS_PATH, peerServer);

  peerServer.on("connection", (client: PeerClient) => {
    logger.info(`Peer connected: ${resolveClientId(client)}`);
  });

  peerServer.on("disconnect", (client: PeerClient) => {
    logger.info(`Peer disconnected: ${resolveClientId(client)}`);
  });

  httpServer.listen(env.PORT, env.HOST, () => {
    logger.info(
      `Peer server listening on http://${env.HOST}:${env.PORT}${env.PEERJS_PATH}`
    );
  });

  const shutdown = (signal: NodeJS.Signals) => {
    logger.info(`Received ${signal}. Shutting down peer server...`);

    httpServer.close((error) => {
      if (error) {
        logger.error(`Error while closing HTTP server: ${error.message}`);
        process.exitCode = 1;
      }
      process.exit();
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  return { app, httpServer, peerServer };
};
