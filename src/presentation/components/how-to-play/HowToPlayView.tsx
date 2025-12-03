"use client";

import {
  ArrowRight,
  BookOpen,
  Crown,
  Hand,
  Spade,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import { MainLayout } from "../layout/MainLayout";

// Card rank data
const cardRanks = [
  { rank: "2", value: "สูงสุด", color: "bg-red-500" },
  { rank: "A", value: "14", color: "bg-gray-800 dark:bg-gray-200" },
  { rank: "K", value: "13", color: "bg-yellow-500" },
  { rank: "Q", value: "12", color: "bg-pink-500" },
  { rank: "J", value: "11", color: "bg-blue-500" },
  { rank: "10", value: "10", color: "bg-gray-600" },
  { rank: "9-3", value: "9-3", color: "bg-gray-400" },
];

// Suit order data
const suitOrder = [
  {
    suit: "♠",
    name: "โพดำ",
    rank: "1 (สูงสุด)",
    color: "text-gray-900 dark:text-white",
  },
  { suit: "♥", name: "โพแดง", rank: "2", color: "text-red-500" },
  { suit: "♦", name: "ข้าวหลามตัด", rank: "3", color: "text-red-500" },
  {
    suit: "♣",
    name: "ดอกจิก",
    rank: "4 (ต่ำสุด)",
    color: "text-gray-900 dark:text-white",
  },
];

/**
 * How to Play page view component
 * Explains the rules of Slave card game
 */
export function HowToPlayView() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-linear-to-br from-red-500 to-red-700 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-6 opacity-90" />
            <h1 className="text-4xl font-bold mb-4">วิธีเล่นเกม Slave</h1>
            <p className="text-red-100 text-lg">
              เรียนรู้กฎและวิธีเล่นเกมไพ่ Slave เพื่อเป็นผู้ชนะ
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Overview */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Target className="w-5 h-5 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                ภาพรวม
              </h2>
            </div>
            <div className="prose dark:prose-invert max-w-none">
              <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <Users className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                  <span>
                    <strong>จำนวนผู้เล่น:</strong> 4 คน
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Spade className="w-5 h-5 text-gray-700 dark:text-gray-300 mt-0.5 shrink-0" />
                  <span>
                    <strong>ไพ่ที่ใช้:</strong> ไพ่ 52 ใบ (ไม่รวม Joker)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
                  <span>
                    <strong>เป้าหมาย:</strong> ทิ้งไพ่ในมือให้หมดก่อนผู้เล่นอื่น
                  </span>
                </li>
              </ul>
            </div>
          </section>

          {/* Card Ranks */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Crown className="w-5 h-5 text-purple-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                ลำดับไพ่ (สูงไปต่ำ)
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {cardRanks.map((card, index) => (
                <div
                  key={card.rank}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center"
                >
                  <div
                    className={`w-12 h-16 ${card.color} rounded-lg flex items-center justify-center mx-auto mb-2 text-white font-bold text-xl`}
                  >
                    {card.rank}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {index === 0 ? "สูงสุด" : `อันดับ ${index + 1}`}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
              <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                <strong>💡 เคล็ดลับ:</strong> ไพ่ 2 เป็นไพ่ที่แรงที่สุด
                สามารถตีทุกไพ่ได้!
              </p>
            </div>
          </section>

          {/* Suit Order */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Spade className="w-5 h-5 text-blue-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                ลำดับดอก (Suit)
              </h2>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-4">
              เมื่อไพ่มีค่าเท่ากัน ให้ดูดอกไพ่ โดยเรียงจากมากไปน้อย:
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {suitOrder.map((item) => (
                <div
                  key={item.suit}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center"
                >
                  <div className={`text-5xl ${item.color} mb-2`}>
                    {item.suit}
                  </div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {item.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {item.rank}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* How to Play */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Hand className="w-5 h-5 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                วิธีเล่น
              </h2>
            </div>

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0 font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    แจกไพ่
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    แจกไพ่ให้ผู้เล่นทั้ง 4 คน คนละ 13 ใบ
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0 font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    เริ่มเกม
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    ผู้เล่นที่มี <strong>3♣ (ดอกจิก)</strong> เริ่มเล่นก่อน
                    ต้องลงไพ่ที่มี 3♣ รวมอยู่ด้วย
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0 font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    ลงไพ่
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    ผู้เล่นต้องลงไพ่ที่แรงกว่าไพ่ก่อนหน้า หรือเลือก
                    <strong> &quot;ผ่าน&quot; (Pass)</strong>{" "}
                    ถ้าไม่มีไพ่ที่เหมาะสม
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0 font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    รูปแบบการลงไพ่
                  </h3>
                  <div className="text-gray-600 dark:text-gray-400 space-y-2">
                    <p>
                      • <strong>ใบเดียว:</strong> ลงไพ่ 1 ใบ
                    </p>
                    <p>
                      • <strong>คู่ (Pair):</strong> ลงไพ่ 2 ใบ ค่าเท่ากัน
                    </p>
                    <p>
                      • <strong>ตอง (Triple):</strong> ลงไพ่ 3 ใบ ค่าเท่ากัน
                    </p>
                    <p>
                      • <strong>โฟร์ (Four of a Kind):</strong> ลงไพ่ 4 ใบ
                      ค่าเท่ากัน
                    </p>
                    <p>
                      • <strong>สเตรท (Straight):</strong> ลงไพ่ 3 ใบขึ้นไป
                      เรียงกัน
                    </p>
                  </div>

                  {/* Special rules */}
                  <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                    <p className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                      ⚡ กฎพิเศษ: ทับข้ามประเภท
                    </p>
                    <div className="text-purple-700 dark:text-purple-300 space-y-1 text-sm">
                      <p>
                        • <strong>ตอง</strong> สามารถลงทับ{" "}
                        <strong>ไพ่ใบเดียว</strong> ได้ทุกใบ
                      </p>
                      <p>
                        • <strong>โฟร์</strong> สามารถลงทับ{" "}
                        <strong>ไพ่ใบเดียว</strong> ได้ทุกใบ
                      </p>
                      <p>
                        • <strong>โฟร์</strong> สามารถลงทับ{" "}
                        <strong>ไพ่คู่</strong> ได้ทุกคู่
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0 font-bold">
                  5
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    รอบใหม่
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    เมื่อผู้เล่น 3 คน &quot;ผ่าน&quot;
                    ผู้เล่นที่ลงไพ่ล่าสุดจะเริ่มรอบใหม่
                    และสามารถลงไพ่รูปแบบใดก็ได้
                  </p>
                </div>
              </div>

              {/* Step 6 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0 font-bold">
                  6
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    จบเกม
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    ผู้เล่นที่ทิ้งไพ่หมดก่อนจะเป็นผู้ชนะ (เจ้านาย)
                    ผู้เล่นที่เหลือไพ่คนสุดท้ายจะแพ้ (ทาส)
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Rankings */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-yellow-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                อันดับผู้เล่น
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 text-center border-2 border-yellow-400">
                <div className="text-3xl mb-2">👑</div>
                <div className="font-bold text-yellow-700 dark:text-yellow-400">
                  เจ้านาย
                </div>
                <div className="text-sm text-yellow-600 dark:text-yellow-500">
                  ออกก่อน
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center">
                <div className="text-3xl mb-2">🥈</div>
                <div className="font-bold text-gray-700 dark:text-gray-300">
                  ไพร่
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  ออกที่ 2
                </div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 text-center">
                <div className="text-3xl mb-2">🥉</div>
                <div className="font-bold text-orange-700 dark:text-orange-400">
                  ประชาชน
                </div>
                <div className="text-sm text-orange-600 dark:text-orange-500">
                  ออกที่ 3
                </div>
              </div>
              <div className="bg-gray-100 dark:bg-gray-600/50 rounded-xl p-4 text-center border-2 border-gray-400 dark:border-gray-500">
                <div className="text-3xl mb-2">⛓️</div>
                <div className="font-bold text-gray-700 dark:text-gray-300">
                  ทาส
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  ออกสุดท้าย
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center py-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              พร้อมเล่นหรือยัง?
            </h2>
            <Link
              href="/lobby"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold text-lg transition-all duration-300 shadow-lg shadow-red-500/25 hover:shadow-red-500/40"
            >
              <Spade className="w-5 h-5" />
              เข้าสู่ห้องเกม
              <ArrowRight className="w-5 h-5" />
            </Link>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
