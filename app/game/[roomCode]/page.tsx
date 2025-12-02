import { GameView } from "@/src/presentation/components/game/GameView";
import type { Metadata } from "next";

interface GamePageProps {
  params: Promise<{ roomCode: string }>;
}

export async function generateMetadata({
  params,
}: GamePageProps): Promise<Metadata> {
  const { roomCode } = await params;
  return {
    title: `ห้อง ${roomCode} | Slave Game`,
    description: "เล่นเกมไพ่ Slave กับเพื่อน",
  };
}

/**
 * Game Page - Server Component for SEO optimization
 * Dynamic route for game rooms
 */
export default async function GamePage({ params }: GamePageProps) {
  const { roomCode } = await params;
  return <GameView roomCode={roomCode} />;
}
