import { LobbyView } from "@/src/presentation/components/lobby/LobbyView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ห้องเกม | Slave Game",
  description: "สร้างห้องใหม่หรือเข้าร่วมห้องเพื่อเล่นเกมไพ่ Slave กับเพื่อน",
};

/**
 * Lobby Page - Server Component for SEO optimization
 * Handles room creation and joining
 */
export default function LobbyPage() {
  return <LobbyView />;
}
