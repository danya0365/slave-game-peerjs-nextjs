import { ThemeProvider } from "@/src/presentation/components/common/ThemeProvider";
import type { Metadata } from "next";
import "../public/styles/index.css";

export const metadata: Metadata = {
  title: "Slave | เกมไพ่ออนไลน์",
  description:
    "เล่นเกมไพ่ Slave ออนไลน์กับเพื่อน ไม่ต้องลงทะเบียน เล่นได้ทันที ผ่านระบบ P2P",
  keywords: ["slave", "เกมไพ่", "card game", "ไพ่ออนไลน์", "เกมออนไลน์"],
  authors: [{ name: "Slave Game" }],
  openGraph: {
    title: "Slave | เกมไพ่ออนไลน์",
    description: "เล่นเกมไพ่ Slave ออนไลน์กับเพื่อน ไม่ต้องลงทะเบียน",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
