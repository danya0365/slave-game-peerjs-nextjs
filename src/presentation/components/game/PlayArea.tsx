"use client";

import type { PlayedHand } from "@/src/domain/types/card";
import { cn } from "@/src/lib/utils";
import { CardComponent } from "./CardComponent";

interface PlayAreaProps {
  currentHand: PlayedHand | null;
  lastPlayerName?: string;
}

/**
 * Play Area Component - Center area showing current played cards
 */
export function PlayArea({ currentHand, lastPlayerName }: PlayAreaProps) {
  return (
    <div className="relative">
      {/* Background table */}
      <div className="w-64 h-40 rounded-2xl bg-green-800/50 border-4 border-green-700/50 flex items-center justify-center">
        {currentHand ? (
          <div className="flex flex-col items-center gap-2">
            {/* Played cards */}
            <div className="flex justify-center">
              {currentHand.cards.map((card, index) => (
                <div
                  key={card.id}
                  className="transition-all duration-150"
                  style={{
                    marginLeft: index === 0 ? 0 : "-24px",
                    transform: `rotate(${
                      (index - (currentHand.cards.length - 1) / 2) * 5
                    }deg)`,
                    zIndex: index,
                  }}
                >
                  <CardComponent card={card} size="md" isPlayable={false} />
                </div>
              ))}
            </div>

            {/* Player name */}
            {lastPlayerName && (
              <div className="text-white/80 text-sm">{lastPlayerName}</div>
            )}
          </div>
        ) : (
          <div className="text-green-600/50 text-lg font-medium">
            ลงไพ่ที่นี่
          </div>
        )}
      </div>

      {/* Hand type indicator */}
      {currentHand && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gray-800 text-white text-xs font-medium rounded-full">
          {getHandTypeName(currentHand.type)}
        </div>
      )}
    </div>
  );
}

/**
 * Get Thai name for hand type
 */
function getHandTypeName(type: PlayedHand["type"]): string {
  const names: Record<PlayedHand["type"], string> = {
    single: "ใบเดียว",
    pair: "คู่",
    triple: "ตอง",
    four: "โฟร์",
    straight: "สเตรท",
    pair_straight: "คู่เรียง",
    triple_straight: "ตองเรียง",
  };
  return names[type];
}

/**
 * Game Controls - Play and Pass buttons
 */
interface GameControlsProps {
  onPlay: () => void;
  onPass: () => void;
  canPlay: boolean;
  canPass: boolean;
  selectedCount: number;
  isFirstTurn: boolean;
}

export function GameControls({
  onPlay,
  onPass,
  canPlay,
  canPass,
  selectedCount,
  isFirstTurn,
}: GameControlsProps) {
  return (
    <div className="flex items-center gap-4">
      {/* Pass button */}
      <button
        onClick={onPass}
        disabled={!canPass || isFirstTurn}
        className={cn(
          "px-6 py-3 rounded-xl font-semibold transition-all",
          canPass && !isFirstTurn
            ? "bg-gray-700 hover:bg-gray-600 text-white"
            : "bg-gray-800 text-gray-500 cursor-not-allowed"
        )}
      >
        ผ่าน
      </button>

      {/* Play button */}
      <button
        onClick={onPlay}
        disabled={!canPlay || selectedCount === 0}
        className={cn(
          "px-8 py-3 rounded-xl font-semibold transition-all",
          canPlay && selectedCount > 0
            ? "bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg shadow-green-500/30"
            : "bg-gray-800 text-gray-500 cursor-not-allowed"
        )}
      >
        ลงไพ่ ({selectedCount})
      </button>

      {/* First turn hint */}
      {isFirstTurn && (
        <div className="text-yellow-400 text-sm">ต้องลง 3♣ ในตานี้</div>
      )}
    </div>
  );
}
