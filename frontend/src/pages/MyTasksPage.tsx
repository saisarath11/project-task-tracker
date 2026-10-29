import React, { useState, useEffect } from 'react';
import { dashboardApi } from '../api/dashboard';
import { Task } from '../types';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { TaskDetailModal } from '../components/tasks/TaskDetailModal';
import { formatDate, isTaskOverdue } from '../utils/cn';
import { CheckSquare, Search, Filter } from 'lucide-react';

export const MyTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await dashboardApi.getUserDashboard();
      setTasks(res.myTasks);
    } catch (err: any) {
      setError(err.message || 'Failed to load your tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      search.trim() === '' ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.taskKey.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Assigned Work</h1>
        <p className="text-sm text-slate-500">Every task assigned to your account across all projects</p>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title or key..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
        >
          <option value="ALL">All Statuses</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="DONE">Done</option>
        </select>
      </div>

      {/* Task List Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-center">
          <p className="font-semibold">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchTasks} className="mt-3">
            Retry
          </Button>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
          <CheckSquare className="h-10 w-10 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-slate-700">No matching tasks found</p>
          <p className="text-xs text-slate-400 mt-1">Try clearing your filters or check other projects</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Task Key</th>
                    <th className="px-6 py-3">Project</th>
                    <th className="px-6 py-3">Title</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Priority</th>
                    <th className="px-6 py-3">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTasks.map((task) => {
                    const overdue = isTaskOverdue(task.dueDate, task.status);
                    return (
                      <tr
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-3 font-mono font-bold text-indigo-700 text-xs">
                          {task.taskKey}
                        </td>
                        <td className="px-6 py-3 font-medium text-slate-700">
                          {task.project?.projectName || 'Project'}
                        </td>
                        <td className="px-6 py-3 font-semibold text-slate-900">{task.title}</td>
                        <td className="px-6 py-3">
                          <Badge
                            variant={
                              task.status === 'DONE'
                                ? 'success'
                                : task.status === 'IN_PROGRESS'
                                ? 'info'
                                : task.status === 'IN_REVIEW'
                                ? 'warning'
                                : 'secondary'
                            }
                          >
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="px-6 py-3">
                          <Badge
                            variant={
                              task.priority === 'HIGH'
                                ? 'destructive'
                                : task.priority === 'MEDIUM'
                                ? 'warning'
                                : 'secondary'
                            }
                          >
                            {task.priority}
                          </Badge>
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`text-xs font-medium ${
                              overdue ? 'text-rose-600 font-bold' : 'text-slate-600'
                            }`}
                          >
                            {formatDate(task.dueDate)} {overdue && '(Overdue)'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedTask && (
        <TaskDetailModal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          task={selectedTask}
          projectOwnerId={selectedTask.project?.ownerId}
          members={[]}
          onTaskUpdated={() => {
            fetchTasks();
            setSelectedTask(null);
          }}
          onTaskDeleted={() => {
            fetchTasks();
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
};
