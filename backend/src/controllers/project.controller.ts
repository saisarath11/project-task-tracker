import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { sendSuccess, sendError } from '../utils/response';
import {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
} from '../validators/project.validator';
import { logActivity } from '../services/activity.service';

// Helper: Check if user is project member or admin
export const checkProjectAccess = async (projectId: string, userId: string, role: string) => {
  if (role === 'ADMIN') return true;

  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId, userId },
    },
  });

  return !!membership;
};

// Helper: Check if user is project owner or admin
export const checkProjectOwnerOrAdmin = async (projectId: string, userId: string, role: string) => {
  if (role === 'ADMIN') return true;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });

  return project?.ownerId === userId;
};

export const createProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const validatedData = createProjectSchema.parse(req.body);

    const existingProject = await prisma.project.findUnique({
      where: { projectKey: validatedData.projectKey },
    });

    if (existingProject) {
      sendError(res, `Project key '${validatedData.projectKey}' is already taken`, 409);
      return;
    }

    const project = await prisma.$transaction(async (tx) => {
      const newProj = await tx.project.create({
        data: {
          projectName: validatedData.projectName,
          projectKey: validatedData.projectKey,
          description: validatedData.description || null,
          startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
          endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
          ownerId: userId,
        },
      });

      // Creator automatically becomes a member
      await tx.projectMember.create({
        data: {
          projectId: newProj.id,
          userId: userId,
          role: 'OWNER',
        },
      });

      return newProj;
    });

    await logActivity({
      userId,
      projectId: project.id,
      action: 'PROJECT_CREATED',
      entity: 'PROJECT',
      entityId: project.id,
      metadata: { projectName: project.projectName, projectKey: project.projectKey },
    });

    sendSuccess(res, project, 201);
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;
    const search = req.query.search as string;

    const whereClause: any = {};

    if (role !== 'ADMIN') {
      whereClause.members = {
        some: { userId },
      };
    }

    if (search && search.trim() !== '') {
      whereClause.OR = [
        { projectName: { contains: search, mode: 'insensitive' } },
        { projectKey: { contains: search, mode: 'insensitive' } },
      ];
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: {
            members: true,
            tasks: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, projects);
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const role = req.user!.role;

    const hasAccess = await checkProjectAccess(id, userId, role);
    if (!hasAccess) {
      sendError(res, "You don't have permission to access this project", 403);
      return;
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        _count: {
          select: { tasks: true, members: true },
        },
      },
    });

    if (!project) {
      sendError(res, 'Project not found', 404);
      return;
    }

    sendSuccess(res, project);
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const role = req.user!.role;

    const isAuthorized = await checkProjectOwnerOrAdmin(id, userId, role);
    if (!isAuthorized) {
      sendError(res, 'Only the project owner or an administrator can edit this project', 403);
      return;
    }

    const validatedData = updateProjectSchema.parse(req.body);

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        ...(validatedData.projectName ? { projectName: validatedData.projectName } : {}),
        description: validatedData.description !== undefined ? validatedData.description : undefined,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
      },
    });

    await logActivity({
      userId,
      projectId: id,
      action: 'PROJECT_UPDATED',
      entity: 'PROJECT',
      entityId: id,
      metadata: validatedData,
    });

    sendSuccess(res, updatedProject);
  } catch (error) {
    next(error);
  }
};

export const getProjectMembers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const role = req.user!.role;

    const hasAccess = await checkProjectAccess(id, userId, role);
    if (!hasAccess) {
      sendError(res, "You don't have permission to view members of this project", 403);
      return;
    }

    const members = await prisma.projectMember.findMany({
      where: { projectId: id },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    sendSuccess(res, members);
  } catch (error) {
    next(error);
  }
};

export const addProjectMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const role = req.user!.role;

    const isAuthorized = await checkProjectOwnerOrAdmin(id, userId, role);
    if (!isAuthorized) {
      sendError(res, 'Only the project owner or an administrator can add project members', 403);
      return;
    }

    const { email } = addMemberSchema.parse(req.body);

    const userToAdd = await prisma.user.findUnique({
      where: { email },
    });

    if (!userToAdd) {
      sendError(res, 'No user found with the provided email address', 404);
      return;
    }

    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId: id, userId: userToAdd.id },
      },
    });

    if (existingMember) {
      sendError(res, 'User is already a member of this project', 409);
      return;
    }

    const newMember = await prisma.projectMember.create({
      data: {
        projectId: id,
        userId: userToAdd.id,
        role: 'MEMBER',
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    await logActivity({
      userId,
      projectId: id,
      action: 'MEMBER_ADDED',
      entity: 'MEMBER',
      entityId: userToAdd.id,
      metadata: { addedUserEmail: userToAdd.email, addedUserName: userToAdd.name },
    });

    sendSuccess(res, newMember, 201);
  } catch (error) {
    next(error);
  }
};

export const removeProjectMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, userId: targetUserId } = req.params;
    const userId = req.user!.id;
    const role = req.user!.role;

    const isAuthorized = await checkProjectOwnerOrAdmin(id, userId, role);
    if (!isAuthorized) {
      sendError(res, 'Only the project owner or an administrator can remove project members', 403);
      return;
    }

    const project = await prisma.project.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!project) {
      sendError(res, 'Project not found', 404);
      return;
    }

    if (project.ownerId === targetUserId) {
      sendError(res, 'The project owner cannot be removed from the project', 400);
      return;
    }

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId: id, userId: targetUserId },
      },
    });

    if (!membership) {
      sendError(res, 'User is not a member of this project', 404);
      return;
    }

    // Unassign tasks assigned to this user in this project (Ambiguity 3)
    const [unassignResult] = await prisma.$transaction([
      prisma.task.updateMany({
        where: {
          projectId: id,
          assigneeId: targetUserId,
        },
        data: {
          assigneeId: null,
        },
      }),
      prisma.projectMember.delete({
        where: {
          projectId_userId: { projectId: id, userId: targetUserId },
        },
      }),
    ]);

    await logActivity({
      userId,
      projectId: id,
      action: 'MEMBER_REMOVED',
      entity: 'MEMBER',
      entityId: targetUserId,
      metadata: { unassignedTasksCount: unassignResult.count },
    });

    sendSuccess(res, {
      message: 'Member removed successfully.',
      unassignedTasksCount: unassignResult.count,
    });
  } catch (error) {
    next(error);
  }
};
