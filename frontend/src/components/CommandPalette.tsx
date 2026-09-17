import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import type { Client, ClientRequest, Note, Project, Task } from "../types/index.js";
import { useI18n } from "../i18n/LanguageProvider.js";
import { useAuth } from "../hooks/AuthContext.js";

interface Results {
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  notes: Note[];
  requests: ClientRequest[];
}

const EMPTY: Results = { clients: [], projects: [], tasks: [], notes: [], requests: [] };

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Results>(EMPTY);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { t, setLang, lang } = useI18n();
  const { logout } = useAuth();

  useEffect(() => {
    if (open) {
      setQ("");
      setResults(EMPTY);
      window.setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open ]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent("clientflow:palette-toggle"));
      }
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || q.trim().length < 2) {
      setResults(EMPTY);
      return;
    }
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const data = await api.get<Results>(`/api/search?q=${encodeURIComponent(q.trim())}`);
        setResults({ ...EMPTY, ...data });
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => window.clearTimeout(timer);
  }, [q, open]);

  const go = (path: string) => {
    onClose();
    navigate(path);
  };

  const commands = useMemo(() => {
    const query = q.trim().toLowerCase();
    const all = [
      { id: "new-client", label: t("pal.cmdNewClient"), run: () => go("/app/clients?new=1") },
      { id: "new-project", label: t("pal.cmdNewProject"), run: () => go("/app/projects?new=1") },
      { id: "new-task", label: t("pal.cmdNewTask"), run: () => go("/app/tasks?new=1") },
      { id: "new-note", label: t("pal.cmdNewNote"), run: () => go("/app/notes?new=1") },
      { id: "new-request", label: t("pal.cmdNewRequest"), run: () => go("/app/requests?new=1") },
      { id: "go-dashboard", label: t("pal.cmdGoDashboard"), run: () => go("/app") },
      { id: "go-clients", label: t("pal.cmdGoClients"), run: () => go("/app/clients") },
      { id: "go-projects", label: t("pal.cmdGoProjects"), run: () => go("/app/projects") },
      { id: "go-tasks", label: t("pal.cmdGoTasks"), run: () => go("/app/tasks") },
      { id: "go-requests", label: t("pal.cmdGoRequests"), run: () => go("/app/requests") },
      { id: "go-automations", label: t("pal.cmdGoAutomations"), run: () => go("/app/automations") },
      { id: "go-settings", label: t("pal.cmdGoSettings"), run: () => go("/app/settings") },
      { id: "toggle-lang", label: t("pal.cmdToggleLang"), run: () => { setLang(lang === "es" ? "en" : "es"); onClose(); } },
      { id: "logout", label: t("app.logout"), run: () => { void logout().then(() => go("/login")); } },
    ];
    if (!query) return all;
    return all.filter((c) => c.label.toLowerCase().includes(query));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, t, lang]);

  if (!open) return null;
  const totalResults = results.clients.length + results.projects.length + results.tasks.length + results.notes.length + results.requests.length;
  const showResults = q.trim().length >= 2;

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center bg-black/70 p-4 pt-[10vh] backdrop-blur-sm" onMouseDown={onClose}>
      <div className="anim-modal max-h-[75vh] w-full max-w-xl overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#0D0D0D] shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-[#1e1e1e] px-4 py-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#737373" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("pal.placeholder2")}
            className="w-full bg-transparent text-sm text-white placeholder:text-[#555] outline-none"
          />
          <kbd className="rounded border border-[#2c2c2c] bg-[#181818] px-1.5 py-0.5 font-mono text-[10px] text-[#737373]">ESC</kbd>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {loading && <p className="px-3 py-3 text-sm text-[#737373]">{t("pal.searching")}</p>}
          {!loading && showResults && totalResults === 0 && commands.length === 0 && (
            <p className="px-3 py-3 text-sm text-[#737373]">{t("pal.noResults", { q: q.trim() })}</p>
          )}
          {!loading && !showResults && commands.length === 0 && (
            <p className="px-3 py-3 text-sm text-[#737373]">{t("pal.minChars")}</p>
          )}
          {results.clients.length > 0 && (
            <Section title={t("pal.sectionClients")}>
              {results.clients.map((c) => <Row key={c.id} title={c.name} sub={c.company ?? c.email ?? ""} onClick={() => go(`/app/clients/${c.id}`)} />)}
            </Section>
          )}
          {results.projects.length > 0 && (
            <Section title={t("pal.sectionProjects")}>
              {results.projects.map((p) => <Row key={p.id} title={p.name} sub={p.client?.name ?? ""} onClick={() => go(`/app/projects/${p.id}`)} />)}
            </Section>
          )}
          {results.tasks.length > 0 && (
            <Section title={t("pal.sectionTasks")}>
              {results.tasks.map((x) => <Row key={x.id} title={x.title} sub={x.project?.name ?? ""} onClick={() => go("/app/tasks")} />)}
            </Section>
          )}
          {results.notes.length > 0 && (
            <Section title={t("pal.sectionNotes")}>
              {results.notes.map((n) => <Row key={n.id} title={n.title || n.content.slice(0, 60)} sub={n.project?.name ?? n.client?.name ?? ""} onClick={() => go("/app/notes")} />)}
            </Section>
          )}
          {results.requests.length > 0 && (
            <Section title={t("pal.sectionRequests")}>
              {results.requests.map((r) => <Row key={r.id} title={r.title} sub={r.client?.name ?? ""} onClick={() => go("/app/requests")} />)}
            </Section>
          )}
          {commands.length > 0 && (
            <Section title={t("pal.sectionCommands")}>
              {commands.map((c) => (
                <button key={c.id} onClick={c.run} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-[#181818]">
                  <span className="grid h-5 w-5 place-items-center rounded bg-[#1c1c1c] font-mono text-[10px] text-[#7C6CFF]">⌘</span>
                  <span className="text-sm text-[#F5F5F5]">{c.label}</span>
                </button>
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
