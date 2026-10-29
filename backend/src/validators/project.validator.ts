import { z } from 'zod';

export const createProjectSchema = z.object({
  projectName: z.string().min(1, 'Project name is required').trim(),
  projectKey: z.string()
    .min(2, 'Project key must be at least 2 characters')
    .max(10, 'Project key must not exceed 10 characters')
    .regex(/^[A-Z0-9]+$/, 'Project key must be uppercase letters and numbers only')
    .trim(),
  description: z.string().optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate).getTime();
    const end = new Date(data.endDate).getTime();
    return end >= start;
  }
  return true;
}, {
  message: 'End date cannot be earlier than start date',
  path: ['endDate'],
});

export const updateProjectSchema = z.object({
  projectName: z.string().min(1, 'Project name cannot be empty').trim().optional(),
  description: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate).getTime();
    const end = new Date(data.endDate).getTime();
    return end >= start;
  }
  return true;
}, {
  message: 'End date cannot be earlier than start date',
  path: ['endDate'],
});

export const addMemberSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
});
