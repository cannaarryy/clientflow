import { useEffect, useState } from "react";
import { api } from "../services/api.js";
import type { AutomationRule } from "../types/index.js";
import { useI18n } from "../i18n/LanguageProvider.js";
import { useToast, errorMessage } from "../hooks/Toast.js";
import { PageHeader, EmptyState, Modal, Field, SkeletonList } from "../components/ui.js";

interface Meta {
  triggers: Array<{ id: string; label: string }>;
  actions: Array<{ id: string; label: string }>;
}

export function AutomationsPage() {
  const { t, timeAgo } = useI18n();
  const { push } = useToast();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: "", trigger: "project.completed", action: "create_task", text: "" });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [r, m] = await Promise.all([
        api.get<{ rules: AutomationRule[] }>("/api/automations"),
        meta ? null : api.get<Meta>("/api/automations/meta"),
      ]);
      setRules(r.rules);
      if (m) setMeta(m);
    } catch (e) {
      push(errorMessage(e, t("auto.loadError")), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setBusy(true);
    try {
      const config = form.action === "create_task" ? { title: form.text || undefined } : { message: form.text || undefined };
      await api.post("/api/automations", { name: form.name.trim(), trigger: form.trigger, action: form.action, config });
      push(t("auto.created"), "success");
      setModal(false);
      setForm({ name: "", trigger: "project.completed", action: "create_task", text: "" });
      void load();
    } catch (err) {
      push(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (r: AutomationRule) => {
    try {
      await api.patch(`/api/automations/${r.id}`, { enabled: !r.enabled });
      setRules((l) => l.map((x) => (x.id === r.id ? { ...x, enabled: !x.enabled } : x)));
      push(t("auto.updated"), "success");
    } catch (e) {
      push(errorMessage(e), "error");
    }
  };

  const remove = async (r: AutomationRule) => {
    if (!window.confirm(t("common.confirmDelete"))) return;
    try {
      await api.del(`/api/automations/${r.id}`);
      setRules((l) => l.filter((x) => x.id !== r.id));
      push(t("auto.deleted"), "success");
    } catch (e) {
      push(errorMessage(e), "error");
    }
  };

  const runOverdue = async () => {
    try {
      const d = await api.post<{ checked: number }>("/api/automations/run-overdue", {});
      push(t("auto.ranOverdue", { n: d.checked }), "success");
    } catch (e) {
      push(errorMessage(e), "error");
    }
  };

  return (
    <div className="anim-fade-up">
      <PageHeader
        title={t("auto.title")}
        subtitle={t("auto.sub")}
        action={<><button onClick={() => void runOverdue()} className="btn-ghost">{t("common.runNow")}</button><button onClick={() => setModal(true)} className="btn-primary">{t("auto.new")}</button></>}
      />

      {loading ? <SkeletonList /> : rules.length === 0 ? (
        <EmptyState title={t("auto.empty")} hint={t("auto.emptyHint")} action={<button onClick={() => setModal(true)} className="btn-primary">{t("auto.new")}</button>} />
      ) : (
        <ul className="space-y-2">
          {rules.map((r) => (
            <li key={r.id} className="card flex flex-wrap items-center gap-3 p-3.5">
              <button
                onClick={() => void toggle(r)}
                role="switch"
                aria-checked={r.enabled}
                className={`relative h-5.5 w-10 shrink-0 rounded-full p-0.5 transition ${r.enabled ? "bg-[#7C6CFF]" : "bg-[#2a2a2a]"}`}
                style={{ height: 22 }}
              >
                <span className={`block h-[18px] w-[18px] rounded-full bg-white transition-all ${r.enabled ? "translate-x-[18px]" : ""}`} />
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{r.name}</p>
                <p className="truncate font-mono text-[11px] text-[#737373]">
                  {t("auto.when")} {t(`auto.trigger_${r.trigger}`, {}) || r.trigger} {t("auto.then")} {t(`auto.action_${r.action}`, {}) || r.action}
                </p>
                <p className="text-[11px] text-[#555]">{r.lastRunAt ? t("auto.lastRun", { date: timeAgo(r.lastRunAt) }) : t("auto.neverRun")}</p>
              </div>
              <button onClick={() => void remove(r)} className="rounded-lg px-2.5 py-1.5 text-xs text-[#555] hover:bg-red-950/40 hover:text-red-300">✕</button>
            </li>
          ))}
        </ul>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={t("auto.new")}>
        <form onSubmit={save} className="space-y-3.5">
          <Field label={t("auto.name")}><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t("auto.namePh")} required /></Field>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label={t("auto.when")}>
              <select className="input" value={form.trigger} onChange={(e) => setForm({ ...form, trigger: e.target.value })}>
                {(meta?.triggers ?? []).map((x) => <option key={x.id} value={x.id}>{t(`auto.trigger_${x.id}`, {}) || x.label}</option>)}
              </select>
            </Field>
            <Field label={t("auto.then")}>
              <select className="input" value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })}>
                {(meta?.actions ?? []).map((x) => <option key={x.id} value={x.id}>{t(`auto.action_${x.id}`, {}) || x.label}</option>)}
              </select>
            </Field>
          </div>
          <Field label={form.action === "create_task" ? t("auto.taskTitle") : t("auto.message")}>
            <input className="input" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} placeholder={form.action === "create_task" ? t("auto.taskTitlePh") : "…"} />
          </Field>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModal(false)} className="btn-ghost">{t("common.cancel")}</button>
            <button className="btn-primary" disabled={busy}>{busy ? t("common.saving") : t("common.create")}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
