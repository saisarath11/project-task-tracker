import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/utils/prisma';
import bcrypt from 'bcryptjs';
import { generateToken } from '../src/utils/jwt';

// Mock Prisma
vi.mock('../src/utils/prisma', () => {
  return {
    default: {
      user: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
      project: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
      projectMember: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        createMany: vi.fn(),
        delete: vi.fn(),
      },
      task: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
        groupBy: vi.fn(),
      },
      comment: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      activityLog: {
        create: vi.fn(),
      },
      passwordResetToken: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      $transaction: vi.fn((fnOrArray) => {
        if (typeof fnOrArray === 'function') {
          return fnOrArray(prisma);
        }
        return Promise.all(fnOrArray);
      }),
    },
    prisma: {
      user: {},
      project: {},
      projectMember: {},
      task: {},
    },
  };
});

describe('TaskPulse Full Stack API Test Suite', () => {
  const mockUser = {
    id: 'user-123',
    name: 'Sarah Connor',
    email: 'sarah@taskpulse.io',
    role: 'USER' as const,
    passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
  };

  const mockAdmin = {
    id: 'admin-999',
    name: 'Admin User',
    email: 'admin@taskpulse.io',
    role: 'ADMIN' as const,
    passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
  };

  const userToken = generateToken({
    userId: mockUser.id,
    email: mockUser.email,
    role: mockUser.role,
  });

  const adminToken = generateToken({
    userId: mockAdmin.id,
    email: mockAdmin.email,
    role: mockAdmin.role,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================================
  // 1. AUTHENTICATION & USER MANAGEMENT
  // ========================================================
  describe('Authentication & User Management', () => {
    it('Functional: registers new user with valid details', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);
      (prisma.user.create as any).mockResolvedValue({
        id: 'new-user',
        name: 'New Dev',
        email: 'dev@test.io',
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app).post('/api/auth/register').send({
        name: 'New Dev',
        email: 'dev@test.io',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('dev@test.io');
      expect(res.body.data.token).toBeDefined();
    });

    it('Negative: rejects registration with duplicate email', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      const res = await request(app).post('/api/auth/register').send({
        name: 'Duplicate Sarah',
        email: 'sarah@taskpulse.io',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });

    it('Negative: rejects registration with password under 8 characters', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Short Pass',
        email: 'short@test.io',
        password: 'pass',
        confirmPassword: 'pass',
      });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('Negative: rejects registration with mismatched password confirmation', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Mismatch',
        email: 'mismatch@test.io',
        password: 'Password123!',
        confirmPassword: 'DifferentPass123!',
      });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('Functional: successfully logs in user with correct credentials', async () => {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('Secret123!', salt);
      (prisma.user.findUnique as any).mockResolvedValue({
        ...mockUser,
        passwordHash: hash,
      });

      const res = await request(app).post('/api/auth/login').send({
        email: 'sarah@taskpulse.io',
        password: 'Secret123!',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it('Negative: rejects login with invalid password', async () => {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('Secret123!', salt);
      (prisma.user.findUnique as any).mockResolvedValue({
        ...mockUser,
        passwordHash: hash,
      });

      const res = await request(app).post('/api/auth/login').send({
        email: 'sarah@taskpulse.io',
        password: 'WrongPassword!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('Functional: generates dev reset token for forgotten password', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (prisma.passwordResetToken.create as any).mockResolvedValue({
        id: 'token-1',
        token: 'dev-reset-12345',
        expiresAt: new Date(Date.now() + 3600000),
      });

      const res = await request(app).post('/api/auth/forgot-password').send({
        email: 'sarah@taskpulse.io',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.devResetToken).toBeDefined();
    });
  });

  // ========================================================
  // 2. PROJECT MANAGEMENT & ACCESS CONTROL (BR-01, BR-02)
  // ========================================================
  describe('Project Management & Authorization', () => {
    beforeEach(() => {
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
    });

    it('Functional: creates a project and automatically sets creator as owner & member', async () => {
      (prisma.project.findUnique as any).mockResolvedValue(null);
      (prisma.project.create as any).mockResolvedValue({
        id: 'proj-1',
        projectName: 'Enterprise CRM',
        projectKey: 'CRM',
        ownerId: mockUser.id,
      });
      (prisma.projectMember.create as any).mockResolvedValue({
        id: 'mem-1',
        projectId: 'proj-1',
        userId: mockUser.id,
        role: 'OWNER',
      });

      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          projectName: 'Enterprise CRM',
          projectKey: 'CRM',
          description: 'CRM Suite',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.projectKey).toBe('CRM');
    });

    it('Negative: rejects project with duplicate projectKey', async () => {
      (prisma.project.findUnique as any).mockResolvedValue({
        id: 'proj-existing',
        projectKey: 'CRM',
      });

      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          projectName: 'Another CRM',
          projectKey: 'CRM',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already taken');
    });

    it('Negative: rejects project where endDate is earlier than startDate', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          projectName: 'Invalid Timeline Project',
          projectKey: 'TIME',
          startDate: '2026-12-01',
          endDate: '2026-11-01',
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('BR-01: forbids non-member from viewing project details (HTTP 403)', async () => {
      (prisma.projectMember.findUnique as any).mockResolvedValue(null);

      const res = await request(app)
        .get('/api/projects/proj-forbidden')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("don't have permission");
    });

    it('BR-02: prevents project owner from being removed from project', async () => {
      (prisma.project.findUnique as any).mockResolvedValue({
        id: 'proj-1',
        ownerId: mockUser.id,
      });

      const res = await request(app)
        .delete(`/api/projects/proj-1/members/${mockUser.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('project owner cannot be removed');
    });

    it('Ambiguity 3: unassigns member tasks when member is removed', async () => {
      const targetUserId = 'target-user-456';
      (prisma.project.findUnique as any).mockResolvedValue({
        id: 'proj-1',
        ownerId: mockUser.id,
      });
      (prisma.projectMember.findUnique as any).mockResolvedValue({
        id: 'pm-1',
        projectId: 'proj-1',
        userId: targetUserId,
      });
      (prisma.task.updateMany as any).mockResolvedValue({ count: 3 });
      (prisma.projectMember.delete as any).mockResolvedValue({});

      const res = await request(app)
        .delete(`/api/projects/proj-1/members/${targetUserId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.unassignedTasksCount).toBe(3);
    });
  });

  // ========================================================
  // 3. TASK MANAGEMENT & STATUS RULES (BR-04, BR-05, BR-07)
  // ========================================================
  describe('Task Management & Transitions', () => {
    beforeEach(() => {
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
    });

    it('Negative: rejects assigning task to someone who is not a project member', async () => {
      (prisma.projectMember.findUnique as any)
        .mockResolvedValueOnce({ id: 'pm-caller' }) // caller membership
        .mockResolvedValueOnce(null); // assignee membership -> not found!

      const res = await request(app)
        .post('/api/projects/proj-1/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Non-member assignment task',
          assigneeId: 'stranger-user',
          priority: 'MEDIUM',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Task can only be assigned to a project member');
    });

    it('BR-04: rejects invalid status jump from TODO directly to DONE', async () => {
      (prisma.projectMember.findUnique as any).mockResolvedValue({ id: 'pm-1' });
      (prisma.task.findUnique as any).mockResolvedValue({
        id: 'task-1',
        projectId: 'proj-1',
        status: 'TODO',
        version: 1,
        project: { id: 'proj-1', ownerId: 'other-owner' },
      });

      const res = await request(app)
        .patch('/api/tasks/task-1/status')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          status: 'DONE',
          version: 1,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid status transition');
    });

    it('BR-04: allows sequential status progression TODO -> IN_PROGRESS', async () => {
      (prisma.projectMember.findUnique as any).mockResolvedValue({ id: 'pm-1' });
      (prisma.task.findUnique as any).mockResolvedValue({
        id: 'task-1',
        projectId: 'proj-1',
        status: 'TODO',
        version: 1,
        project: { id: 'proj-1', ownerId: mockUser.id },
      });
      (prisma.task.update as any).mockResolvedValue({
        id: 'task-1',
        status: 'IN_PROGRESS',
        version: 2,
      });

      const res = await request(app)
        .patch('/api/tasks/task-1/status')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          status: 'IN_PROGRESS',
          version: 1,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('IN_PROGRESS');
    });

    it('BR-05: prevents normal member from reopening a DONE task', async () => {
      (prisma.projectMember.findUnique as any).mockResolvedValue({ id: 'pm-1' });
      (prisma.project.findUnique as any).mockResolvedValue({ ownerId: 'other-user-999' });
      (prisma.task.findUnique as any).mockResolvedValue({
        id: 'task-1',
        projectId: 'proj-1',
        status: 'DONE',
        version: 1,
        project: { id: 'proj-1', ownerId: 'other-user-999' },
      });

      const res = await request(app)
        .patch('/api/tasks/task-1/status')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          status: 'IN_PROGRESS',
          version: 1,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('reopened only by the project owner or an administrator');
    });

    it('BR-05: allows project owner to reopen a DONE task', async () => {
      (prisma.projectMember.findUnique as any).mockResolvedValue({ id: 'pm-1' });
      (prisma.project.findUnique as any).mockResolvedValue({ ownerId: mockUser.id });
      (prisma.task.findUnique as any).mockResolvedValue({
        id: 'task-1',
        projectId: 'proj-1',
        status: 'DONE',
        version: 1,
        project: { id: 'proj-1', ownerId: mockUser.id },
      });
      (prisma.task.update as any).mockResolvedValue({
        id: 'task-1',
        status: 'IN_PROGRESS',
        version: 2,
      });

      const res = await request(app)
        .patch('/api/tasks/task-1/status')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          status: 'IN_PROGRESS',
          version: 1,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('IN_PROGRESS');
    });

    it('Concurrency (Edge 1): rejects update when version does not match (HTTP 409 Conflict)', async () => {
      (prisma.projectMember.findUnique as any).mockResolvedValue({ id: 'pm-1' });
      (prisma.task.findUnique as any).mockResolvedValue({
        id: 'task-1',
        projectId: 'proj-1',
        title: 'Original Title',
        version: 2, // Task in DB was already updated to v2
        project: { id: 'proj-1', ownerId: mockUser.id },
      });

      const res = await request(app)
        .patch('/api/tasks/task-1')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Stale Update',
          version: 1, // Client sent stale version 1
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('updated by another user');
    });

    it('BR-07: prevents unauthorized member from deleting someone else task', async () => {
      (prisma.task.findUnique as any).mockResolvedValue({
        id: 'task-1',
        projectId: 'proj-1',
        reporterId: 'reporter-bob',
        project: { id: 'proj-1', ownerId: 'owner-alice' },
      });

      const res = await request(app)
        .delete('/api/tasks/task-1')
        .set('Authorization', `Bearer ${userToken}`); // sarah is neither reporter nor owner nor admin

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Only the task reporter, project owner, or an administrator can delete');
    });
  });
});
