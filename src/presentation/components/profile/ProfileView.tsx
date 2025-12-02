"use client";

import {
  avatarOptions,
  useUserStore,
} from "@/src/presentation/stores/userStore";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Award,
  Edit3,
  Flame,
  GamepadIcon,
  RotateCcw,
  Save,
  Trophy,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { MainLayout } from "../layout/MainLayout";

// Form schema for creating/editing user
const userFormSchema = z.object({
  name: z
    .string()
    .min(1, "กรุณาใส่ชื่อ")
    .max(20, "ชื่อต้องไม่เกิน 20 ตัวอักษร"),
  avatar: z.string().min(1, "กรุณาเลือก avatar"),
});

type UserFormData = z.infer<typeof userFormSchema>;

/**
 * Profile page view component
 * Handles user creation and profile editing
 */
export function ProfileView() {
  const { user, hasHydrated, createUser, updateUser, resetStats } =
    useUserStore();
  const [isEditing, setIsEditing] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      avatar: avatarOptions[0],
    },
  });

  const selectedAvatar = watch("avatar");

  // Sync form with user data when editing
  useEffect(() => {
    if (user && isEditing) {
      reset({
        name: user.name,
        avatar: user.avatar,
      });
    }
  }, [user, isEditing, reset]);

  // Handle form submission
  const onSubmit = (data: UserFormData) => {
    if (user) {
      updateUser({ name: data.name, avatar: data.avatar });
      setIsEditing(false);
    } else {
      createUser(data.name, data.avatar);
    }
  };

  // Handle reset stats
  const handleResetStats = () => {
    resetStats();
    setShowResetConfirm(false);
  };

  // Show loading while hydrating from localforage
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

  // User has profile - show profile view
  if (user && !isEditing) {
    const winRate =
      user.stats.gamesPlayed > 0
        ? Math.round((user.stats.gamesWon / user.stats.gamesPlayed) * 100)
        : 0;

    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            {/* Profile Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
              {/* Header with gradient */}
              <div className="bg-linear-to-r from-red-500 to-red-600 px-6 py-8">
                <div className="flex items-center gap-6">
                  <div className="text-6xl bg-white dark:bg-gray-800 rounded-full w-24 h-24 flex items-center justify-center shadow-lg">
                    {user.avatar}
                  </div>
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-white mb-1">
                      {user.name}
                    </h1>
                    <p className="text-red-100 text-sm">
                      เริ่มเล่น:{" "}
                      {new Date(user.createdAt).toLocaleDateString("th-TH")}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                    aria-label="แก้ไขโปรไฟล์"
                  >
                    <Edit3 className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Stats Section */}
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  สถิติการเล่น
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {/* Games Played */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center">
                    <GamepadIcon className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {user.stats.gamesPlayed}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      เกมที่เล่น
                    </div>
                  </div>

                  {/* Wins */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center">
                    <Trophy className="w-6 h-6 text-green-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {user.stats.gamesWon}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      ชนะ
                    </div>
                  </div>

                  {/* Win Rate */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center">
                    <Award className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {winRate}%
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      อัตราชนะ
                    </div>
                  </div>

                  {/* Best Streak */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center">
                    <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {user.stats.bestWinStreak}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      ชนะติดต่อกัน
                    </div>
                  </div>
                </div>

                {/* Current Streak */}
                {user.stats.winStreak > 0 && (
                  <div className="bg-linear-to-r from-orange-500 to-red-500 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-3">
                      <Flame className="w-8 h-8 text-white" />
                      <div>
                        <div className="text-white font-semibold">
                          กำลังมาแรง! 🔥
                        </div>
                        <div className="text-orange-100 text-sm">
                          ชนะติดต่อกัน {user.stats.winStreak} เกม
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reset Stats Button */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  {showResetConfirm ? (
                    <div className="flex items-center gap-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex-1">
                        ยืนยันการรีเซ็ตสถิติ?
                      </p>
                      <button
                        onClick={handleResetStats}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        ยืนยัน
                      </button>
                      <button
                        onClick={() => setShowResetConfirm(false)}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowResetConfirm(true)}
                      className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors text-sm"
                    >
                      <RotateCcw className="w-4 h-4" />
                      รีเซ็ตสถิติ
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // No user or editing - show form
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              {isEditing ? (
                <>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    แก้ไขโปรไฟล์
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    เปลี่ยนชื่อหรือ avatar ของคุณ
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    สร้างโปรไฟล์
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    เริ่มต้นเล่นเกมโดยสร้างโปรไฟล์ของคุณ
                  </p>
                </>
              )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Avatar Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  เลือก Avatar
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {avatarOptions.map((avatar) => (
                    <button
                      key={avatar}
                      type="button"
                      onClick={() => setValue("avatar", avatar)}
                      className={`text-2xl p-2 rounded-lg transition-all ${
                        selectedAvatar === avatar
                          ? "bg-red-100 dark:bg-red-900/30 ring-2 ring-red-500 scale-110"
                          : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {avatar}
                    </button>
                  ))}
                </div>
                {errors.avatar && (
                  <p className="mt-2 text-sm text-red-500">
                    {errors.avatar.message}
                  </p>
                )}
              </div>

              {/* Name Input */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  ชื่อผู้เล่น
                </label>
                <input
                  {...register("name")}
                  type="text"
                  id="name"
                  placeholder="ใส่ชื่อของคุณ"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  maxLength={20}
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-500">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Selected Avatar Preview */}
              <div className="text-center py-4">
                <div className="text-6xl mb-2">{selectedAvatar}</div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Avatar ที่เลือก
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium transition-colors"
                  >
                    <X className="w-5 h-5" />
                    ยกเลิก
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-5 h-5" />
                  {isEditing ? "บันทึก" : "สร้างโปรไฟล์"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
