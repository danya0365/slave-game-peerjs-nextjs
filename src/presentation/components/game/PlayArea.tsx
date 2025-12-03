"use client";

import type { PlayedHand } from "@/src/domain/types/card";
import { cn } from "@/src/lib/utils";
import { CardComponent } from "./CardComponent";

interface PlayAreaProps {
  currentHand: PlayedHand | null;
  discardPile: PlayedHand[];
  lastPlayerName?: string;
}

/**
 * Play Area Component - Center area showing all discarded cards
 */
export function PlayArea({
  currentHand,
  discardPile,
  lastPlayerName,
}: PlayAreaProps) {
  // Show last 5 hands max to avoid overflow
  const visibleHands = discardPile.slice(-5);

  return (
    <div className="relative">
      {/* Background table - smaller on mobile */}
      <div className="w-44 h-28 md:w-72 md:h-48 rounded-xl md:rounded-2xl bg-green-800/50 border-2 md:border-4 border-green-700/50 flex items-center justify-center overflow-hidden">
        {discardPile.length > 0 ? (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Stacked discard pile */}
            {visibleHands.map((hand, handIndex) => {
              const isLatest = handIndex === visibleHands.length - 1;
              // Stack cards with offset - smaller on mobile
              const offsetX = (handIndex - visibleHands.length / 2) * 4;
              const offsetY = (handIndex - visibleHands.length / 2) * 2;
              const rotation = (handIndex - visibleHands.length / 2) * 2;

              return (
                <div
                  key={`hand-${handIndex}`}
                  className={cn(
                    "absolute transition-all duration-300",
                    !isLatest && "opacity-60"
                  )}
                  style={{
                    transform: `translate(${offsetX}px, ${offsetY}px) rotate(${rotation}deg)`,
                    zIndex: handIndex,
                  }}
                >
                  <div className="flex">
                    {hand.cards.map((card, cardIndex) => (
                      <div
                        key={card.id}
                        style={{
                          marginLeft: cardIndex === 0 ? 0 : "-18px",
                          transform: `rotate(${
                            (cardIndex - (hand.cards.length - 1) / 2) * 2
                          }deg)`,
                          zIndex: cardIndex,
                        }}
                      >
                        {/* Responsive card sizes */}
                        <div className="block md:hidden">
                          <CardComponent
                            card={card}
                            size={isLatest ? "sm" : "xs"}
                            isPlayable={false}
                          />
                        </div>
                        <div className="hidden md:block">
                          <CardComponent
                            card={card}
                            size={isLatest ? "md" : "sm"}
                            isPlayable={false}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Latest player name - smaller on mobile */}
            {lastPlayerName && (
              <div className="absolute bottom-1 md:bottom-2 left-1/2 -translate-x-1/2 text-white/80 text-[10px] md:text-sm bg-black/40 px-1.5 md:px-2 py-0.5 md:py-1 rounded">
                {lastPlayerName}
              </div>
            )}
          </div>
        ) : (
          <div className="text-green-600/50 text-sm md:text-lg font-medium">
            ลงไพ่ที่นี่
          </div>
        )}
      </div>

      {/* Hand type indicator - smaller on mobile */}
      {currentHand && (
        <div className="absolute -top-2 md:-top-3 left-1/2 -translate-x-1/2 px-2 md:px-3 py-0.5 md:py-1 bg-gray-800 text-white text-[10px] md:text-xs font-medium rounded-full whitespace-nowrap">
          {getHandTypeName(currentHand.type)}
        </div>
      )}

      {/* Card count badge */}
      {discardPile.length > 0 && (
        <div className="absolute -bottom-1 md:-bottom-2 right-1 md:right-2 px-1.5 md:px-2 py-0.5 bg-gray-700 text-white text-[10px] md:text-xs rounded-full">
          {discardPile.reduce((sum, h) => sum + h.cards.length, 0)} ใบ
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
    <div className="flex items-center gap-2 md:gap-4">
      {/* Pass button */}
      <button
        onClick={onPass}
        disabled={!canPass || isFirstTurn}
        className={cn(
          "px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl font-semibold text-sm md:text-base transition-all",
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
          "px-5 md:px-8 py-2 md:py-3 rounded-lg md:rounded-xl font-semibold text-sm md:text-base transition-all",
          canPlay && selectedCount > 0
            ? "bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg shadow-green-500/30"
            : "bg-gray-800 text-gray-500 cursor-not-allowed"
        )}
      >
        ลงไพ่ ({selectedCount})
      </button>

      {/* First turn hint - hidden on mobile, shown on desktop */}
      {isFirstTurn && (
        <div className="hidden md:block text-yellow-400 text-sm">ต้องลง 3♣</div>
      )}
    </div>
  );
}
