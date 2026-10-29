import React from 'react';
import { Task, TaskStatus } from '../../types';
import { KanbanColumn } from './KanbanColumn';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onTaskClick }) => {
  const columns: { status: TaskStatus; title: string; colorClass: string }[] = [
    { status: 'TODO', title: 'To Do', colorClass: 'bg-slate-400' },
    { status: 'IN_PROGRESS', title: 'In Progress', colorClass: 'bg-blue-500' },
    { status: 'IN_REVIEW', title: 'In Review', colorClass: 'bg-amber-500' },
    { status: 'DONE', title: 'Done', colorClass: 'bg-emerald-500' },
  ];

  return (
    <div className="flex gap-6 overflow-x-auto pb-6 pt-2 h-[calc(100vh-16rem)] min-h-[500px] select-none">
      {columns.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.status);
        return (
          <KanbanColumn
            key={col.status}
            status={col.status}
            title={col.title}
            colorClass={col.colorClass}
            tasks={columnTasks}
            onTaskClick={onTaskClick}
          />
        );
      })}
    </div>
  );
};
