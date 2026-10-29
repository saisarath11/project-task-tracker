import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsApi } from '../../src/api/projects';
import { Project, Task, ProjectMember, ProjectDashboardData } from '../types';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
import { KanbanBoard } from '../components/kanban/KanbanBoard';
import { TaskFilterBar } from '../components/tasks/TaskFilterBar';
import { CreateTaskModal } from '../components/tasks/CreateTaskModal';
import { TaskDetailModal } from '../components/tasks/TaskDetailModal';
import { EditProjectModal } from '../components/projects/EditProjectModal';
import { MembersManagementModal } from '../components/projects/MembersManagementModal';
import { formatDate, isTaskOverdue } from '../utils/cn';
import {
  Plus,
  Users,
  Settings,
  ShieldAlert,
  ArrowLeft,
  LayoutGrid,
  List,
  BarChart3,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [projectDashboard, setProjectDashboard] = useState<ProjectDashboardData | null>(null);

  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // View state
  const [activeView, setActiveView] = useState<'kanban' | 'list' | 'analytics'>('kanban');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState('ALL');

  // Modals
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const fetchProjectData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setAccessDenied(false);
      setErrorMessage(null);

      const [projData, membersData, tasksData] = await Promise.all([
        projectsApi.getProjectById(id),
        projectsApi.getMembers(id),
        projectsApi.getTasks(id, {
          search,
          status: statusFilter,
          priority: priorityFilter,
          assignee: assigneeFilter,
        }),
      ]);

      setProject(projData);
      setMembers(membersData);
      setTasks(tasksData);
    } catch (err: any) {
      if (err.status === 403) {
        setAccessDenied(true);
      } else {
        setErrorMessage(err.message || 'Failed to load project details');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    if (!id) return;
    try {
      const dash = await projectsApi.getDashboard(id);
      setProjectDashboard(dash);
    } catch {
      // Handled silently
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [id, search, statusFilter, priorityFilter, assigneeFilter]);

  useEffect(() => {
    if (activeView === 'analytics') {
      fetchAnalytics();
    }
  }, [activeView]);

  if (loading && !project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  // Business Rule BR-01 & Non-member URL protection (Section 27)
  if (accessDenied) {
    return (
      <div className="max-w-md mx-auto my-16 text-center p-8 bg-white rounded-2xl border border-rose-200 shadow-sm">
        <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl inline-block mb-4">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
        <p className="text-sm text-slate-600 mt-2 mb-6">
          You don&apos;t have permission to access this project. Only verified project members can view and collaborate on work items.
        </p>
        <Button onClick={() => navigate('/projects')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Projects</span>
        </Button>
      </div>
    );
  }

  if (errorMessage || !project) {
    return (
      <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
        <p className="font-semibold">{errorMessage || 'Project not found'}</p>
        <Button variant="outline" size="sm" onClick={() => fetchProjectData()} className="mt-3">
          Retry
        </Button>
      </div>
    );
  }

  const isOwner = user?.id === project.ownerId;
  const isAdmin = user?.role === 'ADMIN';
  const isOwnerOrAdmin = isOwner || isAdmin;

  const STATUS_COLORS: Record<string, string> = {
    TODO: '#94a3b8',
    IN_PROGRESS: '#3b82f6',
    IN_REVIEW: '#f59e0b',
    DONE: '#10b981',
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/projects')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Projects Directory</span>
        </button>

        {isOwnerOrAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditProjectOpen(true)}
            className="gap-1.5"
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Project Settings</span>
          </Button>
        )}
      </div>

      {/* Project Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-sm font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-100">
                {project.projectKey}
              </span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {project.projectName}
              </h1>
            </div>
            <p className="text-sm text-slate-600 max-w-3xl">
              {project.description || <span className="italic text-slate-400">No project description.</span>}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              onClick={() => setIsMembersModalOpen(true)}
              className="gap-1.5"
            >
              <Users className="h-4 w-4" />
              <span>Members ({members.length})</span>
            </Button>
            <Button onClick={() => setIsCreateTaskOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" />
              <span>New Task</span>
            </Button>
          </div>
        </div>

        {/* Timeline & Metadata bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs text-slate-500">
          <div>
            Owner: <span className="font-semibold text-slate-800">{project.owner?.name}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>
              Timeline:{' '}
              <span className="font-medium text-slate-700">
                {project.startDate ? formatDate(project.startDate) : 'Start'} &rarr;{' '}
                {project.endDate ? formatDate(project.endDate) : 'Ongoing'}
              </span>
            </span>
          </div>
          <div>
            Tasks Count: <span className="font-semibold text-slate-800">{tasks.length}</span>
          </div>
        </div>
      </div>

      {/* View Switcher & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="inline-flex p-1 bg-slate-200/70 rounded-xl">
          <button
            onClick={() => setActiveView('kanban')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'kanban'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Board</span>
          </button>
          <button
            onClick={() => setActiveView('list')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'list'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            <span>List View</span>
          </button>
          <button
            onClick={() => setActiveView('analytics')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'analytics'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Analytics</span>
          </button>
        </div>
      </div>

      {/* Filter Bar (Active on Board and List Views) */}
      {activeView !== 'analytics' && (
        <TaskFilterBar
          search={search}
          onSearchChange={setSearch}
          status={statusFilter}
          onStatusChange={setStatusFilter}
          priority={priorityFilter}
          onPriorityChange={setPriorityFilter}
          assignee={assigneeFilter}
          onAssigneeChange={setAssigneeFilter}
          members={members}
          onReset={() => {
            setSearch('');
            setStatusFilter('ALL');
            setPriorityFilter('ALL');
            setAssigneeFilter('ALL');
          }}
        />
      )}

      {/* View 1: Kanban Board */}
      {activeView === 'kanban' && (
        <KanbanBoard tasks={tasks} onTaskClick={(task) => setSelectedTask(task)} />
      )}

      {/* View 2: List View */}
      {activeView === 'list' && (
        <Card>
          <CardContent className="p-0">
            {tasks.length === 0 ? (
              <div className="p-12 text-center text-sm text-slate-400">
                No tasks match current search or filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3">Task Key</th>
                      <th className="px-6 py-3">Title</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Priority</th>
                      <th className="px-6 py-3">Assignee</th>
                      <th className="px-6 py-3">Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tasks.map((task) => {
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
                          <td className="px-6 py-3 text-slate-700">
                            {task.assignee ? task.assignee.name : <span className="italic text-slate-400">Unassigned</span>}
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
            )}
          </CardContent>
        </Card>
      )}

      {/* View 3: Project Analytics Dashboard */}
      {activeView === 'analytics' && projectDashboard && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Project Status Breakdown</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectDashboard.statusDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {projectDashboard.statusDistribution.map((entry) => (
                          <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#6366f1'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Assigned Tasks Per Member</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectDashboard.tasksPerMember} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="taskCount" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        projectId={project.id}
        members={members}
        onTaskCreated={fetchProjectData}
      />

      <EditProjectModal
        isOpen={isEditProjectOpen}
        onClose={() => setIsEditProjectOpen(false)}
        project={project}
        onProjectUpdated={fetchProjectData}
      />

      <MembersManagementModal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        projectId={project.id}
        projectOwnerId={project.ownerId}
        members={members}
        isOwnerOrAdmin={isOwnerOrAdmin}
        onMembersUpdated={fetchProjectData}
      />

      {selectedTask && (
        <TaskDetailModal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          task={selectedTask}
          projectOwnerId={project.ownerId}
          members={members}
          onTaskUpdated={() => {
            fetchProjectData();
            setSelectedTask(null);
          }}
          onTaskDeleted={() => {
            fetchProjectData();
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
};
