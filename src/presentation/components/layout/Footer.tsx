"use client";

import { Github, Heart, Spade } from "lucide-react";
import Link from "next/link";

/**
 * Main Footer component
 */
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2 group w-fit">
              <div className="p-2 rounded-lg bg-linear-to-br from-red-500 to-red-700">
                <Spade className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900 dark:text-white">
                Slave
              </span>
            </Link>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              เกมไพ่ Slave แบบออนไลน์ เล่นกับเพื่อนได้ทันที ไม่ต้องลงทะเบียน
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              ลิงก์ด่วน
            </h3>
            <nav className="flex flex-col gap-2">
              <Link
                href="/how-to-play"
                className="text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 text-sm transition-colors"
              >
                วิธีเล่น
              </Link>
              <Link
                href="/lobby"
                className="text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 text-sm transition-colors"
              >
                เล่นเกม
              </Link>
              <Link
                href="/profile"
                className="text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 text-sm transition-colors"
              >
                โปรไฟล์
              </Link>
            </nav>
          </div>

          {/* Social & Info */}
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              เกี่ยวกับ
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Slave เป็นเกมไพ่ที่เล่นกัน 4 คน โดยใช้ระบบ P2P
              ข้อมูลทั้งหมดเก็บในเครื่องของคุณ
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              © {currentYear} Slave Game. All rights reserved.
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm flex items-center gap-1">
              Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" />{" "}
              in Thailand
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
