"use client";

import { ArrowRight, Globe, Shield, Spade, Users, Zap } from "lucide-react";
import Link from "next/link";
import { MainLayout } from "../layout/MainLayout";

/**
 * Landing page view component
 */
export function LandingView() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-red-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Phase 1: P2P Multiplayer
            </div>

            {/* Main heading */}
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              เล่นเกมไพ่{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-red-500 to-red-700">
                Slave
              </span>{" "}
              ออนไลน์
            </h1>

            {/* Subheading */}
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              เล่นกับเพื่อนได้ทันที ไม่ต้องลงทะเบียน ไม่ต้องดาวน์โหลด
              แค่แชร์รหัสห้องก็เล่นได้เลย
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/lobby"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold text-lg transition-all duration-300 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:scale-105"
              >
                <Spade className="w-5 h-5" />
                เริ่มเล่นเลย
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/how-to-play"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold text-lg transition-all duration-300"
              >
                วิธีเล่น
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  4
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">
                  ผู้เล่น/ห้อง
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  52
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">
                  ไพ่
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  P2P
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">
                  เชื่อมต่อ
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  0฿
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">
                  ฟรีตลอด
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              ทำไมต้องเลือก Slave Game?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              เราออกแบบมาให้เล่นง่าย เร็ว และสนุก
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                เริ่มเล่นได้ทันที
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                ไม่ต้องสมัคร ไม่ต้องดาวน์โหลด แค่เปิดเว็บก็เล่นได้เลย
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                เล่นกับเพื่อน
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                สร้างห้องและแชร์รหัสให้เพื่อน เข้ามาเล่นด้วยกันได้ทันที
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                P2P Connection
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                เชื่อมต่อตรงถึงกัน ไม่ต้องผ่าน server เล่นได้เร็วและลื่นไหล
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                ข้อมูลในเครื่อง
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                ข้อมูลทั้งหมดเก็บในเครื่องคุณ ไม่มีการเก็บข้อมูลบน server
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How to Play Preview Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                วิธีเล่นง่ายๆ
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                3 ขั้นตอนง่ายๆ ก็เริ่มเล่นได้เลย
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-linear-to-br from-red-500 to-red-600 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  สร้างโปรไฟล์
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  ใส่ชื่อและเลือก avatar ของคุณ
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-linear-to-br from-red-500 to-red-600 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  สร้าง/เข้าร่วมห้อง
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  สร้างห้องใหม่หรือใส่รหัสห้องเพื่อเข้าร่วม
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-linear-to-br from-red-500 to-red-600 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  เริ่มเล่น!
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  รอผู้เล่นครบ 4 คน แล้วเริ่มเกมได้เลย
                </p>
              </div>
            </div>

            <div className="text-center mt-12">
              <Link
                href="/how-to-play"
                className="inline-flex items-center gap-2 text-red-500 hover:text-red-600 font-medium transition-colors"
              >
                ดูกฎการเล่นเพิ่มเติม
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-linear-to-br from-red-500 to-red-700">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              พร้อมเล่นหรือยัง?
            </h2>
            <p className="text-red-100 mb-8 text-lg">
              เริ่มเล่นเกมไพ่ Slave กับเพื่อนของคุณได้เลยตอนนี้
            </p>
            <Link
              href="/lobby"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white hover:bg-gray-100 text-red-600 font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <Spade className="w-5 h-5" />
              เข้าสู่ห้องเกม
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
