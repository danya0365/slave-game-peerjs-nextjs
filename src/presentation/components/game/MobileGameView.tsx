"use client";

import type { Card, PlayedHand } from "@/src/domain/types/card";
import { cn } from "@/src/lib/utils";
import type { GamePlayer } from "@/src/presentation/stores/gameStore";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { CardComponent } from "./CardComponent";

interface MobileGameBoardProps {
  myHand: Card[];
  selectedCards: Card[];
  onCardSelect: (card: Card) => void;
  currentHand: PlayedHand | null;
  opponents: GamePlayer[];
  isMyTurn: boolean;
  onPlay: () => void;
  onPass: () => void;
  canPlay: boolean;
  canPass: boolean;
  isFirstTurn: boolean;
}

/**
 * Mobile-optimized Game Board
 * Vertical layout with collapsible opponent info
 */
export function MobileGameBoard({
  myHand,
  selectedCards,
  onCardSelect,
  currentHand,
  opponents,
  isMyTurn,
  onPlay,
  onPass,
  canPlay,
  canPass,
  isFirstTurn,
}: MobileGameBoardProps) {
  const [showOpponents, setShowOpponents] = useState(false);

  const isCardSelected = (card: Card) =>
    selectedCards.some((c) => c.id === card.id);

  return (
    <div className="flex flex-col h-full">
      {/* Opponents bar (collapsible) */}
      <div className="bg-gray-800/80 backdrop-blur-sm">
        <button
          onClick={() => setShowOpponents(!showOpponents)}
          className="w-full flex items-center justify-between px-4 py-2"
        >
          <span className="text-gray-300 text-sm">
            ผู้เล่นอื่น ({opponents.filter((o) => o.hand.length > 0).length}/3)
          </span>
          {showOpponents ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {showOpponents && (
          <div className="grid grid-cols-3 gap-2 p-3 border-t border-gray-700">
            {opponents.map((opponent) => (
              <div
                key={opponent.id}
                className={cn(
                  "flex flex-col items-center p-2 rounded-lg",
                  opponent.isCurrentTurn &&
                    "bg-yellow-500/20 ring-1 ring-yellow-500"
                )}
              >
                <span className="text-2xl">{opponent.avatar}</span>
                <span className="text-white text-xs font-medium truncate max-w-full">
                  {opponent.name}
                </span>
                <div className="flex items-center gap-1 mt-1">
                  <div className="flex -space-x-1">
                    {Array.from({
                      length: Math.min(3, opponent.hand.length),
                    }).map((_, i) => (
                      <div
                        key={i}
                        className="w-3 h-4 bg-red-800 rounded-sm border border-red-600"
                      />
                    ))}
                  </div>
                  <span className="text-gray-400 text-xs">
                    {opponent.hand.length}
                  </span>
                </div>
                {opponent.hasPassed && (
                  <span className="text-red-400 text-xs mt-1">ผ่าน</span>
                )}
                {opponent.hand.length === 0 && (
                  <span className="text-green-400 text-xs mt-1">ออกแล้ว</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Play area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-xs">
          {/* Current hand on table */}
          <div className="bg-green-800/50 rounded-2xl p-4 min-h-32 flex flex-col items-center justify-center border-2 border-green-700/50">
            {currentHand ? (
              <>
                <div className="flex justify-center mb-2">
                  {currentHand.cards.map((card, index) => (
                    <div
                      key={card.id}
                      style={{ marginLeft: index === 0 ? 0 : "-20px" }}
                    >
                      <CardComponent card={card} size="sm" isPlayable={false} />
                    </div>
                  ))}
                </div>
                <span className="text-green-300 text-xs">
                  {getHandTypeName(currentHand.type)}
                </span>
              </>
            ) : (
              <span className="text-green-600/50 text-sm">ลงไพ่ที่นี่</span>
            )}
          </div>

          {/* Turn indicator */}
          {isMyTurn && (
            <div className="text-center mt-3">
              <span className="px-4 py-1 bg-yellow-500 text-yellow-900 rounded-full text-sm font-bold animate-pulse">
                ตาของคุณ!
              </span>
            </div>
          )}

          {/* First turn hint */}
          {isFirstTurn && isMyTurn && (
            <p className="text-yellow-400 text-xs text-center mt-2">
              ต้องลง 3♣ ในตานี้
            </p>
          )}
        </div>
      </div>

      {/* My hand */}
      <div className="bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 p-3">
        {/* Cards */}
        <div className="flex justify-center overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex">
            {myHand.map((card, index) => (
              <div
                key={card.id}
                style={{ marginLeft: index === 0 ? 0 : "-24px" }}
                className="transition-transform"
              >
                <CardComponent
                  card={card}
                  isSelected={isCardSelected(card)}
                  isPlayable={isMyTurn}
                  onClick={() => isMyTurn && onCardSelect(card)}
                  size="sm"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3 mt-3">
          <button
            onClick={onPass}
            disabled={!canPass || isFirstTurn}
            className={cn(
              "flex-1 py-3 rounded-xl font-semibold transition-all",
              canPass && !isFirstTurn
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-gray-800 text-gray-500 cursor-not-allowed"
            )}
          >
            ผ่าน
          </button>
          <button
            onClick={onPlay}
            disabled={!canPlay}
            className={cn(
              "flex-1 py-3 rounded-xl font-semibold transition-all",
              canPlay
                ? "bg-linear-to-r from-green-500 to-green-600 text-white"
                : "bg-gray-800 text-gray-500 cursor-not-allowed"
            )}
          >
            ลงไพ่ ({selectedCards.length})
          </button>
        </div>

        {/* Card count */}
        <p className="text-center text-gray-500 text-xs mt-2">
          ไพ่ในมือ: {myHand.length} ใบ
        </p>
      </div>
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
