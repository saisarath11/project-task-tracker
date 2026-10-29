import React, { useState, useEffect } from 'react';
import { dashboardApi } from '../api/dashboard';
import { AdminDashboardData } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { formatDate } from '../utils/cn';
import {
  FolderKanban,
  Users,
  CheckSquare,
  AlertTriangle,
  BarChart2,
  ShieldAlert,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        setLoading(true);
        const res = await dashboardApi.getAdminDashboard();
        setData(res);
      } catch (err: any) {
        setError(err.message || 'Failed to load administrator statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-center">
        <ShieldAlert className="h-8 w-8 mx-auto text-rose-600 mb-2" />
        <p className="font-semibold">{error || 'Access Denied'}</p>
      </div>
    );
  }

  const { summary, statusDistribution, tasksPerMember, overdueTasks } = data;

  const STATUS_COLORS: Record<string, string> = {
    TODO: '#94a3b8',
    IN_PROGRESS: '#3b82f6',
    IN_REVIEW: '#f59e0b',
    DONE: '#10b981',
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="default" className="bg-indigo-700">Administrator Console</Badge>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System-Wide Analytics</h1>
        <p className="text-sm text-slate-500">Cross-project oversight, throughput metrics, and team resource allocation</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Projects</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{summary.totalProjects}</h3>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <FolderKanban className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registered Users</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{summary.totalUsers}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Tasks</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{summary.totalTasks}</h3>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <CheckSquare className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Global Overdue</p>
              <h3 className="text-2xl font-bold text-rose-600 mt-1">{summary.overdueCount}</h3>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recharts Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-indigo-600" />
              <span>Tasks by Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {statusDistribution.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Per Team Member */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-600" />
              <span>Tasks Per Team Member</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tasksPerMember} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="taskCount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Tasks Across All Projects */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-rose-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            <span>High Priority Attention: Global Overdue Tasks</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {overdueTasks.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-400">
              No overdue tasks currently logged across the system.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Task Key</th>
                    <th className="px-6 py-3">Project</th>
                    <th className="px-6 py-3">Title</th>
                    <th className="px-6 py-3">Assignee</th>
                    <th className="px-6 py-3">Due Date</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {overdueTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-slate-50/80">
                      <td className="px-6 py-3 font-mono font-bold text-indigo-700 text-xs">
                        {task.taskKey}
                      </td>
                      <td className="px-6 py-3 font-medium text-slate-700">
                        {task.project.projectName}
                      </td>
                      <td className="px-6 py-3 font-semibold text-slate-900">{task.title}</td>
                      <td className="px-6 py-3 text-slate-600">
                        {task.assignee ? task.assignee.name : <span className="italic text-slate-400">Unassigned</span>}
                      </td>
                      <td className="px-6 py-3 text-rose-600 font-semibold text-xs">
                        {formatDate(task.dueDate)}
                      </td>
                      <td className="px-6 py-3">
                        <Badge variant="warning">{task.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
