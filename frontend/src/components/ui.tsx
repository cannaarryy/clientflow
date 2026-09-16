import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { ClientStatus, Priority, ProjectStatus, TaskStatus } from "../types/index.js";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to={compact ? "/app" : "/"} className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-black ring-1 ring-[#2a2a2a]">
        <svg width="18" height="18" viewBox="0 0 32 32" fill="none" aria-hidden>
          <path d="M7 22.5c3 2.4 7.2 3.4 11 2.8M7 17c3.6 2.6 8.2 3.6 12.6 2.8M7 11.5c4 2.8 9.2 3.8 14 2.8" stroke="#7C6CFF" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      </span>
      <span className="text-[13px] font-bold tracking-[0.18em] text-white">CLIENTFLOW</span>
    </Link>
  );
}

const pill: Record<string, string> = {
  ACTIVE: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20",
  INACTIVE: "bg-[#222]/60 text-[#A1A1A1] ring-[#333]",
  LEAD: "bg-amber-400/10 text-amber-300 ring-amber-400/20",
  PLANNING: "bg-sky-400/10 text-sky-300 ring-sky-400/20",
  ON_HOLD: "bg-amber-400/10 text-amber-300 ring-amber-400/20",
  COMPLETED: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20",
  TODO: "bg-[#222]/60 text-[#A1A1A1] ring-[#333]",
  IN_PROGRESS: "bg-[#7C6CFF]/10 text-[#B9B0FF] ring-[#7C6CFF]/30",
  DONE: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20",
  LOW: "bg-[#222]/60 text-[#A1A1A1] ring-[#333]",
  MEDIUM: "bg-amber-400/10 text-amber-300 ring-amber-400/20",
  HIGH: "bg-red-400/10 text-red-300 ring-red-400/20",
};

export function StatusBadge({ value }: { value: ClientStatus | ProjectStatus | TaskStatus | Priority }) {
  const label = value.replace("_", " ");
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ring-1 ${pill[value] ?? pill.TODO}`}>
      {label}
    </span>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-[#A1A1A1]">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

export function EmptyState({ title, hint, action, icon }: { title: string; hint?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-[#181818] ring-1 ring-[#2a2a2a] text-[#737373]">
        {icon ?? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        )}
      </div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      {hint && <p className="mt-1 max-w-sm text-sm text-[#A1A1A1]">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6" onMouseDown={onClose}>
      <div
        className={`anim-modal w-full rounded-t-2xl border border-[#262626] bg-[#0D0D0D] p-5 sm:rounded-2xl sm:p-6 ${wide ? "sm:max-w-2xl" : "sm:max-w-lg"}`}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-[#A1A1A1] hover:bg-[#181818] hover:text-white" aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card p-5">
      <div className="skeleton h-4 w-2/3" />
      <div className="skeleton mt-3 h-3 w-1/3" />
      <div className="skeleton mt-4 h-8 w-full" />
    </div>
  );
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="card flex items-center gap-4 p-4">
          <div className="skeleton h-10 w-10 !rounded-full" />
          <div className="flex-1">
            <div className="skeleton h-4 w-1/3" />
            <div className="skeleton mt-2 h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
