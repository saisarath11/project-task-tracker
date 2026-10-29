import React from 'react';
import { Task, TaskStatus } from '../../types';
import { TaskCard } from './TaskCard';

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  colorClass: string;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  title,
  tasks,
  onTaskClick,
  colorClass,
}) => {
  return (
    <div className="flex flex-col w-80 min-w-[20rem] bg-slate-100/80 rounded-2xl p-4 border border-slate-200/80 max-h-full">
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${colorClass}`} />
          <h3 className="font-bold text-sm text-slate-800 tracking-tight">{title}</h3>
        </div>
        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-200/90 text-slate-700">
          {tasks.length}
        </span>
      </div>

      {/* Task List */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {tasks.length === 0 ? (
          <div className="h-28 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-400 font-medium">
            No tasks in {title.toLowerCase()}
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))
        )}
      </div>
    </div>
  );
};
