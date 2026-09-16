import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import type { Client, ClientStatus } from "../types/index.js";
import { useToast, errorMessage } from "../hooks/Toast.js";
import { PageHeader, StatusBadge, EmptyState, Modal, Field, SkeletonList } from "../components/ui.js";
import { formatDate, initials } from "../utils/format.js";

const STATUSES: Array<ClientStatus | "ALL"> = ["ALL", "ACTIVE", "LEAD", "INACTIVE"];

export function ClientsPage() {
  const { push } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ClientStatus | "ALL">("ALL");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", notes: "", status: "ACTIVE" as ClientStatus });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (status !== "ALL") params.set("status", status);
      const data = await api.get<{ clients: Client[] }>(`/api/clients?${params.toString()}`);
      setClients(data.clients);
    } catch (e) {
      push(errorMessage(e, "Could not load clients"), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", company: "", email: "", phone: "", notes: "", status: "ACTIVE" });
    setModal(true);
  };

  const openEdit = (c: Client) => {
    setEditing(c);
    setForm({ name: c.name, company: c.company ?? "", email: c.email ?? "", phone: c.phone ?? "", notes: c.notes ?? "", status: c.status });
    setModal(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      push("Name is required", "error");
      return;
    }
    setBusy(true);
    try {
      if (editing) {
        await api.patch(`/api/clients/${editing.id}`, { ...form, name: form.name.trim() });
        push("Client updated", "success");
      } else {
        await api.post("/api/clients", { ...form, name: form.name.trim() });
        push("Client created", "success");
      }
      setModal(false);
      void load();
    } catch (err) {
      push(errorMessage(err, "Could not save client"), "error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (c: Client) => {
    if (!window.confirm(`Delete client "${c.name}"? This also deletes its projects, tasks and notes.`)) return;
    try {
      await api.del(`/api/clients/${c.id}`);
      push("Client deleted", "success");
      setClients((list) => list.filter((x) => x.id !== c.id));
    } catch (e) {
      push(errorMessage(e, "Could not delete client"), "error");
    }
  };

  const filtered = useMemo(() => clients, [clients]);

  return (
    <div className="anim-fade-up">
      <PageHeader
        title="Clients"
        subtitle={`${filtered.length} client${filtered.length === 1 ? "" : "s"}`}
        action={<button onClick={openCreate} className="btn-primary">+ New client</button>}
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input className="input sm:max-w-xs" placeholder="Search clients…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="flex gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition ${status === s ? "bg-white text-black" : "bg-[#111] text-[#A1A1A1] ring-1 ring-[#222] hover:text-white"}`}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <SkeletonList />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={search || status !== "ALL" ? "No clients match your filters" : "No clients yet"}
          hint={search || status !== "ALL" ? "Try a different search or filter." : "Add your first client to start organizing your work."}
          action={search || status !== "ALL" ? undefined : <button onClick={openCreate} className="btn-primary">+ Add your first client</button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <div key={c.id} className="card group p-4 transition hover:border-[#333]">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#181818] text-xs font-bold text-[#A1A1A1] ring-1 ring-[#2a2a2a]">
                  {initials(c.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <Link to={`/app/clients/${c.id}`} className="block truncate font-semibold text-white hover:underline">{c.name}</Link>
                  <p className="truncate text-xs text-[#737373]">{c.company ?? c.email ?? "—"}</p>
                </div>
                <StatusBadge value={c.status} />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-[#737373]">
                <span>{c._count ? `${c._count.projects} projects · ${c._count.tasks} tasks` : `Since ${formatDate(c.createdAt)}`}</span>
              </div>
              <div className="mt-3 flex gap-2 border-t border-[#1c1c1c] pt-3">
                <Link to={`/app/clients/${c.id}`} className="btn-ghost flex-1 !py-1.5 !text-xs">Open</Link>
                <button onClick={() => openEdit(c)} className="btn-ghost flex-1 !py-1.5 !text-xs">Edit</button>
                <button onClick={() => void remove(c)} className="rounded-lg px-3 py-1.5 text-xs text-[#737373] hover:bg-red-950/40 hover:text-red-300">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit client" : "New client"}>
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name *"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Sofia Bennett" required /></Field>
            <Field label="Company"><input className="input" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Nova Studio" /></Field>
            <Field label="Email"><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="sofia@studio.co" /></Field>
            <Field label="Phone"><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 415 555 0132" /></Field>
            <Field label="Status">
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ClientStatus })}>
                <option value="ACTIVE">Active</option>
                <option value="LEAD">Lead</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </Field>
            <div />
          </div>
          <Field label="Notes"><textarea className="input min-h-[90px] resize-y" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Context, preferences, agreements…" /></Field>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setModal(false)} className="btn-ghost">Cancel</button>
            <button className="btn-primary" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Create client"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
