import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { sendSuccess, sendError } from '../utils/response';
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  createCommentSchema,
} from '../validators/task.validator';
import { checkProjectAccess, checkProjectOwnerOrAdmin } from './project.controller';
import { logActivity } from '../services/activity.service';

export const getTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.id;
    const role = req.user!.role;

    const hasAccess = await checkProjectAccess(projectId, userId, role);
    if (!hasAccess) {
      sendError(res, "You don't have permission to access this project's tasks", 403);
      return;
    }

    const { search, status, priority, assignee } = req.query;

    const whereClause: any = { projectId };

    if (status && typeof status === 'string' && status !== 'ALL') {
      whereClause.status = status;
    }

    if (priority && typeof priority === 'string' && priority !== 'ALL') {
      whereClause.priority = priority;
    }

    if (assignee && typeof assignee === 'string' && assignee !== 'ALL') {
      if (assignee === 'UNASSIGNED') {
        whereClause.assigneeId = null;
      } else {
        whereClause.assigneeId = assignee;
      }
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      whereClause.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { taskKey: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        reporter: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { comments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, tasks);
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const role = req.user!.role;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, projectName: true, projectKey: true, ownerId: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
        reporter: {
          select: { id: true, name: true, email: true },
        },
        comments: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        activityLogs: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!task) {
      sendError(res, 'Task not found', 404);
      return;
    }

    const hasAccess = await checkProjectAccess(task.projectId, userId, role);
    if (!hasAccess) {
      sendError(res, "You don't have permission to view this task", 403);
      return;
    }

    sendSuccess(res, task);
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.id;
    const role = req.user!.role;

    const hasAccess = await checkProjectAccess(projectId, userId, role);
    if (!hasAccess) {
      sendError(res, "You don't have permission to create tasks in this project", 403);
      return;
    }

    const validatedData = createTaskSchema.parse(req.body);

    // If assignee provided, verify assignee is a current project member (Ambiguity 2 & BR-01)
    if (validatedData.assigneeId) {
      const isAssigneeMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: { projectId, userId: validatedData.assigneeId },
        },
      });

      if (!isAssigneeMember) {
        sendError(res, 'Task can only be assigned to a project member', 400);
        return;
      }
    }

    // Atomic transaction: increment project task counter & generate unique taskKey
    const task = await prisma.$transaction(async (tx) => {
      const project = await tx.project.update({
        where: { id: projectId },
        data: { taskCounter: { increment: 1 } },
        select: { projectKey: true, taskCounter: true },
      });

      const taskKey = `${project.projectKey}-${project.taskCounter}`;

      const newTask = await tx.task.create({
        data: {
          taskKey,
          taskNumber: project.taskCounter,
          projectId,
          title: validatedData.title,
          description: validatedData.description || null,
          priority: validatedData.priority as any,
          status: 'TODO',
          assigneeId: validatedData.assigneeId || null,
          reporterId: userId,
          dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
          version: 1,
        },
        include: {
          assignee: {
            select: { id: true, name: true, email: true },
          },
          reporter: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return newTask;
    });

    await logActivity({
      userId,
      projectId,
      taskId: task.id,
      action: 'TASK_CREATED',
      entity: 'TASK',
      entityId: task.id,
      metadata: { taskKey: task.taskKey, title: task.title },
    });

    sendSuccess(res, task, 201);
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const role = req.user!.role;

    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existingTask) {
      sendError(res, 'Task not found', 404);
      return;
    }

    const hasAccess = await checkProjectAccess(existingTask.projectId, userId, role);
    if (!hasAccess) {
      sendError(res, "You don't have permission to update this task", 403);
      return;
    }

    const validatedData = updateTaskSchema.parse(req.body);

    // Optimistic Concurrency Control (BR-Edge 1 / Req 24)
    if (existingTask.version !== validatedData.version) {
      sendError(
        res,
        'This task was updated by another user. Please refresh and try again.',
        409
      );
      return;
    }

    // If assignee changed, verify new assignee is a member
    if (validatedData.assigneeId !== undefined && validatedData.assigneeId !== null) {
      const isMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: { projectId: existingTask.projectId, userId: validatedData.assigneeId },
        },
      });

      if (!isMember) {
        sendError(res, 'Task can only be assigned to a project member', 400);
        return;
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        ...(validatedData.title ? { title: validatedData.title } : {}),
        description: validatedData.description !== undefined ? validatedData.description : undefined,
        priority: validatedData.priority !== undefined ? (validatedData.priority as any) : undefined,
        assigneeId: validatedData.assigneeId !== undefined ? validatedData.assigneeId : undefined,
        dueDate: validatedData.dueDate !== undefined
          ? (validatedData.dueDate ? new Date(validatedData.dueDate) : null)
          : undefined,
        version: { increment: 1 },
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        reporter: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await logActivity({
      userId,
      projectId: existingTask.projectId,
      taskId: id,
      action: 'TASK_UPDATED',
      entity: 'TASK',
      entityId: id,
      metadata: validatedData,
    });

    sendSuccess(res, updatedTask);
  } catch (error) {
    next(error);
  }
};

export const updateTaskStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const role = req.user!.role;

    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existingTask) {
      sendError(res, 'Task not found', 404);
      return;
    }

    const hasAccess = await checkProjectAccess(existingTask.projectId, userId, role);
    if (!hasAccess) {
      sendError(res, "You don't have permission to update this task", 403);
      return;
    }

    const { status: targetStatus, version: clientVersion } = updateTaskStatusSchema.parse(req.body);

    // Optimistic Concurrency Control
    if (existingTask.version !== clientVersion) {
      sendError(
        res,
        'This task was updated by another user. Please refresh and try again.',
        409
      );
      return;
    }

    const currentStatus = existingTask.status;

    // Same status - no-op
    if (currentStatus === targetStatus) {
      sendSuccess(res, existingTask);
      return;
    }

    // Business Rules for Status Transitions:
    // BR-04: TODO -> IN_PROGRESS -> IN_REVIEW -> DONE
    // No skipping (e.g. TODO -> DONE is forbidden)
    // BR-05: DONE -> IN_PROGRESS only allowed by Project Owner OR Admin
    let isTransitionAllowed = false;

    if (currentStatus === 'TODO' && targetStatus === 'IN_PROGRESS') {
      isTransitionAllowed = true;
    } else if (currentStatus === 'IN_PROGRESS' && (targetStatus === 'IN_REVIEW' || targetStatus === 'TODO')) {
      isTransitionAllowed = true;
    } else if (currentStatus === 'IN_REVIEW' && (targetStatus === 'DONE' || targetStatus === 'IN_PROGRESS')) {
      isTransitionAllowed = true;
    } else if (currentStatus === 'DONE') {
      // BR-05: Reopening only allowed by Owner or Admin
      const isOwnerOrAdmin = await checkProjectOwnerOrAdmin(existingTask.projectId, userId, role);
      if (!isOwnerOrAdmin) {
        sendError(
          res,
          'A task marked DONE can be reopened only by the project owner or an administrator.',
          403
        );
        return;
      }

      if (targetStatus === 'IN_PROGRESS') {
        isTransitionAllowed = true;
      } else {
        sendError(res, 'Completed tasks can only be reopened to IN_PROGRESS.', 400);
        return;
      }
    }

    if (!isTransitionAllowed) {
      sendError(
        res,
        `Invalid status transition from ${currentStatus} to ${targetStatus}. Tasks must move sequentially: TODO -> IN_PROGRESS -> IN_REVIEW -> DONE.`,
        400
      );
      return;
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status: targetStatus,
        version: { increment: 1 },
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        reporter: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await logActivity({
      userId,
      projectId: existingTask.projectId,
      taskId: id,
      action: 'STATUS_CHANGED',
      entity: 'TASK',
      entityId: id,
      metadata: { from: currentStatus, to: targetStatus },
    });

    sendSuccess(res, updatedTask);
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const role = req.user!.role;

    const task = await prisma.task.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!task) {
      sendError(res, 'Task not found', 404);
      return;
    }

    // Business Rule BR-07:
    // Only: Task reporter OR Project owner OR ADMIN can delete a task.
    const isReporter = task.reporterId === userId;
    const isProjectOwner = task.project.ownerId === userId;
    const isAdmin = role === 'ADMIN';

    if (!isReporter && !isProjectOwner && !isAdmin) {
      sendError(
        res,
        'Only the task reporter, project owner, or an administrator can delete this task',
        403
      );
      return;
    }

    await prisma.task.delete({
      where: { id },
    });

    await logActivity({
      userId,
      projectId: task.projectId,
      action: 'TASK_DELETED',
      entity: 'TASK',
      entityId: id,
      metadata: { taskKey: task.taskKey, title: task.title },
    });

    sendSuccess(res, { message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const addComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const role = req.user!.role;

    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      sendError(res, 'Task not found', 404);
      return;
    }

    const hasAccess = await checkProjectAccess(task.projectId, userId, role);
    if (!hasAccess) {
      sendError(res, "You don't have permission to comment on this task", 403);
      return;
    }

    const { content } = createCommentSchema.parse(req.body);

    const comment = await prisma.comment.create({
      data: {
        taskId: id,
        userId,
        content,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await logActivity({
      userId,
      projectId: task.projectId,
      taskId: id,
      action: 'COMMENT_ADDED',
      entity: 'COMMENT',
      entityId: comment.id,
      metadata: { commentSnippet: content.slice(0, 50) },
    });

    sendSuccess(res, comment, 201);
  } catch (error) {
    next(error);
  }
};

export const getComments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const role = req.user!.role;

    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      sendError(res, 'Task not found', 404);
      return;
    }

    const hasAccess = await checkProjectAccess(task.projectId, userId, role);
    if (!hasAccess) {
      sendError(res, "You don't have permission to view comments on this task", 403);
      return;
    }

    const comments = await prisma.comment.findMany({
      where: { taskId: id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    sendSuccess(res, comments);
  } catch (error) {
    next(error);
  }
};
