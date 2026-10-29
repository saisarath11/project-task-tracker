import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { projectsApi } from '../../api/projects';

const createProjectSchema = z
  .object({
    projectName: z.string().min(1, 'Project name is required').trim(),
    projectKey: z
      .string()
      .min(2, 'Project key must be at least 2 characters')
      .max(10, 'Project key must not exceed 10 characters')
      .regex(/^[A-Z0-9]+$/, 'Project key must be uppercase letters and numbers only')
      .trim(),
    description: z.string().optional(),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: 'End date cannot be earlier than start date',
      path: ['endDate'],
    }
  );

type CreateProjectFormData = z.infer<typeof createProjectSchema>;

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (newProjectId: string) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
}) => {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      projectName: '',
      projectKey: '',
      description: '',
      startDate: '',
      endDate: '',
    },
  });

  const onSubmit = async (data: CreateProjectFormData) => {
    try {
      setServerError(null);
      const project = await projectsApi.createProject({
        projectName: data.projectName,
        projectKey: data.projectKey.toUpperCase(),
        description: data.description || undefined,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
      });

      reset();
      onProjectCreated(project.id);
      onClose();
    } catch (err: any) {
      setServerError(err.message || 'Failed to create project');
    }
  };

  const handleClose = () => {
    reset();
    setServerError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Project"
      description="Initialize a new project workspace"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="p-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
            {serverError}
          </div>
        )}

        <Input
          label="Project Name *"
          placeholder="e.g. Enterprise CRM Suite"
          error={errors.projectName?.message}
          {...register('projectName')}
        />

        <Input
          label="Project Key *"
          placeholder="e.g. CRM, LIB, WEB"
          helperText="Unique uppercase identifier for task prefixes (e.g. CRM-1)"
          error={errors.projectKey?.message}
          {...register('projectKey', {
            onChange: (e) => setValue('projectKey', e.target.value.toUpperCase()),
          })}
        />

        <Textarea
          label="Description"
          placeholder="Summary of project goals and scope..."
          rows={3}
          error={errors.description?.message}
          {...register('description')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            type="date"
            label="Start Date"
            error={errors.startDate?.message}
            {...register('startDate')}
          />
          <Input
            type="date"
            label="End Date"
            error={errors.endDate?.message}
            {...register('endDate')}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  );
};
