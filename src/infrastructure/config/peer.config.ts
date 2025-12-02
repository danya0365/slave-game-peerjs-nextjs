/**
 * PeerJS Server Configuration
 *
 * Configure your own PeerJS signaling server here.
 * Default uses PeerJS Cloud if not configured.
 */

// Read from environment variables or use defaults
const PEER_HOST = process.env.NEXT_PUBLIC_PEER_HOST || "";
const PEER_PORT = process.env.NEXT_PUBLIC_PEER_PORT || "";
const PEER_PATH = process.env.NEXT_PUBLIC_PEER_PATH || "/peerjs";
const PEER_SECURE = process.env.NEXT_PUBLIC_PEER_SECURE === "true";

/**
 * PeerJS Server Config
 *
 * If PEER_HOST is empty, PeerJS will use its default cloud server (0.peerjs.com)
 *
 * For local development:
 *   NEXT_PUBLIC_PEER_HOST=localhost
 *   NEXT_PUBLIC_PEER_PORT=9000
 *   NEXT_PUBLIC_PEER_PATH=/peerjs
 *   NEXT_PUBLIC_PEER_SECURE=false
 *
 * For production:
 *   NEXT_PUBLIC_PEER_HOST=your-peer-server.com
 *   NEXT_PUBLIC_PEER_PORT=443
 *   NEXT_PUBLIC_PEER_PATH=/peerjs
 *   NEXT_PUBLIC_PEER_SECURE=true
 */
/**
 * Build PeerJS config object
 * Only include properties if they have values (avoid undefined)
 */
export const PEER_SERVER_CONFIG = (() => {
  // If no custom host, return empty object to use PeerJS Cloud defaults
  if (!PEER_HOST) {
    return {};
  }

  // Custom server config
  return {
    host: PEER_HOST,
    port: PEER_PORT ? parseInt(PEER_PORT, 10) : 9000,
    path: PEER_PATH,
    secure: PEER_SECURE,
  };
})();

/**
 * Check if custom peer server is configured
 */
export const isCustomPeerServer = (): boolean => {
  return !!PEER_HOST;
};

/**
 * Get peer server URL for display purposes
 */
export const getPeerServerUrl = (): string => {
  if (!PEER_HOST) {
    return "PeerJS Cloud (0.peerjs.com)";
  }
  const protocol = PEER_SECURE ? "https" : "http";
  const port = PEER_PORT ? `:${PEER_PORT}` : "";
  return `${protocol}://${PEER_HOST}${port}${PEER_PATH}`;
};
