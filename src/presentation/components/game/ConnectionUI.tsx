"use client";

import type { PlayerConnectionStatus } from "@/src/domain/types/peer";
import { cn } from "@/src/lib/utils";
import { useConnectionStore } from "@/src/presentation/stores/connectionStore";
import {
  AlertTriangle,
  CheckCircle,
  Info,
  Loader2,
  RefreshCw,
  WifiOff,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

// ============================================
// Connection Status Badge (for each player)
// ============================================
interface ConnectionStatusBadgeProps {
  status: PlayerConnectionStatus;
  size?: "sm" | "md";
  showLabel?: boolean;
}

export function ConnectionStatusBadge({
  status,
  size = "sm",
  showLabel = false,
}: ConnectionStatusBadgeProps) {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
  };

  const statusConfig = {
    online: {
      color: "bg-green-500",
      pulse: false,
      label: "ออนไลน์",
    },
    unstable: {
      color: "bg-yellow-500",
      pulse: true,
      label: "ไม่เสถียร",
    },
    offline: {
      color: "bg-red-500",
      pulse: false,
      label: "ออฟไลน์",
    },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-1">
      <span
        className={cn(
          sizeClasses[size],
          "rounded-full",
          config.color,
          config.pulse && "animate-pulse"
        )}
      />
      {showLabel && (
        <span className="text-xs text-gray-400">{config.label}</span>
      )}
    </div>
  );
}

// ============================================
// Player Status Overlay (shows on player avatar)
// ============================================
interface PlayerStatusOverlayProps {
  status: PlayerConnectionStatus;
}

export function PlayerStatusOverlay({ status }: PlayerStatusOverlayProps) {
  if (status === "online") return null;

  return (
    <div
      className={cn(
        "absolute inset-0 rounded-full flex items-center justify-center",
        status === "offline" && "bg-black/60",
        status === "unstable" && "bg-yellow-500/30"
      )}
    >
      {status === "offline" && <WifiOff className="w-4 h-4 text-red-400" />}
      {status === "unstable" && (
        <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
      )}
    </div>
  );
}

// ============================================
// Reconnect Modal
// ============================================
interface ReconnectModalProps {
  isOpen: boolean;
  onReconnect: () => void;
  onLeave: () => void;
  attempts: number;
  maxAttempts?: number;
}

export function ReconnectModal({
  isOpen,
  onReconnect,
  onLeave,
  attempts,
  maxAttempts = 5,
}: ReconnectModalProps) {
  const [countdown, setCountdown] = useState(3);
  const [isAutoReconnecting, setIsAutoReconnecting] = useState(true);

  useEffect(() => {
    if (!isOpen || !isAutoReconnecting) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Auto reconnect when countdown reaches 0
      onReconnect();
      setCountdown(3);
    }
  }, [isOpen, countdown, isAutoReconnecting, onReconnect]);

  if (!isOpen) return null;

  const progress = Math.min((attempts / maxAttempts) * 100, 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl border border-gray-700">
        <div className="text-center">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <WifiOff className="w-8 h-8 text-red-400" />
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-white mb-2">
            🔴 การเชื่อมต่อหลุด
          </h2>

          {/* Status */}
          <p className="text-gray-400 mb-4">
            {isAutoReconnecting
              ? `กำลังเชื่อมต่อใหม่ใน ${countdown} วินาที...`
              : "กดปุ่มเพื่อเชื่อมต่อใหม่"}
          </p>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>ความพยายามครั้งที่ {attempts}</span>
              <span>{maxAttempts} ครั้ง</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-red-500 to-orange-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setIsAutoReconnecting(false);
                onReconnect();
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              เชื่อมต่อใหม่
            </button>
            <button
              onClick={onLeave}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors"
            >
              <X className="w-4 h-4" />
              ออกจากห้อง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Disconnected Players Banner
// ============================================
interface DisconnectedPlayersBannerProps {
  players: { playerId: string; playerName: string }[];
  isHost: boolean;
  onKickPlayer?: (playerId: string) => void;
}

export function DisconnectedPlayersBanner({
  players,
  isHost,
  onKickPlayer,
}: DisconnectedPlayersBannerProps) {
  if (players.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40">
      <div className="bg-yellow-500/90 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-900" />
          <div>
            <p className="text-yellow-900 font-medium text-sm">
              {players.map((p) => p.playerName).join(", ")} หลุดออกไป
            </p>
            <p className="text-yellow-800 text-xs">รอการเชื่อมต่อใหม่...</p>
          </div>
          {isHost && onKickPlayer && players.length === 1 && (
            <button
              onClick={() => onKickPlayer(players[0].playerId)}
              className="ml-2 px-3 py-1 rounded-lg bg-yellow-700 hover:bg-yellow-800 text-white text-xs font-medium transition-colors"
            >
              เตะออก
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Sync Button
// ============================================
interface SyncButtonProps {
  onSync: () => void;
  isSyncing?: boolean;
}

export function SyncButton({ onSync, isSyncing = false }: SyncButtonProps) {
  return (
    <button
      onClick={onSync}
      disabled={isSyncing}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        isSyncing
          ? "bg-gray-700 text-gray-400 cursor-not-allowed"
          : "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
      )}
    >
      <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
      {isSyncing ? "กำลัง Sync..." : "Sync State"}
    </button>
  );
}

// ============================================
// Toast Notifications
// ============================================
export function ToastContainer() {
  const toasts = useConnectionStore((s) => s.toasts);
  const removeToast = useConnectionStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  const iconMap = {
    info: <Info className="w-4 h-4 text-blue-400" />,
    warning: <AlertTriangle className="w-4 h-4 text-yellow-400" />,
    error: <XCircle className="w-4 h-4 text-red-400" />,
    success: <CheckCircle className="w-4 h-4 text-green-400" />,
  };

  const bgMap = {
    info: "bg-blue-500/20 border-blue-500/30",
    warning: "bg-yellow-500/20 border-yellow-500/30",
    error: "bg-red-500/20 border-red-500/30",
    success: "bg-green-500/20 border-green-500/30",
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl backdrop-blur-sm border shadow-lg animate-slide-in-right",
            bgMap[toast.type]
          )}
        >
          {iconMap[toast.type]}
          <span className="text-white text-sm">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ============================================
// Connection Status Indicator (global)
// ============================================
interface ConnectionStatusIndicatorProps {
  isConnected: boolean;
  isReconnecting: boolean;
}

export function ConnectionStatusIndicator({
  isConnected,
  isReconnecting,
}: ConnectionStatusIndicatorProps) {
  if (isConnected && !isReconnecting) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <div
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-sm",
          isReconnecting
            ? "bg-yellow-500/20 border border-yellow-500/30"
            : "bg-red-500/20 border border-red-500/30"
        )}
      >
        {isReconnecting ? (
          <>
            <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
            <span className="text-yellow-400 text-sm">
              กำลังเชื่อมต่อใหม่...
            </span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 text-red-400" />
            <span className="text-red-400 text-sm">ไม่มีการเชื่อมต่อ</span>
          </>
        )}
      </div>
    </div>
  );
}
