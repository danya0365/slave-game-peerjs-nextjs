"use client";

import type { Card } from "@/src/domain/types/card";
import { RANK_DISPLAY, SUIT_DISPLAY } from "@/src/domain/types/card";
import { cn } from "@/src/lib/utils";

interface CardComponentProps {
  card: Card;
  isSelected?: boolean;
  isPlayable?: boolean;
  isHidden?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  onClick?: () => void;
}

/**
 * Card Component - Displays a single playing card
 */
export function CardComponent({
  card,
  isSelected = false,
  isPlayable = true,
  isHidden = false,
  size = "md",
  onClick,
}: CardComponentProps) {
  const suitInfo = SUIT_DISPLAY[card.suit];
  const rankInfo = RANK_DISPLAY[card.rank];

  const sizeClasses = {
    xs: "w-8 h-11 text-[10px]",
    sm: "w-10 h-14 text-xs",
    md: "w-14 h-20 text-sm",
    lg: "w-20 h-28 text-base",
  };

  // Back of card (hidden)
  if (isHidden) {
    return (
      <div
        className={cn(
          sizeClasses[size],
          "rounded-lg bg-linear-to-br from-red-700 to-red-900 border-2 border-red-800",
          "flex items-center justify-center shadow-md",
          "select-none"
        )}
      >
        <div className="w-3/4 h-3/4 rounded border border-red-600 bg-red-800 flex items-center justify-center">
          <span className="text-red-400 font-bold">♠</span>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={!isPlayable}
      className={cn(
        sizeClasses[size],
        "rounded-lg bg-white border-2 shadow-md transition-all duration-150",
        "flex flex-col items-center justify-between p-1",
        "select-none relative",
        // Selected state
        isSelected &&
          "ring-2 ring-blue-500 -translate-y-2 shadow-lg shadow-blue-500/30",
        // Playable state
        isPlayable
          ? "hover:-translate-y-1 hover:shadow-lg cursor-pointer border-gray-300"
          : "cursor-not-allowed border-gray-200",
        // Click effect
        isPlayable && "active:scale-95"
      )}
    >
      {/* Top left corner */}
      <div className="self-start flex flex-col items-center leading-none">
        <span className={cn("font-bold", suitInfo.color)}>
          {rankInfo.display}
        </span>
        <span
          className={cn(suitInfo.color, size === "xs" ? "text-sm" : "text-lg")}
        >
          {suitInfo.symbol}
        </span>
      </div>
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs">✓</span>
        </div>
      )}
    </button>
  );
}

/**
 * Card Back Component - Shows back of card
 */
export function CardBack({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-10 h-14",
    md: "w-14 h-20",
    lg: "w-20 h-28",
  };

  return (
    <div
      className={cn(
        sizeClasses[size],
        "rounded-lg bg-linear-to-br from-red-700 to-red-900 border-2 border-red-800",
        "flex items-center justify-center shadow-md",
        "select-none"
      )}
    >
      <div className="w-3/4 h-3/4 rounded border border-red-600 bg-red-800 flex items-center justify-center">
        <span className="text-red-400 font-bold text-lg">♠</span>
      </div>
    </div>
  );
}

/**
 * Mini Card - Small card representation
 */
export function MiniCard({ card }: { card: Card }) {
  const suitInfo = SUIT_DISPLAY[card.suit];
  const rankInfo = RANK_DISPLAY[card.rank];

  return (
    <div className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-white rounded border border-gray-300 text-sm font-medium">
      <span className={suitInfo.color}>{rankInfo.display}</span>
      <span className={suitInfo.color}>{suitInfo.symbol}</span>
    </div>
  );
}
