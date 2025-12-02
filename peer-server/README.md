# Peer Server

Self-hosted [PeerJS](https://peerjs.com/) signalling server for the Top-Down R3F project. This server is designed to run independently from the Colyseus game server and follows the same tooling stack (TypeScript + tsx + npm scripts).

## Features

- Express-powered HTTP server exposing `/health` for monitoring
- Configurable PeerJS endpoint via environment variables
- Structured logging with Winston
- Graceful shutdown handlers for production readiness
- Type-safe configuration validation using `zod`

## Getting Started

1. **Install dependencies**

   ```bash
   cd peer-server
   npm install
   ```

2. **Configure environment**

   Copy `.env.example` to `.env` and adjust values as needed.

   ```bash
   cp .env.example .env
   ```

   | Variable   | Description                                   | Default  |
   |------------|-----------------------------------------------|----------|
   | `PORT`     | TCP port to serve PeerJS                      | `9000`   |
   | `HOST`     | Host interface to bind                        | `0.0.0.0`|
   | `PEERJS_PATH`| Express mount path for PeerJS                 | `/peerjs`|
   | `LOG_LEVEL`| Winston log level (`info`, `debug`, …)        | `info`   |

3. **Run in development mode**

   ```bash
   npm run dev
   ```

4. **Build for production**

   ```bash
   npm run build
   npm start
   ```

## Clean Architecture Notes

- `src/config`: application configuration and infrastructure concerns
- `src/server`: server composition and integrations
- `src/main.ts`: entry point wiring dependencies

Feel free to extend the server with authentication, metrics, or custom PeerJS options to match deployment needs.
