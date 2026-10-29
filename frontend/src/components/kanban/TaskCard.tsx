import React from 'react';
import { Task } from '../../types';
import { Badge } from '../ui/Badge';
import { formatDate, isTaskOverdue } from '../../utils/cn';
import { Calendar, AlertCircle, MessageSquare } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  isDragging?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, isDragging }) => {
  const overdue = isTaskOverdue(task.dueDate, task.status);

  const priorityVariants = {
    LOW: 'secondary',
    MEDIUM: 'warning',
    HIGH: 'destructive',
  } as const;

  return (
    <div
      onClick={onClick}
      className={`group relative bg-white p-4 rounded-xl border border-gray-200/90 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer ${
        isDragging ? 'opacity-50 ring-2 ring-indigo-500 shadow-lg' : ''
      }`}
    >
      {/* Header: Key & Priority */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
          {task.taskKey}
        </span>
        <Badge variant={priorityVariants[task.priority]} className="text-[10px]">
          {task.priority}
        </Badge>
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-3">
        {task.title}
      </h4>

      {/* Footer: Due date & Assignee */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
        <div className="flex items-center gap-1.5">
          {task.dueDate ? (
            <div
              className={`flex items-center gap-1 font-medium ${
                overdue ? 'text-rose-600 font-semibold' : 'text-gray-500'
              }`}
            >
              {overdue ? (
                <AlertCircle className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
              ) : (
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
              )}
              <span>{formatDate(task.dueDate)}</span>
              {overdue && <span className="text-[10px] uppercase tracking-wide bg-rose-50 px-1 py-0.2 rounded border border-rose-200">Overdue</span>}
            </div>
          ) : (
            <span className="text-gray-400">No due date</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {task._count?.comments ? (
            <div className="flex items-center gap-0.5 text-gray-400">
              <MessageSquare className="h-3 w-3" />
              <span className="text-[11px]">{task._count.comments}</span>
            </div>
          ) : null}

          {task.assignee ? (
            <div
              title={`Assigned to ${task.assignee.name}`}
              className="h-6 w-6 rounded-full bg-slate-200 text-slate-800 text-[10px] font-bold flex items-center justify-center border border-slate-300"
            >
              {task.assignee.name.charAt(0).toUpperCase()}
            </div>
          ) : (
            <span className="text-[10px] text-gray-400 italic">Unassigned</span>
          )}
        </div>
      </div>
    </div>
  );
};
