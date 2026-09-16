import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Logo } from "../components/ui.js";
import { useAuth } from "../hooks/AuthContext.js";
import { useToast } from "../hooks/Toast.js";
import { CommandPalette } from "../components/CommandPalette.js";
import { initials } from "../utils/format.js";

const NAV = [
  { to: "/app", end: true, label: "Dashboard", icon: "M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10" },
  { to: "/app/clients", label: "Clients", icon: "M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" },
  { to: "/app/projects", label: "Projects", icon: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" },
  { to: "/app/tasks", label: "Tasks", icon: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" },
  { to: "/app/notes", label: "Notes", icon: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" },
  { to: "/app/activity", label: "Activity", icon: "M22 12h-4l-3 9L9 3l-3 9H2" },
  { to: "/app/settings", label: "Settings", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const doLogout = async () => {
    await logout();
    navigate("/login");
  };

  const searchButton = (
    <button
      onClick={() => setPaletteOpen(true)}
      className="flex w-full items-center gap-2.5 rounded-lg border border-[#222] bg-[#111] px-3 py-2 text-sm text-[#737373] transition hover:border-[#333] hover:text-[#A1A1A1]"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
      <span className="flex-1 text-left">Search…</span>
      <kbd className="hidden rounded border border-[#2c2c2c] bg-[#181818] px-1.5 py-0.5 font-mono text-[10px] text-[#737373] sm:block">⌘K</kbd>
    </button>
  );

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pt-5">
        <Logo compact />
      </div>
      <div className="px-4 pt-5">{searchButton}</div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => `navlink ${isActive ? "navlink-active" : ""}`}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d={item.icon} />
            </svg>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-[#1c1c1c] p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#7C6CFF]/15 text-xs font-bold text-[#B9B0FF] ring-1 ring-[#7C6CFF]/30">
            {initials(user?.name ?? "U")}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user?.name}</p>
            <p className="truncate text-xs text-[#737373]">{user?.email}</p>
          </div>
          <button
            onClick={() => { void doLogout().catch(() => push("Could not log out", "error")); }}
            className="grid h-8 w-8 place-items-center rounded-lg text-[#737373] hover:bg-[#181818] hover:text-white"
            title="Log out"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-[#1c1c1c] bg-[#080808] lg:block">{sidebar}</aside>

      {/* Mobile topbar */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-[#1c1c1c] bg-[#080808]/95 px-4 py-3 backdrop-blur lg:hidden">
        <button onClick={() => setMobileOpen(true)} className="grid h-9 w-9 place-items-center rounded-lg text-[#A1A1A1] hover:bg-[#181818]" aria-label="Open menu">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
        </button>
        <Logo compact />
        <div className="flex-1" />
        <button onClick={() => setPaletteOpen(true)} className="grid h-9 w-9 place-items-center rounded-lg text-[#A1A1A1] hover:bg-[#181818]" aria-label="Search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} />
          <aside className="anim-modal absolute inset-y-0 left-0 w-72 border-r border-[#222] bg-[#080808]">{sidebar}</aside>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </div>
      </main>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
