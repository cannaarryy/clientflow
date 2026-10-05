import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider, useAuth } from "./hooks/AuthContext.js";
import { ToastProvider } from "./hooks/Toast.js";
import { LanguageProvider, useI18n } from "./i18n/LanguageProvider.js";
import { AppLayout } from "./layouts/AppLayout.js";
import { LandingPage } from "./pages/Landing.js";
import { LoginPage, RegisterPage } from "./pages/Auth.js";
import { PortalPage } from "./pages/Portal.js";
import { DemoPage } from "./pages/Demo.js";
import { NotFoundPage } from "./pages/NotFound.js";

// Lazy-load app pages for code splitting
const DashboardPage = lazy(() => import("./pages/Dashboard.js").then(m => ({ default: m.DashboardPage })));
const ClientsPage = lazy(() => import("./pages/Clients.js").then(m => ({ default: m.ClientsPage })));
const ClientDetailPage = lazy(() => import("./pages/ClientDetail.js").then(m => ({ default: m.ClientDetailPage })));
const ProjectsPage = lazy(() => import("./pages/Projects.js").then(m => ({ default: m.ProjectsPage })));
const ProjectDetailPage = lazy(() => import("./pages/ProjectDetail.js").then(m => ({ default: m.ProjectDetailPage })));
const TasksPage = lazy(() => import("./pages/Tasks.js").then(m => ({ default: m.TasksPage })));
const NotesPage = lazy(() => import("./pages/Notes.js").then(m => ({ default: m.NotesPage })));
const RequestsPage = lazy(() => import("./pages/Requests.js").then(m => ({ default: m.RequestsPage })));
const AutomationsPage = lazy(() => import("./pages/Automations.js").then(m => ({ default: m.AutomationsPage })));
const ActivityPage = lazy(() => import("./pages/Activity.js").then(m => ({ default: m.ActivityPage })));
const SettingsPage = lazy(() => import("./pages/Settings.js").then(m => ({ default: m.SettingsPage })));

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
  const { t } = useI18n();
  return (
    <div className="grid min-h-screen place-items-center bg-[#050505]">
      <div className="flex items-center gap-3 text-sm text-[#818181]">
        <span className="h-2 w-2 animate-pulse rounded-full bg-[#7C6CFF]" />
        {t("app.loading")}
      </div>
    </div>
  );
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<BootSplash />}>
      {children}
    </Suspense>
  );
}

export function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Marketing */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/demo" element={<DemoPage />} />
              <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
              <Route path="/register" element={<PublicOnly><RegisterPage /></PublicOnly>} />
              {/* Client Portal (public magic link — outside /app auth) */}
              <Route path="/portal/:token" element={<PortalPage />} />

              {/* Application */}
              <Route path="/app" element={<Private><AppLayout /></Private>}>
                <Route index element={<PageWrapper><DashboardPage /></PageWrapper>} />
                <Route path="clients" element={<PageWrapper><ClientsPage /></PageWrapper>} />
                <Route path="clients/:id" element={<PageWrapper><ClientDetailPage /></PageWrapper>} />
                <Route path="projects" element={<PageWrapper><ProjectsPage /></PageWrapper>} />
                <Route path="projects/:id" element={<PageWrapper><ProjectDetailPage /></PageWrapper>} />
                <Route path="tasks" element={<PageWrapper><TasksPage /></PageWrapper>} />
                <Route path="requests" element={<PageWrapper><RequestsPage /></PageWrapper>} />
                <Route path="automations" element={<PageWrapper><AutomationsPage /></PageWrapper>} />
                <Route path="notes" element={<PageWrapper><NotesPage /></PageWrapper>} />
                <Route path="activity" element={<PageWrapper><ActivityPage /></PageWrapper>} />
                <Route path="settings" element={<PageWrapper><SettingsPage /></PageWrapper>} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  );
}
