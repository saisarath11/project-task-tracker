export type UserRole = 'USER' | 'ADMIN';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt?: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: 'OWNER' | 'MEMBER';
  joinedAt: string;
  user: User;
}

export interface Project {
  id: string;
  projectName: string;
  projectKey: string;
  description?: string | null;
  ownerId: string;
  owner?: User;
  taskCounter?: number;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  updatedAt?: string;
  members?: ProjectMember[];
  _count?: {
    members?: number;
    tasks?: number;
  };
}

export interface Task {
  id: string;
  taskKey: string;
  taskNumber: number;
  projectId: string;
  project?: {
    id: string;
    projectName: string;
    projectKey: string;
    ownerId?: string;
  };
  title: string;
  description?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  assigneeId?: string | null;
  assignee?: User | null;
  reporterId: string;
  reporter?: User;
  dueDate?: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    comments?: number;
  };
  comments?: Comment[];
  activityLogs?: ActivityLog[];
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  projectId?: string | null;
  taskId?: string | null;
  action: string;
  entity: string;
  entityId: string;
  metadata?: string | null;
  createdAt: string;
}

export interface UserDashboardData {
  summary: {
    totalTasks: number;
    completedTasks: number;
    dueThisWeekCount: number;
    overdueCount: number;
  };
  myTasks: Task[];
  dueThisWeek: Task[];
  overdue: Task[];
}

export interface AdminDashboardData {
  summary: {
    totalProjects: number;
    totalUsers: number;
    totalTasks: number;
    overdueCount: number;
  };
  statusDistribution: { status: TaskStatus; count: number }[];
  tasksPerMember: { id: string; name: string; email: string; taskCount: number }[];
  overdueTasks: (Task & { project: { id: string; projectName: string; projectKey: string } })[];
}

export interface ProjectDashboardData {
  project: {
    id: string;
    projectName: string;
    projectKey: string;
    ownerId: string;
  };
  summary: {
    totalTasks: number;
    completedTasks: number;
    overdueCount: number;
    memberCount: number;
  };
  statusDistribution: { status: TaskStatus; count: number }[];
  tasksPerMember: { userId: string; name: string; email: string; taskCount: number }[];
  overdueTasks: Task[];
}
