import React, { useState, useEffect } from 'react';
import { dashboardApi } from '../api/dashboard';
import { UserDashboardData, Task } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { TaskCard } from '../components/kanban/TaskCard';
import { TaskDetailModal } from '../components/tasks/TaskDetailModal';
import { CheckSquare, Calendar, AlertTriangle, CheckCircle2, FolderKanban } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<UserDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<'myTasks' | 'dueThisWeek' | 'overdue'>('myTasks');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await dashboardApi.getUserDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
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
        <p className="font-semibold">{error || 'Unable to load dashboard data'}</p>
        <button
          onClick={fetchDashboard}
          className="mt-3 px-4 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { summary, myTasks, dueThisWeek, overdue } = data;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Personal Workspace</h1>
          <p className="text-sm text-slate-500">Track and execute your assigned project work items</p>
        </div>
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors self-start sm:self-auto"
        >
          <FolderKanban className="h-4 w-4" />
          <span>Browse Projects</span>
        </Link>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Assigned Tasks
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{summary.totalTasks}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <CheckSquare className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Due This Week
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{summary.dueThisWeekCount}</h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Calendar className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Overdue Tasks
              </p>
              <h3 className="text-2xl font-bold text-rose-600 mt-1">{summary.overdueCount}</h3>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Completed
              </p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{summary.completedTasks}</h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Task Views */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100">
          <div className="flex gap-2 border-b sm:border-b-0 border-gray-200">
            <button
              onClick={() => setActiveTab('myTasks')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                activeTab === 'myTasks'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              My Tasks ({myTasks.length})
            </button>
            <button
              onClick={() => setActiveTab('dueThisWeek')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                activeTab === 'dueThisWeek'
                  ? 'bg-amber-50 text-amber-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Due This Week ({dueThisWeek.length})
            </button>
            <button
              onClick={() => setActiveTab('overdue')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                activeTab === 'overdue'
                  ? 'bg-rose-50 text-rose-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Overdue ({overdue.length})
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {activeTab === 'myTasks' && (
            myTasks.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <CheckSquare className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-600">No tasks currently assigned to you</p>
                <p className="text-xs text-slate-400 mt-1">Visit your projects to view or pick up tasks</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myTasks.map((t) => (
                  <TaskCard key={t.id} task={t} onClick={() => setSelectedTask(t)} />
                ))}
              </div>
            )
          )}

          {activeTab === 'dueThisWeek' && (
            dueThisWeek.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Calendar className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-600">No tasks due this week</p>
                <p className="text-xs text-slate-400 mt-1">You are all caught up on immediate deadlines</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dueThisWeek.map((t) => (
                  <TaskCard key={t.id} task={t} onClick={() => setSelectedTask(t)} />
                ))}
              </div>
            )
          )}

          {activeTab === 'overdue' && (
            overdue.length === 0 ? (
              <div className="text-center py-12 text-emerald-600">
                <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-400 mb-2" />
                <p className="font-semibold text-emerald-800">No overdue tasks!</p>
                <p className="text-xs text-slate-400 mt-1">All deadlines are being met on time</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {overdue.map((t) => (
                  <TaskCard key={t.id} task={t} onClick={() => setSelectedTask(t)} />
                ))}
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          task={selectedTask}
          projectOwnerId={selectedTask.project?.ownerId}
          members={[]}
          onTaskUpdated={() => {
            fetchDashboard();
            setSelectedTask(null);
          }}
          onTaskDeleted={() => {
            fetchDashboard();
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
};
