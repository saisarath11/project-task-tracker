import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsApi } from '../api/projects';
import { Project } from '../types';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { CreateProjectModal } from '../components/projects/CreateProjectModal';
import { formatDate } from '../utils/cn';
import {
  FolderKanban,
  Plus,
  Search,
  Users,
  CheckSquare,
  Calendar,
  ArrowRight,
} from 'lucide-react';

export const ProjectsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchProjects = async (searchQuery?: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await projectsApi.getProjects(searchQuery);
      setProjects(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProjects(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Projects Directory</h1>
          <p className="text-sm text-slate-500">
            Workspaces you own or collaborate in as an assigned member
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter projects by title or key..."
          className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
        />
      </div>

      {/* Content States */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-center">
          <p className="font-semibold">{error}</p>
          <Button variant="outline" size="sm" onClick={() => fetchProjects()} className="mt-3">
            Retry
          </Button>
        </div>
      ) : projects.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
          <FolderKanban className="h-12 w-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">No projects found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            {search ? 'No projects match your search query.' : 'Create your first project workspace to begin tracking tasks.'}
          </p>
          <Button onClick={() => setIsCreateModalOpen(true)} className="mt-4 gap-1.5">
            <Plus className="h-4 w-4" />
            <span>Create First Project</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                    {project.projectKey}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Users className="h-3.5 w-3.5" />
                    <span>{project._count?.members || 1} members</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 line-clamp-1">
                    {project.projectName}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                    {project.description || 'No description provided.'}
                  </p>
                </div>

                {/* Timeline & Task Counts */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <CheckSquare className="h-3.5 w-3.5 text-indigo-500" />
                    <span>{project._count?.tasks || 0} tasks</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px]">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      {project.startDate ? formatDate(project.startDate) : 'Ongoing'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    Owner: <span className="font-semibold text-slate-700">{project.owner?.name}</span>
                  </span>
                  <span className="inline-flex items-center text-xs font-semibold text-indigo-600">
                    <span>Open</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onProjectCreated={(newId) => {
          fetchProjects();
          navigate(`/projects/${newId}`);
        }}
      />
    </div>
  );
};
