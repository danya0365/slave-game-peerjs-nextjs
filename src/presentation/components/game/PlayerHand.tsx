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

  // Calculate overlap - mobile needs more gap for readability
  const getOverlap = () => {
    // Mobile: sm card = 40px wide, show more of each card
    // Desktop: md card = 56px wide, can overlap more
    if (cards.length <= 5) return { mobile: -12, desktop: -32 };
    if (cards.length <= 8) return { mobile: -14, desktop: -36 };
    if (cards.length <= 10) return { mobile: -16, desktop: -40 };
    return { mobile: -18, desktop: -44 }; // 22px visible per card
  };

  const overlap = getOverlap();

  return (
    <div className="relative w-full overflow-visible">
      {/* Turn indicator */}
      {isCurrentTurn && (
        <div className="absolute -top-6 md:-top-8 left-1/2 -translate-x-1/2 px-2 md:px-3 py-0.5 md:py-1 bg-yellow-500 text-yellow-900 rounded-full text-xs md:text-sm font-bold animate-pulse whitespace-nowrap z-20">
          ตาของคุณ!
        </div>
      )}

      {/* Cards container - centered with scroll on mobile when needed */}
      <div
        className={cn(
          "flex items-end justify-center pb-2 pt-4",
          "transition-all duration-300",
          "overflow-x-auto md:overflow-visible",
          isCurrentTurn && "md:scale-105"
        )}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {cards.map((card, index) => {
          // Calculate offset for fan effect
          const totalCards = cards.length;
          const middleIndex = (totalCards - 1) / 2;
          const offset = index - middleIndex;
          const rotation = offset * 1.5; // Reduced rotation for mobile

          return (
            <div
              key={card.id}
              className="transition-all duration-150 shrink-0"
              style={{
                marginLeft: index === 0 ? 0 : `${overlap.mobile}px`,
                transform: `rotate(${rotation}deg)`,
                zIndex: index,
              }}
            >
              {/* Responsive card size */}
              <div className="block md:hidden">
                <CardComponent
                  card={card}
                  isSelected={isCardSelected(card)}
                  isPlayable={isCurrentTurn && !disabled}
                  onClick={() => !disabled && onCardSelect(card)}
                  size="sm"
                />
              </div>
              <div className="hidden md:block">
                <CardComponent
                  card={card}
                  isSelected={isCardSelected(card)}
                  isPlayable={isCurrentTurn && !disabled}
                  onClick={() => !disabled && onCardSelect(card)}
                  size="md"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Card count - smaller on mobile */}
      <div className="text-center mt-1 text-gray-400 text-xs md:text-sm">
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
  finishOrder: number | null; // 1 = King, 2 = Noble, 3 = Commoner, 4 = Slave
  position: "top" | "left" | "right";
}

// Get rank display based on finish order
function getRankDisplay(finishOrder: number): {
  name: string;
  emoji: string;
  color: string;
} {
  switch (finishOrder) {
    case 1:
      return { name: "King", emoji: "👑", color: "text-yellow-400" };
    case 2:
      return { name: "Noble", emoji: "🎖️", color: "text-purple-400" };
    case 3:
      return { name: "Commoner", emoji: "👤", color: "text-blue-400" };
    case 4:
      return { name: "Slave", emoji: "⛓️", color: "text-gray-400" };
    default:
      return { name: "ออกแล้ว", emoji: "✓", color: "text-green-400" };
  }
}

export function OpponentHand({
  cardCount,
  playerName,
  avatar,
  isCurrentTurn,
  hasPassed,
  finishOrder,
  position,
}: OpponentHandProps) {
  // Layout based on position - more compact on mobile
  const containerClass = cn(
    "flex items-center gap-1 md:gap-2",
    position === "top" && "flex-col",
    position === "left" && "flex-row",
    position === "right" && "flex-row-reverse"
  );

  const cardsContainerClass = cn(
    "flex",
    position === "top" && "flex-row justify-center",
    (position === "left" || position === "right") && "flex-col"
  );

  // Show fewer card backs on mobile
  const displayCount = Math.min(cardCount, 3);

  return (
    <div className={containerClass}>
      {/* Player info - compact on mobile */}
      <div
        className={cn(
          "flex flex-col items-center gap-0.5 p-1 md:p-2 rounded-lg",
          isCurrentTurn && "bg-yellow-500/20 ring-1 md:ring-2 ring-yellow-500"
        )}
      >
        <div className="text-xl md:text-2xl">{avatar}</div>
        <div className="text-white text-[10px] md:text-xs font-medium text-center truncate max-w-14 md:max-w-20">
          {playerName}
        </div>
        {hasPassed && cardCount > 0 && (
          <div className="text-red-400 text-[10px] font-medium">ผ่าน</div>
        )}
        {cardCount === 0 && finishOrder && (
          <div
            className={cn(
              "text-[10px] font-bold flex items-center gap-0.5",
              getRankDisplay(finishOrder).color
            )}
          >
            <span>{getRankDisplay(finishOrder).emoji}</span>
          </div>
        )}
      </div>

      {/* Cards - smaller on mobile */}
      {cardCount > 0 && (
        <div className={cardsContainerClass}>
          {Array.from({ length: displayCount }).map((_, i) => (
            <div
              key={i}
              className={cn(
                position === "top" && "-ml-4 md:-ml-6 first:ml-0",
                (position === "left" || position === "right") &&
                  "-mt-6 md:-mt-8 first:mt-0"
              )}
              style={{ zIndex: i }}
            >
              <div
                className={cn(
                  "w-5 h-7 md:w-7 md:h-10 rounded bg-linear-to-br from-red-700 to-red-900 border border-red-800",
                  "flex items-center justify-center shadow",
                  position === "left" && "rotate-90",
                  position === "right" && "-rotate-90"
                )}
              >
                <span className="text-red-400 text-[8px] md:text-xs">♠</span>
              </div>
            </div>
          ))}
          {/* Card count badge */}
          <div
            className={cn(
              "bg-gray-800 text-white text-[10px] md:text-xs font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded-full",
              position === "top" && "-ml-1",
              (position === "left" || position === "right") && "-mt-1"
            )}
          >
            {cardCount}
          </div>
        </div>
      )}
    </div>
  );
}
