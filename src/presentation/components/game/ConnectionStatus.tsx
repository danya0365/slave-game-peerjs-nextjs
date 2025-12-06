"use client";

import { cn } from "@/src/lib/utils";
import { useConnectionManager } from "@/src/presentation/hooks/useConnectionManager";
import { usePeerStore } from "@/src/presentation/stores/peerStore";
import {
  AlertTriangle,
  Loader2,
  RefreshCw,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { useState } from "react";

interface ConnectionStatusProps {
  showDetails?: boolean;
  className?: string;
}

/**
 * Connection Status Indicator
 * Shows current P2P connection status with reconnect option
 */
export function ConnectionStatusIndicator({
  showDetails = false,
  className,
}: ConnectionStatusProps) {
  const connectionStatus = usePeerStore((s) => s.connectionStatus);
  const error = usePeerStore((s) => s.error);

  const {
    isReconnecting,
    reconnectAttempts,
    maxReconnectAttempts,
    attemptReconnect,
    canReconnect,
  } = useConnectionManager();

  const getStatusInfo = () => {
    if (isReconnecting) {
      return {
        icon: Loader2,
        text: `กำลังเชื่อมต่อใหม่ (${reconnectAttempts}/${maxReconnectAttempts})`,
        color: "text-yellow-400",
        bgColor: "bg-yellow-500/20",
        animate: true,
      };
    }

    switch (connectionStatus) {
      case "connected":
        return {
          icon: Wifi,
          text: "เชื่อมต่อแล้ว",
          color: "text-green-400",
          bgColor: "bg-green-500/20",
          animate: false,
        };
      case "connecting":
        return {
          icon: Loader2,
          text: "กำลังเชื่อมต่อ",
          color: "text-yellow-400",
          bgColor: "bg-yellow-500/20",
          animate: true,
        };
      case "initializing":
        return {
          icon: Loader2,
          text: "กำลังเริ่มต้น",
          color: "text-blue-400",
          bgColor: "bg-blue-500/20",
          animate: true,
        };
      case "disconnected":
        return {
          icon: WifiOff,
          text: "ขาดการเชื่อมต่อ",
          color: "text-red-400",
          bgColor: "bg-red-500/20",
          animate: false,
        };
      case "error":
        return {
          icon: AlertTriangle,
          text: "เกิดข้อผิดพลาด",
          color: "text-red-400",
          bgColor: "bg-red-500/20",
          animate: false,
        };
      default:
        return {
          icon: WifiOff,
          text: "ไม่ได้เชื่อมต่อ",
          color: "text-gray-400",
          bgColor: "bg-gray-500/20",
          animate: false,
        };
    }
  };

  const status = getStatusInfo();
  const Icon = status.icon;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full",
          status.bgColor
        )}
      >
        <Icon
          className={cn(
            "w-4 h-4",
            status.color,
            status.animate && "animate-spin"
          )}
        />
        <span className={cn("text-sm font-medium", status.color)}>
          {status.text}
        </span>
      </div>

      {/* Reconnect button */}
      {(connectionStatus === "disconnected" || connectionStatus === "error") &&
        canReconnect &&
        !isReconnecting && (
          <button
            onClick={attemptReconnect}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm font-medium"
          >
            <RefreshCw className="w-3 h-3" />
            ลองใหม่
          </button>
        )}

      {/* Show error details */}
      {showDetails && error && (
        <span className="text-red-400 text-xs ml-2">{error}</span>
      )}
    </div>
  );
}

/**
 * Connection Lost Modal
 * Full screen overlay when connection is lost
 */
export function ConnectionLostModal() {
  const connectionStatus = usePeerStore((s) => s.connectionStatus);
  const error = usePeerStore((s) => s.error);
  const room = usePeerStore((s) => s.room);

  const {
    isReconnecting,
    reconnectAttempts,
    maxReconnectAttempts,
    attemptReconnect,
    canReconnect,
  } = useConnectionManager();

  const [dismissed, setDismissed] = useState(false);

  // Show modal when disconnected or error (and in a room)
  const shouldShow =
    !dismissed &&
    room &&
    (connectionStatus === "disconnected" || connectionStatus === "error");

  if (!shouldShow) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 relative">
        {/* Dismiss button */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          {isReconnecting ? (
            <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-yellow-400 animate-spin" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
              <WifiOff className="w-10 h-10 text-red-400" />
            </div>
          )}
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-white text-center mb-2">
          {isReconnecting
            ? "กำลังเชื่อมต่อใหม่..."
            : error?.includes("Host ออก")
            ? "เกมจบลง"
            : "ขาดการเชื่อมต่อ"}
        </h2>

        {/* Message */}
        <p className="text-gray-400 text-center mb-6">
          {isReconnecting
            ? `พยายามเชื่อมต่อครั้งที่ ${reconnectAttempts} จาก ${maxReconnectAttempts}`
            : error?.includes("Host ออก")
            ? "Host ได้ออกจากห้องแล้ว เกมถูกยกเลิก"
            : error || "การเชื่อมต่อกับห้องถูกตัด กรุณาลองเชื่อมต่อใหม่"}
        </p>

        {/* Progress indicator */}
        {isReconnecting && (
          <div className="mb-6">
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-500 transition-all duration-300"
                style={{
                  width: `${(reconnectAttempts / maxReconnectAttempts) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {/* Don't show reconnect button if host left */}
          {canReconnect && !isReconnecting && !error?.includes("Host ออก") && (
            <button
              onClick={attemptReconnect}
              className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              เชื่อมต่อใหม่
            </button>
          )}

          <a
            href="/lobby"
            className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors text-center"
          >
            กลับห้องรอ
          </a>
        </div>

        {/* Tip */}
        {!canReconnect && !isReconnecting && !error?.includes("Host ออก") && (
          <p className="text-yellow-400 text-sm text-center mt-4">
            ไม่สามารถเชื่อมต่อใหม่ได้ กรุณากลับไปห้องรอ
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Connection Quality Badge
 * Small indicator for connection quality
 */
export function ConnectionQualityBadge() {
  const connectionStatus = usePeerStore((s) => s.connectionStatus);
  const { connectionQuality } = useConnectionManager();

  if (connectionStatus !== "connected") return null;

  const qualityConfig = {
    good: { color: "bg-green-500", label: "ดี" },
    poor: { color: "bg-yellow-500", label: "ไม่เสถียร" },
    disconnected: { color: "bg-red-500", label: "หลุด" },
  };

  const config = qualityConfig[connectionQuality];

  return (
    <div className="flex items-center gap-1.5">
      <div className={cn("w-2 h-2 rounded-full", config.color)} />
      <span className="text-xs text-gray-400">{config.label}</span>
    </div>
  );
}
