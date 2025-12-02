"use client";

import { cn } from "@/src/lib/utils";
import { Loader2, Spade } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
  variant?: "default" | "card" | "minimal";
  className?: string;
}

/**
 * Loading Spinner Component
 */
export function LoadingSpinner({
  size = "md",
  message,
  variant = "default",
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  if (variant === "minimal") {
    return (
      <Loader2
        className={cn(
          sizeClasses[size],
          "animate-spin text-red-500",
          className
        )}
      />
    );
  }

  if (variant === "card") {
    return (
      <div className={cn("flex flex-col items-center gap-4", className)}>
        <div className="relative">
          <div
            className={cn(
              sizeClasses[size],
              "rounded-lg bg-linear-to-br from-red-500 to-red-700 flex items-center justify-center animate-pulse"
            )}
          >
            <Spade className="w-1/2 h-1/2 text-white" />
          </div>
          <div className="absolute inset-0 rounded-lg border-2 border-red-400 animate-ping opacity-50" />
        </div>
        {message && (
          <p className={cn("text-gray-400", textSizes[size])}>{message}</p>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className="relative">
        <Loader2
          className={cn(sizeClasses[size], "animate-spin text-red-500")}
        />
      </div>
      {message && (
        <p className={cn("text-gray-400", textSizes[size])}>{message}</p>
      )}
    </div>
  );
}

/**
 * Full Page Loading
 */
export function FullPageLoading({
  message = "กำลังโหลด...",
}: {
  message?: string;
}) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <LoadingSpinner size="lg" message={message} variant="card" />
    </div>
  );
}

/**
 * Inline Loading (for buttons, etc.)
 */
export function InlineLoading({ className }: { className?: string }) {
  return <LoadingSpinner size="sm" variant="minimal" className={className} />;
}
