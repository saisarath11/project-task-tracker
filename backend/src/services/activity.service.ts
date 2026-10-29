import prisma from '../utils/prisma';

export interface LogActivityParams {
  userId: string;
  projectId?: string;
  taskId?: string;
  action: string;
  entity: 'PROJECT' | 'TASK' | 'MEMBER' | 'COMMENT';
  entityId: string;
  metadata?: Record<string, any>;
}

export const logActivity = async (params: LogActivityParams) => {
  try {
    return await prisma.activityLog.create({
      data: {
        userId: params.userId,
        projectId: params.projectId,
        taskId: params.taskId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });
  } catch (error) {
    console.error('Failed to record activity log:', error);
    // Non-blocking for primary operations
    return null;
  }
};
