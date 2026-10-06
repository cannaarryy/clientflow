export function appLocale(): string {
  try {
    return localStorage.getItem("clientflow.lang") === "en" ? "en-US" : "es-ES";
  } catch {
    return "es-ES";
  }
}

export function isSpanish(): boolean {
  return appLocale().startsWith("es");
}

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(appLocale(), { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(appLocale(), { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function timeAgo(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value).getTime();
  if (Number.isNaN(d)) return "";
  const es = isSpanish();
  const diff = Date.now() - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return es ? "ahora mismo" : "just now";
  if (mins < 60) return es ? `hace ${mins} min` : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return es ? `hace ${hours} h` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return es ? `hace ${days} d` : `${days}d ago`;
  return formatDate(value);
}

export function greeting(name?: string): string {
  const h = new Date().getHours();
  const es = isSpanish();
  const part = h < 12 ? (es ? "Buenos días" : "Good morning") : h < 19 ? (es ? "Buenas tardes" : "Good afternoon") : (es ? "Buenas noches" : "Good evening");
  const first = (name ?? "").trim().split(" ")[0];
  return first ? `${part}, ${first}` : part;
}

export function toInputDate(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
