import { apiClient } from './client';
import { UserDashboardData, AdminDashboardData } from '../types';

export const dashboardApi = {
  getUserDashboard: () => apiClient<UserDashboardData>('/dashboard/me'),
  getAdminDashboard: () => apiClient<AdminDashboardData>('/dashboard/admin'),
};
