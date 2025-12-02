"use client";

import { cn } from "@/src/lib/utils";
import { AlertTriangle, RefreshCw, WifiOff, XCircle } from "lucide-react";
import Link from "next/link";

type ErrorType = "generic" | "connection" | "not_found" | "permission";

interface ErrorDisplayProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  onRetry?: () => void;
  showHomeLink?: boolean;
  className?: string;
}

const errorConfig: Record<
  ErrorType,
  { icon: typeof AlertTriangle; defaultTitle: string; defaultMessage: string }
> = {
  generic: {
    icon: XCircle,
    defaultTitle: "เกิดข้อผิดพลาด",
    defaultMessage: "มีบางอย่างผิดพลาด กรุณาลองใหม่อีกครั้ง",
  },
  connection: {
    icon: WifiOff,
    defaultTitle: "ไม่สามารถเชื่อมต่อได้",
    defaultMessage: "ไม่พบการเชื่อมต่อ กรุณาตรวจสอบอินเทอร์เน็ตของคุณ",
  },
  not_found: {
    icon: AlertTriangle,
    defaultTitle: "ไม่พบข้อมูล",
    defaultMessage: "ไม่พบสิ่งที่คุณกำลังมองหา",
  },
  permission: {
    icon: XCircle,
    defaultTitle: "ไม่มีสิทธิ์เข้าถึง",
    defaultMessage: "คุณไม่มีสิทธิ์เข้าถึงหน้านี้",
  },
};

/**
 * Error Display Component
 */
export function ErrorDisplay({
  type = "generic",
  title,
  message,
  onRetry,
  showHomeLink = true,
  className,
}: ErrorDisplayProps) {
  const config = errorConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center",
        className
      )}
    >
      <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-red-500" />
      </div>

      <h2 className="text-xl font-bold text-white mb-2">
        {title || config.defaultTitle}
      </h2>

      <p className="text-gray-400 mb-6 max-w-md">
        {message || config.defaultMessage}
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            ลองใหม่
          </button>
        )}

        {showHomeLink && (
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors"
          >
            กลับหน้าแรก
          </Link>
        )}
      </div>
    </div>
  );
}

/**
 * Full Page Error
 */
export function FullPageError({
  type = "generic",
  title,
  message,
  onRetry,
}: Omit<ErrorDisplayProps, "className" | "showHomeLink">) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <ErrorDisplay
        type={type}
        title={title}
        message={message}
        onRetry={onRetry}
        showHomeLink
      />
    </div>
  );
}

/**
 * Inline Error Banner
 */
export function ErrorBanner({
  message,
  onDismiss,
  className,
}: {
  message: string;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 bg-red-900/30 border border-red-800 rounded-xl",
        className
      )}
    >
      <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
      <p className="text-red-400 flex-1">{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-400 hover:text-red-300 transition-colors"
        >
          <XCircle className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
