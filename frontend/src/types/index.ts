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
  _count?: { projects: number; tasks: number };
  projects?: Project[];
  tasks?: Task[];
  notesList?: Note[];
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
  tasks?: Task[];
  notesList?: Note[];
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
}

export interface Note {
  id: string;
  title?: string | null;
  content: string;
  clientId?: string | null;
  projectId?: string | null;
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
  stats: { activeClients: number; activeProjects: number; openTasks: number; completedTasks: number };
  recentActivity: Activity[];
  upcomingTasks: Task[];
  recentClients: Client[];
}
