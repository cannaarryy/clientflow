import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { ClientRequest, PortalData } from "../types/index.js";
import { useI18n, LanguageProvider, LangSwitcher } from "../i18n/LanguageProvider.js";
import { Logo, HealthBadge, StatusBadge, EmptyState, ProgressBar } from "../components/ui.js";
import { timeAgo as timeAgoFmt, formatDate } from "../utils/format.js";

function PortalInner() {
  const { token } = useParams<{ token: string }>();
  const { t, lang } = useI18n();
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reqForm, setReqForm] = useState({ title: "", description: "", projectId: "" });
  const [reqBusy, setReqBusy] = useState(false);
  const [reqSent, setReqSent] = useState(false);
  const [comment, setComment] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/portal/${token}`);
      if (!res.ok) throw new Error("not-found");
      const json = await res.json();
      setData(json.data as PortalData);
      setError("");
    } catch {
      setError(t("cp.notFound"));
    } finally {
      setLoading(false);
    }
  }, [token, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const sendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !reqForm.title.trim()) return;
    setReqBusy(true);
    try {
      const res = await fetch(`/api/portal/${token}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: reqForm.title.trim(), description: reqForm.description.trim() || undefined, projectId: reqForm.projectId || undefined }),
      });
      if (!res.ok) throw new Error("failed");
      setReqForm({ title: "", description: "", projectId: "" });
      setReqSent(true);
      window.setTimeout(() => setReqSent(false), 4000);
      void load();
    } catch {
      setError(t("common.error"));
    } finally {
      setReqBusy(false);
    }
  };

  const sendComment = async (e: React.FormEvent, requestId?: string, projectId?: string) => {
    e.preventDefault();
    if (!token || !comment.trim()) return;
    setCommentBusy(true);
    try {
      const res = await fetch(`/api/portal/${token}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: comment.trim(), requestId, projectId }),
      });
      if (!res.ok) throw new Error("failed");
      setComment("");
      void load();
    } finally {
      setCommentBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505]">
      <header className="border-b border-[#141414]">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4 sm:px-6">
          <Logo />
          <span className="rounded-full bg-[#7C6CFF]/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-[#B9B0FF] ring-1 ring-[#7C6CFF]/30">CLIENT PORTAL</span>
          <div className="ml-auto"><LangSwitcher /></div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {loading ? (
          <div className="space-y-3"><div className="skeleton h-8 w-64" /><div className="skeleton h-40" /><div className="skeleton h-40" /></div>
        ) : error || !data ? (
          <EmptyState title={t("cp.notFound")} action={<Link to="/" className="btn-ghost">{t("nf.back")}</Link>} />
        ) : (
          <div className="anim-fade-up">
            <h1 className="text-xl font-bold text-white sm:text-2xl">{t("cp.welcome", { name: data.client.name.split(" ")[0] })}</h1>
            <p className="mt-0.5 text-sm text-[#A1A1A1]">{t("cp.sub", { pro: data.professional.name })}</p>

            {/* Projects */}
            <section className="mt-5">
              <h2 className="mb-2.5 text-sm font-semibold text-white">{t("cp.projects")}</h2>
              {data.projects.length === 0 ? (
                <p className="card p-5 text-center text-sm text-[#737373]">{t("cp.noProjects")}</p>
              ) : (
                <div className="grid gap-2.5 md:grid-cols-2">
                  {data.projects.map((p) => (
                    <article key={p.id} className="card p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-white">{p.name}</h3>
                        <HealthBadge value={p.health.health} />
                      </div>
                      {p.description && <p className="mt-1 line-clamp-2 text-[13px] text-[#A1A1A1]">{p.description}</p>}
                      <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#737373]">
                        <span>{t("cp.progress", { n: p.health.progress })}</span>
                        {p.dueDate && <span>{t("common.dueOn", { date: formatDate(p.dueDate) })}</span>}
                      </div>
                      <div className="mt-1"><ProgressBar value={p.health.progress} /></div>
                      {p.tasks?.length ? (
                        <ul className="mt-2.5 space-y-1.5">
                          {p.tasks.map((task) => (
                            <li key={task.id} className="flex items-center gap-2 rounded-lg bg-[#111] px-2.5 py-1.5 text-[13px]">
                              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${task.status === "DONE" ? "bg-emerald-400" : task.status === "IN_PROGRESS" ? "bg-[#7C6CFF]" : "bg-[#444]"}`} />
                              <span className={`min-w-0 flex-1 truncate ${task.status === "DONE" ? "text-[#555] line-through" : "text-[#F5F5F5]"}`}>{task.title}</span>
                              <StatusBadge value={task.status} />
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      <PortalCommentBox
                        placeholder={t("cp.commentPh")}
                        busy={commentBusy}
                        value={comment}
                        setValue={setComment}
                        onSend={(e) => void sendComment(e, undefined, p.id)}
                        sendLabel={t("common.send")}
                      />
                    </article>
                  ))}
                </div>
              )}
            </section>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {/* Requests */}
              <section className="card p-4">
                <h2 className="mb-2.5 text-sm font-semibold text-white">{t("cp.requests")}</h2>
                <form onSubmit={sendRequest} className="space-y-2 rounded-xl bg-[#111] p-3">
                  <input className="input !py-2 text-[13px]" value={reqForm.title} onChange={(e) => setReqForm({ ...reqForm, title: e.target.value })} placeholder={t("cp.whatNeedPh")} required />
                  <textarea className="input min-h-[56px] resize-y !py-2 text-[13px]" value={reqForm.description} onChange={(e) => setReqForm({ ...reqForm, description: e.target.value })} placeholder={t("cp.details")} />
                  {data.projects.length > 0 && (
                    <select className="input !py-2 text-[13px]" value={reqForm.projectId} onChange={(e) => setReqForm({ ...reqForm, projectId: e.target.value })}>
                      <option value="">—</option>
                      {data.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  )}
                  <button className="btn-primary w-full !py-2 !text-[13px]" disabled={reqBusy}>{reqBusy ? t("common.sending") : t("cp.newRequest")}</button>
                  {reqSent && <p className="text-center text-xs text-emerald-300">{t("cp.requestSent")}</p>}
                </form>
                <ul className="mt-2.5 space-y-1.5">
                  {data.requests.map((r: ClientRequest) => (
                    <li key={r.id} className="rounded-lg bg-[#111] p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[13px] text-white">{r.title}</p>
                        <StatusBadge value={r.status} />
                      </div>
                      <p className="mt-0.5 text-[11px] text-[#555]">{timeAgoFmt(r.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Shared notes */}
              <section className="card p-4">
                <h2 className="mb-2.5 text-sm font-semibold text-white">{t("cp.updates")}</h2>
                {data.notes.length === 0 && data.activity.length === 0 ? (
                  <p className="py-3 text-center text-[13px] text-[#555]">—</p>
                ) : (
                  <div className="space-y-2">
                    {data.notes.slice(0, 4).map((n) => (
                      <div key={n.id} className="rounded-lg bg-[#111] p-2.5">
                        {n.title && <p className="text-[13px] font-medium text-white">{n.title}</p>}
                        <p className="whitespace-pre-wrap text-[13px] text-[#A1A1A1]">{n.content}</p>
                      </div>
                    ))}
                    {data.activity.slice(0, 5).map((a) => (
                      <p key={a.id} className="flex gap-2 text-[13px] text-[#737373]">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#7C6CFF]" />
                        <span className="min-w-0">{a.message} <span className="text-[11px] text-[#555]">· {timeAgoFmt(a.createdAt)}</span></span>
                      </p>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <p className="mt-8 text-center font-mono text-[11px] text-[#555]">{t("cp.powered")} · {lang.toUpperCase()}</p>
          </div>
        )}
      </main>
    </div>
  );
}

function PortalCommentBox({ placeholder, busy, value, setValue, onSend, sendLabel }: { placeholder: string; busy: boolean; value: string; setValue: (v: string) => void; onSend: (e: React.FormEvent) => void; sendLabel: string }) {
  const [open, setOpen] = useState(false);
  if (!open) return <button onClick={() => setOpen(true)} className="mt-2.5 text-xs text-[#737373] hover:text-white">{placeholder}</button>;
  return (
    <form onSubmit={onSend} className="mt-2.5 flex gap-1.5">
      <input className="input !py-1.5 text-[13px]" value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} />
      <button className="btn-ghost shrink-0 !px-3 !py-1.5 !text-xs" disabled={busy || !value.trim()}>{sendLabel}</button>
    </form>
  );
}

export function PortalPage() {
  return (
    <LanguageProvider>
      <PortalInner />
    </LanguageProvider>
  );
}
