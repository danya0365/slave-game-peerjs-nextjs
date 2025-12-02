"use client";

import { cn } from "@/src/lib/utils";
import { Inbox, Search, Users } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

type EmptyType = "default" | "search" | "players";

interface EmptyStateProps {
  type?: EmptyType;
  icon?: ReactNode;
  title?: string;
  message?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

const emptyConfig: Record<
  EmptyType,
  { icon: typeof Inbox; defaultTitle: string; defaultMessage: string }
> = {
  default: {
    icon: Inbox,
    defaultTitle: "ไม่มีข้อมูล",
    defaultMessage: "ยังไม่มีข้อมูลที่จะแสดง",
  },
  search: {
    icon: Search,
    defaultTitle: "ไม่พบผลลัพธ์",
    defaultMessage: "ลองค้นหาด้วยคำอื่น",
  },
  players: {
    icon: Users,
    defaultTitle: "รอผู้เล่น",
    defaultMessage: "กำลังรอผู้เล่นคนอื่นเข้าร่วม",
  },
};

/**
 * Empty State Component
 */
export function EmptyState({
  type = "default",
  icon,
  title,
  message,
  action,
  className,
}: EmptyStateProps) {
  const config = emptyConfig[type];
  const IconComponent = config.icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center",
        className
      )}
    >
      <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
        {icon || <IconComponent className="w-8 h-8 text-gray-500" />}
      </div>

      <h3 className="text-lg font-semibold text-white mb-2">
        {title || config.defaultTitle}
      </h3>

      <p className="text-gray-400 mb-6 max-w-md">
        {message || config.defaultMessage}
      </p>

      {action &&
        (action.href ? (
          <Link
            href={action.href}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
          >
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
          >
            {action.label}
          </button>
        ))}
    </div>
  );
}
