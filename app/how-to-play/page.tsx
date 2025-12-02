import { HowToPlayView } from "@/src/presentation/components/how-to-play/HowToPlayView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "วิธีเล่น | Slave Game",
  description:
    "เรียนรู้กฎและวิธีเล่นเกมไพ่ Slave - ลำดับไพ่ การลงไพ่ และเคล็ดลับในการชนะ",
};

/**
 * How to Play Page - Server Component for SEO optimization
 * Displays game rules and instructions
 */
export default function HowToPlayPage() {
  return <HowToPlayView />;
}
