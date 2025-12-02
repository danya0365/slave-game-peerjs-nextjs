"use client";

import { useUserStore } from "@/src/presentation/stores/userStore";
import {
  ArrowRight,
  Copy,
  Crown,
  DoorOpen,
  Loader2,
  Plus,
  RefreshCw,
  Spade,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MainLayout } from "../layout/MainLayout";

/**
 * Generate a random room code
 */
const generateRoomCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Lobby page view component
 * Handles room creation and joining
 */
export function LobbyView() {
  const router = useRouter();
  const { user, hasHydrated } = useUserStore();
  const [mode, setMode] = useState<"select" | "create" | "join">("select");
  const [roomCode, setRoomCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Generate room code when creating
  useEffect(() => {
    if (mode === "create" && !generatedCode) {
      setGeneratedCode(generateRoomCode());
    }
  }, [mode, generatedCode]);

  // Copy room code to clipboard
  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = generatedCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Regenerate room code
  const regenerateCode = () => {
    setGeneratedCode(generateRoomCode());
  };

  // Handle create room
  const handleCreateRoom = () => {
    setIsLoading(true);
    setError(null);
    // Navigate to game room with host mode
    router.push(`/game/${generatedCode}?host=true`);
  };

  // Handle join room
  const handleJoinRoom = () => {
    if (!roomCode.trim()) {
      setError("กรุณาใส่รหัสห้อง");
      return;
    }

    if (roomCode.length !== 6) {
      setError("รหัสห้องต้องมี 6 ตัวอักษร");
      return;
    }

    setIsLoading(true);
    setError(null);
    // Navigate to game room with client mode
    router.push(`/game/${roomCode.toUpperCase()}`);
  };

  // Show loading while hydrating
  if (!hasHydrated) {
    return (
      <MainLayout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">กำลังโหลด...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Redirect to profile if no user
  if (!user) {
    return (
      <MainLayout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="max-w-md mx-auto text-center p-8">
            <div className="text-6xl mb-4">👤</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              ยังไม่มีโปรไฟล์
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              สร้างโปรไฟล์ก่อนเข้าร่วมเกม
            </p>
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium transition-all"
            >
              สร้างโปรไฟล์
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              ห้องเกม
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              สร้างห้องใหม่หรือเข้าร่วมห้องที่มีอยู่
            </p>
          </div>

          {/* User Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-8 flex items-center gap-4">
            <div className="text-4xl">{user.avatar}</div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900 dark:text-white">
                {user.name}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                เล่นแล้ว {user.stats.gamesPlayed} เกม | ชนะ{" "}
                {user.stats.gamesWon} เกม
              </div>
            </div>
            <Link
              href="/profile"
              className="text-sm text-red-500 hover:text-red-600"
            >
              แก้ไข
            </Link>
          </div>

          {/* Mode Selection */}
          {mode === "select" && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Create Room */}
              <button
                onClick={() => setMode("create")}
                className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all text-left group border-2 border-transparent hover:border-red-500"
              >
                <div className="w-14 h-14 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Plus className="w-7 h-7 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  สร้างห้อง
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  สร้างห้องใหม่และแชร์รหัสให้เพื่อน
                </p>
              </button>

              {/* Join Room */}
              <button
                onClick={() => setMode("join")}
                className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all text-left group border-2 border-transparent hover:border-blue-500"
              >
                <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <DoorOpen className="w-7 h-7 text-blue-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  เข้าร่วมห้อง
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  ใส่รหัสห้องเพื่อเข้าร่วมเกม
                </p>
              </button>
            </div>
          )}

          {/* Create Room Mode */}
          {mode === "create" && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  สร้างห้องใหม่
                </h2>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  รหัสห้องของคุณ
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-xl px-6 py-4 text-center">
                    <span className="text-3xl font-mono font-bold tracking-widest text-gray-900 dark:text-white">
                      {generatedCode}
                    </span>
                  </div>
                  <button
                    onClick={copyRoomCode}
                    className={`px-4 rounded-xl transition-colors ${
                      copied
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300"
                    }`}
                    title="คัดลอกรหัส"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                  <button
                    onClick={regenerateCode}
                    className="px-4 rounded-xl bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 transition-colors"
                    title="สร้างรหัสใหม่"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  แชร์รหัสนี้ให้เพื่อนเพื่อเข้าร่วมห้อง
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="font-medium text-blue-800 dark:text-blue-300">
                      รอผู้เล่น 4 คน
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                      เกมจะเริ่มเมื่อผู้เล่นครบ 4 คน
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setMode("select");
                    setGeneratedCode("");
                  }}
                  className="flex-1 px-6 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium transition-colors"
                >
                  ย้อนกลับ
                </button>
                <button
                  onClick={handleCreateRoom}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Spade className="w-5 h-5" />
                      สร้างห้อง
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Join Room Mode */}
          {mode === "join" && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <DoorOpen className="w-5 h-5 text-blue-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  เข้าร่วมห้อง
                </h2>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  รหัสห้อง
                </label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => {
                    setRoomCode(e.target.value.toUpperCase());
                    setError(null);
                  }}
                  placeholder="ใส่รหัส 6 ตัวอักษร"
                  maxLength={6}
                  className="w-full px-6 py-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 text-center text-2xl font-mono tracking-widest uppercase focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setMode("select");
                    setRoomCode("");
                    setError(null);
                  }}
                  className="flex-1 px-6 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium transition-colors"
                >
                  ย้อนกลับ
                </button>
                <button
                  onClick={handleJoinRoom}
                  disabled={isLoading || roomCode.length !== 6}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <DoorOpen className="w-5 h-5" />
                      เข้าร่วม
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
