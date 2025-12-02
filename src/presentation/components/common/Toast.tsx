"use client";

import { cn } from "@/src/lib/utils";
import { AlertTriangle, CheckCircle, Info, X, XCircle } from "lucide-react";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toastConfig: Record<
  ToastType,
  { icon: typeof Info; bgColor: string; iconColor: string }
> = {
  success: {
    icon: CheckCircle,
    bgColor: "bg-green-900/90 border-green-700",
    iconColor: "text-green-400",
  },
  error: {
    icon: XCircle,
    bgColor: "bg-red-900/90 border-red-700",
    iconColor: "text-red-400",
  },
  warning: {
    icon: AlertTriangle,
    bgColor: "bg-yellow-900/90 border-yellow-700",
    iconColor: "text-yellow-400",
  },
  info: {
    icon: Info,
    bgColor: "bg-blue-900/90 border-blue-700",
    iconColor: "text-blue-400",
  },
};

/**
 * Toast Provider
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (type: ToastType, message: string, duration = 3000) => {
      const id = `${Date.now()}-${Math.random()}`;
      const toast: Toast = { id, type, message, duration };

      setToasts((prev) => [...prev, toast]);

      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
      }
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

/**
 * Toast Container
 */
function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => {
        const config = toastConfig[toast.type];
        const Icon = config.icon;

        return (
          <div
            key={toast.id}
            className={cn(
              "flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm animate-in slide-in-from-right",
              config.bgColor
            )}
          >
            <Icon className={cn("w-5 h-5 shrink-0 mt-0.5", config.iconColor)} />
            <p className="text-white text-sm flex-1">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Hook to use toasts
 */
export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return {
    toast: context.addToast,
    success: (message: string, duration?: number) =>
      context.addToast("success", message, duration),
    error: (message: string, duration?: number) =>
      context.addToast("error", message, duration),
    warning: (message: string, duration?: number) =>
      context.addToast("warning", message, duration),
    info: (message: string, duration?: number) =>
      context.addToast("info", message, duration),
  };
}
