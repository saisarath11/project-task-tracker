import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';
import { ProjectMember } from '../../types';

interface TaskFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  status: string;
  onStatusChange: (val: string) => void;
  priority: string;
  onPriorityChange: (val: string) => void;
  assignee: string;
  onAssigneeChange: (val: string) => void;
  members: ProjectMember[];
  onReset: () => void;
}

export const TaskFilterBar: React.FC<TaskFilterBarProps> = ({
  search,
  onSearchChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  assignee,
  onAssigneeChange,
  members,
  onReset,
}) => {
  const hasActiveFilters =
    search.trim() !== '' || status !== 'ALL' || priority !== 'ALL' || assignee !== 'ALL';

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-white rounded-xl border border-gray-200/90 shadow-xs mb-6">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tasks by title or key..."
          className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Status Filter */}
      <div className="min-w-[130px]">
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
        >
          <option value="ALL">All Statuses</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="DONE">Done</option>
        </select>
      </div>

      {/* Priority Filter */}
      <div className="min-w-[130px]">
        <select
          value={priority}
          onChange={(e) => onPriorityChange(e.target.value)}
          className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
        >
          <option value="ALL">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
      </div>

      {/* Assignee Filter */}
      <div className="min-w-[140px]">
        <select
          value={assignee}
          onChange={(e) => onAssigneeChange(e.target.value)}
          className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
        >
          <option value="ALL">All Assignees</option>
          <option value="UNASSIGNED">Unassigned</option>
          {members.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.user.name}
            </option>
          ))}
        </select>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onReset} className="text-gray-500 hover:text-gray-900 gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset</span>
        </Button>
      )}
    </div>
  );
};
