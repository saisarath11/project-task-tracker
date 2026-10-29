import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { Project } from '../../types';
import { projectsApi } from '../../api/projects';

const updateProjectSchema = z
  .object({
    projectName: z.string().min(1, 'Project name cannot be empty').trim(),
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

type EditProjectFormData = z.infer<typeof updateProjectSchema>;

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onProjectUpdated: () => void;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  onProjectUpdated,
}) => {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditProjectFormData>({
    resolver: zodResolver(updateProjectSchema),
  });

  useEffect(() => {
    if (project) {
      reset({
        projectName: project.projectName,
        description: project.description || '',
        startDate: project.startDate ? project.startDate.split('T')[0] : '',
        endDate: project.endDate ? project.endDate.split('T')[0] : '',
      });
      setServerError(null);
    }
  }, [project, reset]);

  const onSubmit = async (data: EditProjectFormData) => {
    if (!project) return;
    try {
      setServerError(null);
      await projectsApi.updateProject(project.id, {
        projectName: data.projectName,
        description: data.description || null,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
      });

      onProjectUpdated();
      onClose();
    } catch (err: any) {
      setServerError(err.message || 'Failed to update project');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Project Details"
      description="Update project timeline and description"
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
          error={errors.projectName?.message}
          {...register('projectName')}
        />

        <Textarea
          label="Description"
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
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
