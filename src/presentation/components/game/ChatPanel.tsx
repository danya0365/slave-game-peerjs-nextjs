"use client";

import { cn } from "@/src/lib/utils";
import { MessageCircle, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface ChatMessageData {
  id: string;
  senderId: string;
  playerName: string;
  message: string;
  timestamp: number;
  isSystem?: boolean;
}

interface ChatPanelProps {
  messages: ChatMessageData[];
  onSendMessage: (message: string) => void;
  currentPlayerName: string;
}

/**
 * Chat Toggle Button - shows unread count
 */
export function ChatToggleButton({
  isOpen,
  onClick,
  unreadCount,
}: {
  isOpen: boolean;
  onClick: () => void;
  unreadCount: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed bottom-4 right-4 z-50 p-3 rounded-full shadow-lg transition-all",
        "hover:scale-105 active:scale-95",
        isOpen
          ? "bg-gray-700 text-white"
          : "bg-red-500 hover:bg-red-600 text-white"
      )}
    >
      {isOpen ? (
        <X className="w-6 h-6" />
      ) : (
        <div className="relative">
          <MessageCircle className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
      )}
    </button>
  );
}

/**
 * Chat Panel - slideable chat window
 */
export function ChatPanel({
  messages,
  onSendMessage,
  currentPlayerName,
}: ChatPanelProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed bottom-20 right-4 z-40 w-80 max-h-96 bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-700 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-900/50 border-b border-gray-700">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-red-400" />
          แชทในห้อง
        </h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-64 scrollbar-hide">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center text-sm py-4">
            ยังไม่มีข้อความ
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "rounded-lg px-3 py-2",
                msg.isSystem
                  ? "bg-gray-700/50 text-center"
                  : msg.playerName === currentPlayerName
                  ? "bg-red-500/20 ml-4"
                  : "bg-gray-700/50 mr-4"
              )}
            >
              {msg.isSystem ? (
                <p className="text-gray-400 text-xs">{msg.message}</p>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span
                      className={cn(
                        "text-xs font-medium",
                        msg.playerName === currentPlayerName
                          ? "text-red-400"
                          : "text-blue-400"
                      )}
                    >
                      {msg.playerName}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <p className="text-white text-sm break-words">
                    {msg.message}
                  </p>
                </>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="พิมพ์ข้อความ..."
            className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-400"
            maxLength={200}
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="p-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * Chat Container - combines toggle button and panel
 */
export function ChatContainer({
  messages,
  onSendMessage,
  currentPlayerName,
}: ChatPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastReadRef = useRef(0);

  // Track unread messages when chat is closed
  useEffect(() => {
    if (!isOpen && messages.length > lastReadRef.current) {
      setUnreadCount(messages.length - lastReadRef.current);
    }
  }, [messages, isOpen]);

  // Reset unread when opening chat
  const handleToggle = () => {
    if (!isOpen) {
      setUnreadCount(0);
      lastReadRef.current = messages.length;
    }
    setIsOpen(!isOpen);
  };

  return (
    <>
      <ChatToggleButton
        isOpen={isOpen}
        onClick={handleToggle}
        unreadCount={unreadCount}
      />
      {isOpen && (
        <ChatPanel
          messages={messages}
          onSendMessage={onSendMessage}
          currentPlayerName={currentPlayerName}
        />
      )}
    </>
  );
}
