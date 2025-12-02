"use client";

import { Menu, Spade, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ThemeToggle } from "../common/ThemeToggle";

interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: "หน้าแรก", href: "/" },
  { label: "วิธีเล่น", href: "/how-to-play" },
  { label: "โปรไฟล์", href: "/profile" },
];

/**
 * Main Header component with navigation and theme toggle
 */
export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-lg bg-linear-to-br from-red-500 to-red-700 group-hover:from-red-600 group-hover:to-red-800 transition-all duration-300">
              <Spade className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900 dark:text-white">
              Slave
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            <ThemeToggle />

            {/* Play Button - Desktop */}
            <Link
              href="/lobby"
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium transition-all duration-300 shadow-lg shadow-red-500/25 hover:shadow-red-500/40"
            >
              <Spade className="w-4 h-4" />
              เล่นเลย
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-800">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 font-medium transition-colors"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/lobby"
                onClick={() => setIsMobileMenuOpen(false)}
                className="mx-4 mt-2 px-4 py-3 rounded-lg bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium text-center transition-all duration-300"
              >
                <Spade className="w-4 h-4 inline mr-2" />
                เล่นเลย
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
