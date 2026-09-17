export interface User {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
}

export type ClientStatus = "ACTIVE" | "INACTIVE" | "LEAD";
export type ProjectStatus = "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED";
export type Priority = "LOW" | "MEDIUM" | "HIGH";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type RequestStatus = "OPEN" | "IN_PROGRESS" | "CONVERTED" | "DECLINED";
export type Visibility = "INTERNAL" | "SHARED";
export type Health = "HEALTHY" | "AT_RISK" | "BLOCKED" | "COMPLETED";

export interface Client {
  id: string;
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  status: ClientStatus;
  createdAt: string;
  updatedAt: string;
  portalEnabled?: boolean;
  portalToken?: string | null;
  _count?: { projects: number; tasks: number };
  projects?: Project[];
  tasks?: Task[];
  notesList?: Note[];
  requests?: ClientRequest[];
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  priority: Priority;
  startDate?: string | null;
  dueDate?: string | null;
  clientId: string;
  client?: { id: string; name: string; company?: string | null };
  createdAt: string;
  updatedAt: string;
  isShared?: boolean;
  tasks?: Task[];
  notesList?: Note[];
  comments?: Comment[];
  requests?: ClientRequest[];
  _count?: { tasks: number };
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string | null;
  createdAt: string;
  projectId?: string | null;
  clientId?: string | null;
  project?: { id: string; name: string } | null;
  client?: { id: string; name: string; company?: string | null } | null;
  isShared?: boolean;
}

export interface Note {
  id: string;
  title?: string | null;
  content: string;
  clientId?: string | null;
  projectId?: string | null;
  visibility?: Visibility;
  client?: { id: string; name: string; company?: string | null } | null;
  project?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  type: string;
  message: string;
  entityType?: string | null;
  entityId?: string | null;
  createdAt: string;
}

export interface DashboardData {
  stats: { activeClients: number; activeProjects: number; openTasks: number; completedTasks: number; overdue: number; openRequests: number; unreadNotifications: number };
  recentActivity: Activity[];
  upcomingTasks: Task[];
  overdueTasks: Task[];
  recentClients: Client[];
  openRequests: ClientRequest[];
  projectHealth: Array<{ id: string; name: string; status: string; dueDate?: string | null; client?: { id: string; name: string; company?: string | null } | null; health: Health; progress: number; total: number; done: number; overdue: number }>;
  deadlines: Array<{ kind: "project" | "task"; id: string; title: string; dueDate: string }>;
  nextActions: NextAction[];
}

export interface ClientRequest {
  id: string;
  title: string;
  description?: string | null;
  priority: Priority;
  status: RequestStatus;
  createdBy: "CLIENT" | "PRO";
  clientId: string;
  projectId?: string | null;
  taskId?: string | null;
  client?: { id: string; name: string; company?: string | null };
  project?: { id: string; name: string } | null;
  comments?: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  authorName: string;
  authorRole: "PRO" | "CLIENT";
  visibility: Visibility;
  content: string;
  projectId?: string | null;
  taskId?: string | null;
  requestId?: string | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  message: string;
  entityType?: string | null;
  entityId?: string | null;
  readAt?: string | null;
  createdAt: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  config: Record<string, unknown>;
  enabled: boolean;
  lastRunAt?: string | null;
  createdAt: string;
}

export interface NextAction {
  kind: "overdue" | "due_soon" | "stale_lead" | "open_request" | "idle_project";
  message: string;
  entityType?: string;
  entityId?: string;
}

export interface ProjectSummary {
  progress: number;
  health: string;
  total: number;
  done: number;
  overdue: number;
  nextDue?: { title: string; dueDate: string } | null;
  highlights: string[];
}

export interface PortalData {
  client: { id: string; name: string; company?: string | null; email?: string | null; status: string };
  professional: { name: string };
  projects: Array<Project & { health: { health: Health; progress: number; total: number; done: number; overdue: number } }>;
  notes: Note[];
  comments: Comment[];
  requests: ClientRequest[];
  activity: Activity[];
}
