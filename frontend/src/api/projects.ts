import { apiClient } from './client';
import { Project, ProjectMember, Task, ProjectDashboardData } from '../types';

export const projectsApi = {
  getProjects: (search?: string) => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiClient<Project[]>(`/projects${query}`);
  },

  getProjectById: (id: string) => apiClient<Project>(`/projects/${id}`),

  createProject: (data: {
    projectName: string;
    projectKey: string;
    description?: string;
    startDate?: string | null;
    endDate?: string | null;
  }) =>
    apiClient<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProject: (
    id: string,
    data: {
      projectName?: string;
      description?: string | null;
      startDate?: string | null;
      endDate?: string | null;
    }
  ) =>
    apiClient<Project>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  getMembers: (id: string) => apiClient<ProjectMember[]>(`/projects/${id}/members`),

  addMember: (id: string, email: string) =>
    apiClient<ProjectMember>(`/projects/${id}/members`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  removeMember: (id: string, userId: string) =>
    apiClient<{ message: string; unassignedTasksCount: number }>(`/projects/${id}/members/${userId}`, {
      method: 'DELETE',
    }),

  getTasks: (
    projectId: string,
    filters?: { search?: string; status?: string; priority?: string; assignee?: string }
  ) => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.assignee) params.append('assignee', filters.assignee);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiClient<Task[]>(`/projects/${projectId}/tasks${queryString}`);
  },

  createTask: (
    projectId: string,
    data: {
      title: string;
      description?: string | null;
      priority: string;
      assigneeId?: string | null;
      dueDate?: string | null;
    }
  ) =>
    apiClient<Task>(`/projects/${projectId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getDashboard: (id: string) => apiClient<ProjectDashboardData>(`/projects/${id}/dashboard`),
};
