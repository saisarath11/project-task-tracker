import { apiClient } from './client';
import { Task, Comment } from '../types';

export const tasksApi = {
  getTaskById: (id: string) => apiClient<Task>(`/tasks/${id}`),

  updateTask: (
    id: string,
    data: {
      title?: string;
      description?: string | null;
      priority?: string;
      assigneeId?: string | null;
      dueDate?: string | null;
      version: number;
    }
  ) =>
    apiClient<Task>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  updateStatus: (id: string, status: string, version: number) =>
    apiClient<Task>(`/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, version }),
    }),

  deleteTask: (id: string) =>
    apiClient<{ message: string }>(`/tasks/${id}`, {
      method: 'DELETE',
    }),

  getComments: (id: string) => apiClient<Comment[]>(`/tasks/${id}/comments`),

  addComment: (id: string, content: string) =>
    apiClient<Comment>(`/tasks/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
};
