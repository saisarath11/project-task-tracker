import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { checkProjectAccess } from './project.controller';

export const getUserDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const now = new Date();
    
    // Start of today
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // End of this week (Sunday 23:59:59)
    const endOfWeek = new Date(now);
    const dayOfWeek = now.getDay();
    const daysUntilSunday = (7 - dayOfWeek) % 7;
    endOfWeek.setDate(now.getDate() + daysUntilSunday);
    endOfWeek.setHours(23, 59, 59, 999);

    const [assignedTasks, totalAssignedCount, completedCount] = await Promise.all([
      prisma.task.findMany({
        where: { assigneeId: userId },
        include: {
          project: {
            select: { id: true, projectName: true, projectKey: true },
          },
          reporter: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      }),
      prisma.task.count({
        where: { assigneeId: userId },
      }),
      prisma.task.count({
        where: { assigneeId: userId, status: 'DONE' },
      }),
    ]);

    // Calculate overdue: current date > dueDate and status != DONE (BR-06)
    const overdueTasks = assignedTasks.filter(
      (task) => task.dueDate && new Date(task.dueDate) < startOfToday && task.status !== 'DONE'
    );

    // Due this week: dueDate between startOfToday and endOfWeek and status != DONE
    const dueThisWeekTasks = assignedTasks.filter(
      (task) =>
        task.dueDate &&
        new Date(task.dueDate) >= startOfToday &&
        new Date(task.dueDate) <= endOfWeek &&
        task.status !== 'DONE'
    );

    sendSuccess(res, {
      summary: {
        totalTasks: totalAssignedCount,
        completedTasks: completedCount,
        dueThisWeekCount: dueThisWeekTasks.length,
        overdueCount: overdueTasks.length,
      },
      myTasks: assignedTasks,
      dueThisWeek: dueThisWeekTasks,
      overdue: overdueTasks,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const role = req.user!.role;
    if (role !== 'ADMIN') {
      sendError(res, 'Access denied. Administrator privileges required.', 403);
      return;
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [totalProjects, totalUsers, totalTasks, statusGroups, overdueTasks, usersWithTaskCounts] =
      await Promise.all([
        prisma.project.count(),
        prisma.user.count(),
        prisma.task.count(),
        prisma.task.groupBy({
          by: ['status'],
          _count: { _all: true },
        }),
        prisma.task.findMany({
          where: {
            dueDate: { lt: startOfToday },
            status: { not: 'DONE' },
          },
          include: {
            project: { select: { id: true, projectName: true, projectKey: true } },
            assignee: { select: { id: true, name: true, email: true } },
          },
          orderBy: { dueDate: 'asc' },
          take: 10,
        }),
        prisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            _count: {
              select: { assignedTasks: true },
            },
          },
          orderBy: {
            assignedTasks: { _count: 'desc' },
          },
          take: 10,
        }),
      ]);

    const statusCounts = {
      TODO: 0,
      IN_PROGRESS: 0,
      IN_REVIEW: 0,
      DONE: 0,
    };

    statusGroups.forEach((group) => {
      if (group.status in statusCounts) {
        statusCounts[group.status] = group._count._all;
      }
    });

    sendSuccess(res, {
      summary: {
        totalProjects,
        totalUsers,
        totalTasks,
        overdueCount: overdueTasks.length,
      },
      statusDistribution: Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
      })),
      tasksPerMember: usersWithTaskCounts.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        taskCount: u._count.assignedTasks,
      })),
      overdueTasks,
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const role = req.user!.role;

    const hasAccess = await checkProjectAccess(id, userId, role);
    if (!hasAccess) {
      sendError(res, "You don't have permission to access this project's dashboard", 403);
      return;
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [project, tasks, statusGroups, members] = await Promise.all([
      prisma.project.findUnique({
        where: { id },
        select: { id: true, projectName: true, projectKey: true, ownerId: true },
      }),
      prisma.task.findMany({
        where: { projectId: id },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.task.groupBy({
        by: ['status'],
        where: { projectId: id },
        _count: { _all: true },
      }),
      prisma.projectMember.findMany({
        where: { projectId: id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              assignedTasks: {
                where: { projectId: id },
                select: { id: true },
              },
            },
          },
        },
      }),
    ]);

    if (!project) {
      sendError(res, 'Project not found', 404);
      return;
    }

    const statusCounts = {
      TODO: 0,
      IN_PROGRESS: 0,
      IN_REVIEW: 0,
      DONE: 0,
    };

    statusGroups.forEach((group) => {
      if (group.status in statusCounts) {
        statusCounts[group.status] = group._count._all;
      }
    });

    const overdueTasks = tasks.filter(
      (task) => task.dueDate && new Date(task.dueDate) < startOfToday && task.status !== 'DONE'
    );

    const tasksPerMember = members.map((m) => ({
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      taskCount: m.user.assignedTasks.length,
    }));

    sendSuccess(res, {
      project,
      summary: {
        totalTasks: tasks.length,
        completedTasks: statusCounts.DONE,
        overdueCount: overdueTasks.length,
        memberCount: members.length,
      },
      statusDistribution: Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
      })),
      tasksPerMember,
      overdueTasks,
    });
  } catch (error) {
    next(error);
  }
};
