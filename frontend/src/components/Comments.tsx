import { useEffect, useState } from "react";
import { api } from "../services/api.js";
import type { Comment, Visibility } from "../types/index.js";
import { useI18n } from "../i18n/LanguageProvider.js";
import { useToast, errorMessage } from "../hooks/Toast.js";
import { VisibilityBadge } from "./ui.js";

export interface CommentScope {
  projectId?: string;
  taskId?: string;
  requestId?: string;
}

/** Reusable comment thread (projects, tasks, requests). Pro-side. */
export function Comments({ scope, allowShared = true, compact = false }: { scope: CommentScope; allowShared?: boolean; compact?: boolean }) {
  const { t, timeAgo } = useI18n();
  const { push } = useToast();
  const [items, setItems] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("INTERNAL");
  const [busy, setBusy] = useState(false);

  const key = scope.projectId ?? scope.taskId ?? scope.requestId ?? "";

  useEffect(() => {
    if (!key) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (scope.projectId) params.set("projectId", scope.projectId);
    if (scope.taskId) params.set("taskId", scope.taskId);
    if (scope.requestId) params.set("requestId", scope.requestId);
    api.get<{ comments: Comment[] }>(`/api/comments?${params.toString()}`)
      .then((d) => setItems(d.comments))
      .catch((e) => push(errorMessage(e), "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      const d = await api.post<{ comment: Comment }>("/api/comments", { content: text.trim(), ...scope, visibility: allowShared ? visibility : "INTERNAL" });
      setItems((l) => [...l, d.comment]);
      setText("");
      push(t("comments.added"), "success");
    } catch (err) {
      push(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await api.del(`/api/comments/${id}`);
      setItems((l) => l.filter((c) => c.id !== id));
    } catch (err) {
      push(errorMessage(err), "error");
    }
  };

  return (
    <div>
      {loading ? (
        <div className="space-y-2">{[0, 1].map((i) => <div key={i} className="skeleton h-14" />)}</div>
      ) : items.length === 0 ? (
        <p className={`text-center text-sm text-[#555] ${compact ? "py-2" : "py-4"}`}>{t("comments.empty")}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((c) => (
            <li key={c.id} className="rounded-lg bg-[#111] p-3">
              <div className="flex items-center gap-2">
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold ${c.authorRole === "CLIENT" ? "bg-sky-400/15 text-sky-300" : "bg-[#7C6CFF]/15 text-[#B9B0FF]"}`}>
                  {c.authorName.trim().charAt(0).toUpperCase()}
                </span>
                <span className="truncate text-xs font-medium text-white">{c.authorName}</span>
                <span className="rounded bg-[#1c1c1c] px-1.5 py-0.5 text-[10px] text-[#737373]">{t(`comments.role${c.authorRole}`)}</span>
                <VisibilityBadge value={c.visibility} />
                <span className="ml-auto shrink-0 text-[11px] text-[#555]">{timeAgo(c.createdAt)}</span>
                <button onClick={() => void remove(c.id)} className="shrink-0 text-[11px] text-[#555] hover:text-red-300" aria-label={t("common.delete")}>✕</button>
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-[#D4D4D4]">{c.content}</p>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={add} className="mt-2.5 flex flex-col gap-2">
        <textarea
          className="input min-h-[64px] resize-y"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("comments.placeholder")}
        />
        <div className="flex items-center justify-between gap-2">
          {allowShared ? (
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-[#737373]">
              <input type="checkbox" checked={visibility === "SHARED"} onChange={(e) => setVisibility(e.target.checked ? "SHARED" : "INTERNAL")} className="h-3.5 w-3.5 accent-[#7C6CFF]" />
              {t("vis.shareWithClient")}
            </label>
          ) : <span />}
          <button className="btn-ghost !py-1.5 !text-xs" disabled={busy || !text.trim()}>{busy ? t("common.sending") : t("comments.send")}</button>
        </div>
      </form>
    </div>
  );
}
