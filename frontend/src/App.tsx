import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/AuthContext.js";
import { ToastProvider } from "./hooks/Toast.js";
import { AppLayout } from "./layouts/AppLayout.js";
import { LandingPage } from "./pages/Landing.js";
import { LoginPage, RegisterPage } from "./pages/Auth.js";
import { DashboardPage } from "./pages/Dashboard.js";
import { ClientsPage } from "./pages/Clients.js";
import { ClientDetailPage } from "./pages/ClientDetail.js";
import { ProjectsPage } from "./pages/Projects.js";
import { ProjectDetailPage } from "./pages/ProjectDetail.js";
import { TasksPage } from "./pages/Tasks.js";
import { NotesPage } from "./pages/Notes.js";
import { ActivityPage } from "./pages/Activity.js";
import { SettingsPage } from "./pages/Settings.js";
import { NotFoundPage } from "./pages/NotFound.js";

function PublicOnly({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <BootSplash />;
  if (user) return <Navigate to="/app" replace />;
  return children;
}

function Private({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <BootSplash />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function BootSplash() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#050505]">
      <div className="flex items-center gap-3 text-sm text-[#737373]">
        <span className="h-2 w-2 animate-pulse rounded-full bg-[#7C6CFF]" />
        Loading ClientFlow…
      </div>
    </div>
  );
}

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Marketing */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
            <Route path="/register" element={<PublicOnly><RegisterPage /></PublicOnly>} />

            {/* Application */}
            <Route path="/app" element={<Private><AppLayout /></Private>}>
              <Route index element={<DashboardPage />} />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="clients/:id" element={<ClientDetailPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="projects/:id" element={<ProjectDetailPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="notes" element={<NotesPage />} />
              <Route path="activity" element={<ActivityPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
