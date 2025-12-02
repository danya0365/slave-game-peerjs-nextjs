"use client";

import type { Card } from "@/src/domain/types/card";
import { cn } from "@/src/lib/utils";
import { CardComponent } from "./CardComponent";

interface PlayerHandProps {
  cards: Card[];
  selectedCards: Card[];
  onCardSelect: (card: Card) => void;
  isCurrentTurn: boolean;
  disabled?: boolean;
}

/**
 * Player Hand Component - Displays player's cards in a fan layout
 */
export function PlayerHand({
  cards,
  selectedCards,
  onCardSelect,
  isCurrentTurn,
  disabled = false,
}: PlayerHandProps) {
  const isCardSelected = (card: Card) =>
    selectedCards.some((c) => c.id === card.id);

  return (
    <div className="relative">
      {/* Turn indicator */}
      {isCurrentTurn && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 bg-yellow-500 text-yellow-900 rounded-full text-sm font-bold animate-pulse">
          ตาของคุณ!
        </div>
      )}

      {/* Cards */}
      <div
        className={cn(
          "flex justify-center items-end",
          "transition-all duration-300",
          isCurrentTurn && "scale-105"
        )}
      >
        {cards.map((card, index) => {
          // Calculate offset for fan effect
          const totalCards = cards.length;
          const middleIndex = (totalCards - 1) / 2;
          const offset = index - middleIndex;
          const rotation = offset * 2; // 2 degrees per card from center

          return (
            <div
              key={card.id}
              className="transition-all duration-150"
              style={{
                marginLeft: index === 0 ? 0 : "-32px",
                transform: `rotate(${rotation}deg)`,
                zIndex: index,
              }}
            >
              <CardComponent
                card={card}
                isSelected={isCardSelected(card)}
                isPlayable={isCurrentTurn && !disabled}
                onClick={() => !disabled && onCardSelect(card)}
                size="md"
              />
            </div>
          );
        })}
      </div>

      {/* Card count */}
      <div className="text-center mt-2 text-gray-400 text-sm">
        {cards.length} ใบ
      </div>
    </div>
  );
}

/**
 * Opponent Hand - Shows card backs for opponents
 */
interface OpponentHandProps {
  cardCount: number;
  playerName: string;
  avatar: string;
  isCurrentTurn: boolean;
  hasPassed: boolean;
  position: "top" | "left" | "right";
}

export function OpponentHand({
  cardCount,
  playerName,
  avatar,
  isCurrentTurn,
  hasPassed,
  position,
}: OpponentHandProps) {
  // Layout based on position
  const containerClass = cn(
    "flex items-center gap-3",
    position === "top" && "flex-col",
    position === "left" && "flex-row",
    position === "right" && "flex-row-reverse"
  );

  const cardsContainerClass = cn(
    "flex",
    position === "top" && "flex-row justify-center",
    (position === "left" || position === "right") && "flex-col"
  );

  // Show fewer card backs with count indicator
  const displayCount = Math.min(cardCount, 5);

  return (
    <div className={containerClass}>
      {/* Player info */}
      <div
        className={cn(
          "flex flex-col items-center gap-1 p-2 rounded-lg",
          isCurrentTurn && "bg-yellow-500/20 ring-2 ring-yellow-500"
        )}
      >
        <div className="text-3xl">{avatar}</div>
        <div className="text-white text-sm font-medium text-center truncate max-w-20">
          {playerName}
        </div>
        {hasPassed && (
          <div className="text-red-400 text-xs font-medium">ผ่าน</div>
        )}
        {cardCount === 0 && (
          <div className="text-green-400 text-xs font-medium">ออกแล้ว!</div>
        )}
      </div>

      {/* Cards */}
      {cardCount > 0 && (
        <div className={cardsContainerClass}>
          {Array.from({ length: displayCount }).map((_, i) => (
            <div
              key={i}
              className={cn(
                position === "top" && "-ml-6 first:ml-0",
                (position === "left" || position === "right") &&
                  "-mt-10 first:mt-0"
              )}
              style={{ zIndex: i }}
            >
              <div
                className={cn(
                  "w-8 h-12 rounded bg-linear-to-br from-red-700 to-red-900 border border-red-800",
                  "flex items-center justify-center shadow",
                  position === "left" && "rotate-90",
                  position === "right" && "-rotate-90"
                )}
              >
                <span className="text-red-400 text-xs">♠</span>
              </div>
            </div>
          ))}
          {/* Card count badge */}
          <div
            className={cn(
              "bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded-full",
              position === "top" && "-ml-2",
              (position === "left" || position === "right") && "-mt-2"
            )}
          >
            {cardCount}
          </div>
        </div>
      )}
    </div>
  );
}
