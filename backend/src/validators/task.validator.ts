import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').trim(),
  description: z.string().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
}).refine((data) => {
  if (data.dueDate) {
    const due = new Date(data.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due.getTime() >= today.getTime();
  }
  return true;
}, {
  message: 'Due date cannot be in the past',
  path: ['dueDate'],
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Task title cannot be empty').trim().optional(),
  description: z.string().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  version: z.number({ required_error: 'Task version is required for concurrency control' }),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']),
  version: z.number({ required_error: 'Task version is required for concurrency control' }),
});

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').trim(),
});
