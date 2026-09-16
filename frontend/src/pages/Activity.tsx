import { useEffect, useState } from "react";
import { api } from "../services/api.js";
import type { Activity } from "../types/index.js";
import { useToast, errorMessage } from "../hooks/Toast.js";
import { PageHeader, EmptyState, SkeletonList } from "../components/ui.js";
import { timeAgo, formatDateTime } from "../utils/format.js";

const ICONS: Record<string, string> = {
  "client.created": "＋",
  "client.updated": "✎",
  "project.created": "▣",
  "project.updated": "✎",
  "task.created": "☐",
  "task.completed": "☑",
  "note.added": "✎",
  "user.registered": "●",
};

export function ActivityPage() {
  const { push } = useToast();
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ activities: Activity[] }>("/api/activities?limit=100")
      .then((d) => setItems(d.activities))
      .catch((e) => push(errorMessage(e, "Could not load activity"), "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Group by day
  const groups = new Map<string, Activity[]>();
  for (const a of items) {
    const day = new Date(a.createdAt).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day)!.push(a);
  }

  return (
    <div className="anim-fade-up">
      <PageHeader title="Activity" subtitle="Everything happening across your workspace" />
      {loading ? <SkeletonList /> : items.length === 0 ? (
        <EmptyState title="No activity yet" hint="Create a client, project or task and it will show up here." />
      ) : (
        <div className="space-y-6">
          {[...groups.entries()].map(([day, acts]) => (
            <section key={day}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#555]">{day}</p>
              <div className="card divide-y divide-[#1a1a1a]">
                {acts.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 px-4 py-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#181818] text-xs text-[#A1A1A1] ring-1 ring-[#262626]">
                      {ICONS[a.type] ?? "·"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[#F5F5F5]">{a.message}</p>
                      <p className="text-[11px] text-[#555]" title={formatDateTime(a.createdAt)}>{timeAgo(a.createdAt)} · {a.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
