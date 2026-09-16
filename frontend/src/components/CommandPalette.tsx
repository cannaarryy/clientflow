import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import type { Client, Project, Task } from "../types/index.js";

interface Results {
  clients: Client[];
  projects: Project[];
  tasks: Task[];
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Results>({ clients: [], projects: [], tasks: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setQ("");
      setResults({ clients: [], projects: [], tasks: [] });
      window.setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open ]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) onClose();
        else document.dispatchEvent(new CustomEvent("clientflow:palette"));
      }
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || q.trim().length < 2) {
      setResults({ clients: [], projects: [], tasks: [] });
      return;
    }
    setLoading(true);
    const t = window.setTimeout(async () => {
      try {
        const data = await api.get<Results>(`/api/search?q=${encodeURIComponent(q.trim())}`);
        setResults(data);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => window.clearTimeout(t);
  }, [q, open]);

  useEffect(() => {
    const opener = () => {
      const btn = document.querySelector("[data-palette]") as HTMLElement | null;
      btn?.click();
    };
    document.addEventListener("clientflow:palette", opener);
    return () => document.removeEventListener("clientflow:palette", opener);
  }, []);

  if (!open) return null;
  const empty = results.clients.length + results.projects.length + results.tasks.length === 0;

  const go = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center bg-black/70 p-4 pt-[12vh] backdrop-blur-sm" onMouseDown={onClose}>
      <div className="anim-modal w-full max-w-xl overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#0D0D0D] shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-[#1e1e1e] px-4 py-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#737373" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search clients, projects, tasks…"
            className="w-full bg-transparent text-sm text-white placeholder:text-[#555] outline-none"
          />
          <kbd className="rounded border border-[#2c2c2c] bg-[#181818] px-1.5 py-0.5 font-mono text-[10px] text-[#737373]">ESC</kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {loading && <p className="px-3 py-4 text-sm text-[#737373]">Searching…</p>}
          {!loading && q.trim().length >= 2 && empty && <p className="px-3 py-4 text-sm text-[#737373]">No results for “{q.trim()}”.</p>}
          {!loading && q.trim().length < 2 && <p className="px-3 py-4 text-sm text-[#737373]">Type at least 2 characters to search.</p>}
          {results.clients.length > 0 && (
            <Section title="Clients">
              {results.clients.map((c) => (
                <Row key={c.id} title={c.name} sub={c.company ?? c.email ?? ""} onClick={() => go(`/app/clients/${c.id}`)} />
              ))}
            </Section>
          )}
          {results.projects.length > 0 && (
            <Section title="Projects">
              {results.projects.map((p) => (
                <Row key={p.id} title={p.name} sub={p.client?.name ?? ""} onClick={() => go(`/app/projects/${p.id}`)} />
              ))}
            </Section>
          )}
          {results.tasks.length > 0 && (
            <Section title="Tasks">
              {results.tasks.map((t) => (
                <Row key={t.id} title={t.title} sub={t.project?.name ?? ""} onClick={() => go("/app/tasks")} />
              ))}
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-[#555]">{title}</p>
      {children}
    </div>
  );
}

function Row({ title, sub, onClick }: { title: string; sub?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-[#181818]">
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-white">{title}</span>
        {sub && <span className="block truncate text-xs text-[#737373]">{sub}</span>}
      </span>
      <span className="text-[#444]">→</span>
    </button>
  );
}
