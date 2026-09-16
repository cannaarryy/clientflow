import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

interface Toast {
  id: number;
  kind: "success" | "error" | "info";
  message: string;
}

const ToastContext = createContext<{ push: (message: string, kind?: Toast["kind"]) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(1);

  const push = useCallback((message: string, kind: Toast["kind"] = "info") => {
    const id = idRef.current++;
    setToasts((t) => [...t, { id, kind, message }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[calc(100vw-2.5rem)] max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`anim-toast pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-2xl ${
              t.kind === "error"
                ? "border-red-900/60 bg-[#160808] text-red-200"
                : t.kind === "success"
                  ? "border-[#222] bg-[#0D0D0D] text-white"
                  : "border-[#222] bg-[#0D0D0D] text-[#F5F5F5]"
            }`}
          >
            <span
              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                t.kind === "error" ? "bg-red-500" : t.kind === "success" ? "bg-emerald-400" : "bg-[#7C6CFF]"
              }`}
            />
            <span className="leading-snug">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function errorMessage(err: unknown, fallback = "Something went wrong"): string {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
