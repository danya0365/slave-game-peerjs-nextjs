import { ProfileView } from "@/src/presentation/components/profile/ProfileView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "โปรไฟล์ | Slave Game",
  description: "จัดการโปรไฟล์และดูสถิติการเล่นของคุณ",
};

/**
 * Profile Page - Server Component for SEO optimization
 * Displays user profile, stats, and profile editor
 */
export default function ProfilePage() {
  return <ProfileView />;
}
