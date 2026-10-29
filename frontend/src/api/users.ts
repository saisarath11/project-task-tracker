import { apiClient } from './client';
import { User } from '../types';

export const usersApi = {
  getProfile: () => apiClient<User>('/users/me'),
  updateProfile: (data: { name?: string; email?: string }) =>
    apiClient<User>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  getAllUsers: () => apiClient<User[]>('/users'),
};
