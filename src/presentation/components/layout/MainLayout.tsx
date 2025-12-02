"use client";

import { ReactNode } from "react";
import { Footer } from "./Footer";
import { Header } from "./Header";

interface MainLayoutProps {
  children: ReactNode;
  /** Hide header (e.g., for full-screen game view) */
  hideHeader?: boolean;
  /** Hide footer (e.g., for full-screen game view) */
  hideFooter?: boolean;
}

/**
 * Main Layout component
 * Wraps pages with Header and Footer
 */
export function MainLayout({
  children,
  hideHeader = false,
  hideFooter = false,
}: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      {!hideHeader && <Header />}
      <main className="flex-1">{children}</main>
      {!hideFooter && <Footer />}
    </div>
  );
}
