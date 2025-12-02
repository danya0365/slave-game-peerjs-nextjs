import "dotenv/config";

import { createEnvConfig } from "./config/env";
import { createLogger } from "./config/logger";
import { startPeerServer } from "./server/startPeerServer";

const bootstrap = () => {
  try {
    const env = createEnvConfig(process.env);
    const logger = createLogger(env.LOG_LEVEL);

    logger.info("Starting PeerJS server...");

    startPeerServer({ env, logger });

    const handleFatalError = (error: unknown) => {
      const cause = error instanceof Error ? error : new Error(String(error));
      logger.error(`Fatal error: ${cause.stack ?? cause.message}`);
      process.exit(1);
    };

    process.on("uncaughtException", handleFatalError);
    process.on("unhandledRejection", handleFatalError);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to bootstrap peer server: ${message}`);
    process.exit(1);
  }
};

bootstrap();
