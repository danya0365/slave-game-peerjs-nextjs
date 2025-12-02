"use client";

import { cn } from "@/src/lib/utils";
import { ChevronDown, ChevronUp, History, User } from "lucide-react";
import { useState } from "react";

interface GameAction {
  id: string;
  playerId: string;
  playerName: string;
  playerAvatar: string;
  action: "play" | "pass" | "start" | "win_round";
  cards?: { suit: string; rank: string }[];
  timestamp: number;
}

interface GameStateHUDProps {
  currentPlayerName: string;
  currentPlayerAvatar: string;
  isMyTurn: boolean;
  actions: GameAction[];
  roundNumber: number;
  className?: string;
}

/**
 * Game State HUD - Shows current turn and collapsible history
 */
export function GameStateHUD({
  currentPlayerName,
  currentPlayerAvatar,
  isMyTurn,
  actions,
  roundNumber,
  className,
}: GameStateHUDProps) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Get suit emoji
  const getSuitEmoji = (suit: string) => {
    switch (suit) {
      case "spades":
        return "♠️";
      case "hearts":
        return "♥️";
      case "diamonds":
        return "♦️";
      case "clubs":
        return "♣️";
      default:
        return "";
    }
  };

  // Format cards for display
  const formatCards = (cards?: { suit: string; rank: string }[]) => {
    if (!cards || cards.length === 0) return "";
    return cards.map((c) => `${c.rank}${getSuitEmoji(c.suit)}`).join(" ");
  };

  // Get action text
  const getActionText = (action: GameAction) => {
    switch (action.action) {
      case "play":
        return `เล่น ${formatCards(action.cards)}`;
      case "pass":
        return "ผ่าน";
      case "start":
        return "เริ่มเกม";
      case "win_round":
        return "ชนะรอบ!";
      default:
        return "";
    }
  };

  return (
    <div className={cn("fixed top-20 left-4 z-40", className)}>
      {/* Current Turn Indicator */}
      <div
        className={cn(
          "rounded-xl p-3 mb-2 backdrop-blur-md shadow-lg transition-all",
          isMyTurn
            ? "bg-yellow-500/90 text-yellow-900 animate-pulse"
            : "bg-gray-900/80 text-white"
        )}
      >
        <div className="flex items-center gap-2">
          <User className="w-4 h-4" />
          <span className="text-sm font-medium">
            {isMyTurn ? "ตาคุณ!" : `ตาของ ${currentPlayerName}`}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-2xl">{currentPlayerAvatar}</span>
          <div>
            <div className="text-xs opacity-80">รอบที่ {roundNumber}</div>
          </div>
        </div>
      </div>

      {/* History Toggle Button */}
      <button
        onClick={() => setIsHistoryOpen(!isHistoryOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-900/80 backdrop-blur-md text-white hover:bg-gray-800/80 transition-colors w-full"
      >
        <History className="w-4 h-4" />
        <span className="text-sm">ประวัติ ({actions.length})</span>
        {isHistoryOpen ? (
          <ChevronUp className="w-4 h-4 ml-auto" />
        ) : (
          <ChevronDown className="w-4 h-4 ml-auto" />
        )}
      </button>

      {/* History Panel */}
      {isHistoryOpen && (
        <div className="mt-2 rounded-xl bg-gray-900/90 backdrop-blur-md p-3 max-h-60 overflow-y-auto shadow-lg">
          {actions.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-2">
              ยังไม่มีการเล่น
            </p>
          ) : (
            <div className="space-y-2">
              {actions
                .slice()
                .reverse()
                .slice(0, 10)
                .map((action, index) => (
                  <div
                    key={action.id}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg text-sm",
                      index === 0
                        ? "bg-gray-700/50"
                        : "bg-transparent opacity-70"
                    )}
                  >
                    <span className="text-lg">{action.playerAvatar}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white truncate">
                        {action.playerName}
                      </div>
                      <div
                        className={cn(
                          "text-xs",
                          action.action === "pass"
                            ? "text-gray-400"
                            : action.action === "win_round"
                            ? "text-yellow-400"
                            : "text-green-400"
                        )}
                      >
                        {getActionText(action)}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Current Turn Banner - Shows prominently whose turn it is
 */
export function CurrentTurnBanner({
  playerName,
  playerAvatar,
  isMyTurn,
}: {
  playerName: string;
  playerAvatar: string;
  isMyTurn: boolean;
}) {
  return (
    <div
      className={cn(
        "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50",
        "px-6 py-4 rounded-2xl shadow-2xl",
        "animate-bounce-in",
        isMyTurn
          ? "bg-yellow-500 text-yellow-900"
          : "bg-gray-800 text-white border border-gray-600"
      )}
    >
      <div className="flex items-center gap-3">
        <span className="text-4xl">{playerAvatar}</span>
        <div>
          <div className="text-lg font-bold">
            {isMyTurn ? "ตาคุณเล่น!" : `ตาของ ${playerName}`}
          </div>
          <div className="text-sm opacity-80">
            {isMyTurn ? "เลือกไพ่แล้วกดเล่น" : "รอ..."}
          </div>
        </div>
      </div>
    </div>
  );
}
