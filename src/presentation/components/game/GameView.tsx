"use client";

import { GamePlayView } from "./GamePlayView";

interface GameViewProps {
  roomCode: string;
}

/**
 * Game page view component - Wrapper for GamePlayView
 */
export function GameView({ roomCode }: GameViewProps) {
  return <GamePlayView roomCode={roomCode} />;
}
