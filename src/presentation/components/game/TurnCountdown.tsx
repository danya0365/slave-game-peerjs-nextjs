"use client";

import { cn } from "@/src/lib/utils";
import { Timer } from "lucide-react";
import { useEffect, useState } from "react";

interface TurnCountdownProps {
  deadline: number | null;
  isCurrentTurn: boolean;
  className?: string;
}

/**
 * Countdown timer component that shows remaining time for current turn
 */
export function TurnCountdown({
  deadline,
  isCurrentTurn,
  className,
}: TurnCountdownProps) {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!deadline || !isCurrentTurn) {
      setRemainingSeconds(null);
      return;
    }

    const updateRemaining = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((deadline - now) / 1000));
      setRemainingSeconds(remaining);
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 100);

    return () => clearInterval(interval);
  }, [deadline, isCurrentTurn]);

  if (remainingSeconds === null || !isCurrentTurn) {
    return null;
  }

  const isUrgent = remainingSeconds <= 10;
  const isCritical = remainingSeconds <= 5;

  return (
    <div
      className={cn(
        "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold",
        "transition-all duration-300",
        isCritical
          ? "bg-red-500/30 text-red-400 animate-pulse"
          : isUrgent
          ? "bg-orange-500/30 text-orange-400"
          : "bg-blue-500/30 text-blue-400",
        className
      )}
    >
      <Timer className="w-3 h-3" />
      <span>{remainingSeconds}s</span>
    </div>
  );
}
