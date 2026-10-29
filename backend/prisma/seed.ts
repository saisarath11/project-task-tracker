import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding TaskPulse database...');

  // Clean existing data
  await prisma.activityLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const commonPasswordHash = await bcrypt.hash('Password123!', salt);

  // 1. Create Users
  const adminUser = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@taskpulse.io',
      passwordHash: commonPasswordHash,
      role: 'ADMIN',
    },
  });

  const sarahUser = await prisma.user.create({
    data: {
      name: 'Sarah Connor',
      email: 'sarah@taskpulse.io',
      passwordHash: commonPasswordHash,
      role: 'USER',
    },
  });

  const johnUser = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@taskpulse.io',
      passwordHash: commonPasswordHash,
      role: 'USER',
    },
  });

  const emilyUser = await prisma.user.create({
    data: {
      name: 'Emily Davis',
      email: 'emily@taskpulse.io',
      passwordHash: commonPasswordHash,
      role: 'USER',
    },
  });

  const alexUser = await prisma.user.create({
    data: {
      name: 'Alex Rivera',
      email: 'alex@taskpulse.io',
      passwordHash: commonPasswordHash,
      role: 'USER',
    },
  });

  console.log('Created Users:', [adminUser.email, sarahUser.email, johnUser.email, emilyUser.email, alexUser.email]);

  // 2. Create Projects
  const now = new Date();
  const pastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 1);

  // Project 1: CRM (Owned by Sarah)
  const crmProject = await prisma.project.create({
    data: {
      projectName: 'Enterprise CRM Suite',
      projectKey: 'CRM',
      description: 'Customer Relationship Management web portal and pipeline analytics.',
      ownerId: sarahUser.id,
      taskCounter: 4,
      startDate: pastMonth,
      endDate: nextMonth,
    },
  });

  // Project 2: AI Assistant (Owned by John)
  const aiProject = await prisma.project.create({
    data: {
      projectName: 'AI Copilot Engine',
      projectKey: 'AI',
      description: 'Generative AI search and contextual recommendations platform.',
      ownerId: johnUser.id,
      taskCounter: 3,
      startDate: pastMonth,
      endDate: nextMonth,
    },
  });

  // Project 3: Library Platform (Owned by Admin)
  const libProject = await prisma.project.create({
    data: {
      projectName: 'Digital Library Services',
      projectKey: 'LIB',
      description: 'Open access academic library indexing and metadata service.',
      ownerId: adminUser.id,
      taskCounter: 2,
      startDate: pastMonth,
      endDate: nextMonth,
    },
  });

  // 3. Add Project Members
  // CRM Members: Sarah (Owner), John, Emily
  await prisma.projectMember.createMany({
    data: [
      { projectId: crmProject.id, userId: sarahUser.id, role: 'OWNER' },
      { projectId: crmProject.id, userId: johnUser.id, role: 'MEMBER' },
      { projectId: crmProject.id, userId: emilyUser.id, role: 'MEMBER' },
    ],
  });

  // AI Members: John (Owner), Sarah, Alex
  await prisma.projectMember.createMany({
    data: [
      { projectId: aiProject.id, userId: johnUser.id, role: 'OWNER' },
      { projectId: aiProject.id, userId: sarahUser.id, role: 'MEMBER' },
      { projectId: aiProject.id, userId: alexUser.id, role: 'MEMBER' },
    ],
  });

  // LIB Members: Admin (Owner), Emily
  await prisma.projectMember.createMany({
    data: [
      { projectId: libProject.id, userId: adminUser.id, role: 'OWNER' },
      { projectId: libProject.id, userId: emilyUser.id, role: 'MEMBER' },
    ],
  });

  // 4. Create Tasks
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // CRM-1 (OVERDUE: past due date + IN_PROGRESS)
  const crm1 = await prisma.task.create({
    data: {
      taskKey: 'CRM-1',
      taskNumber: 1,
      projectId: crmProject.id,
      title: 'Implement OAuth2 single sign-on with Google Workspace',
      description: 'Configure corporate SSO redirect URIs and scopes for all enterprise clients.',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      assigneeId: johnUser.id,
      reporterId: sarahUser.id,
      dueDate: fiveDaysAgo,
      version: 1,
    },
  });

  // CRM-2 (TODO)
  const crm2 = await prisma.task.create({
    data: {
      taskKey: 'CRM-2',
      taskNumber: 2,
      projectId: crmProject.id,
      title: 'Design contact pipeline Kanban stage transitions',
      description: 'Allow sales leads to move through Prospect, Qualified, Proposal, and Won/Lost.',
      priority: 'MEDIUM',
      status: 'TODO',
      assigneeId: emilyUser.id,
      reporterId: sarahUser.id,
      dueDate: tomorrow,
      version: 1,
    },
  });

  // CRM-3 (IN_REVIEW)
  const crm3 = await prisma.task.create({
    data: {
      taskKey: 'CRM-3',
      taskNumber: 3,
      projectId: crmProject.id,
      title: 'Customer CSV bulk import wizard with data validation',
      description: 'Sanitize emails, phone numbers, and address formats before batch insertion.',
      priority: 'MEDIUM',
      status: 'IN_REVIEW',
      assigneeId: sarahUser.id,
      reporterId: johnUser.id,
      dueDate: nextWeek,
      version: 1,
    },
  });

  // CRM-4 (DONE)
  const crm4 = await prisma.task.create({
    data: {
      taskKey: 'CRM-4',
      taskNumber: 4,
      projectId: crmProject.id,
      title: 'Setup PostgreSQL connection pooling and health metrics',
      description: 'Deploy pgBouncer and configure Prometheus scraping metrics.',
      priority: 'LOW',
      status: 'DONE',
      assigneeId: johnUser.id,
      reporterId: sarahUser.id,
      dueDate: yesterday,
      version: 1,
    },
  });

  // AI-1 (OVERDUE: past due date + TODO)
  const ai1 = await prisma.task.create({
    data: {
      taskKey: 'AI-1',
      taskNumber: 1,
      projectId: aiProject.id,
      title: 'Benchmark vector embedding search latency across index sizes',
      description: 'Evaluate pgvector cosine distance vs HNSW indexing speed.',
      priority: 'HIGH',
      status: 'TODO',
      assigneeId: alexUser.id,
      reporterId: johnUser.id,
      dueDate: yesterday,
      version: 1,
    },
  });

  // AI-2 (IN_PROGRESS)
  const ai2 = await prisma.task.create({
    data: {
      taskKey: 'AI-2',
      taskNumber: 2,
      projectId: aiProject.id,
      title: 'Stream token response chunks to client via SSE',
      description: 'Support real-time typewriter effect in the chat dialogue window.',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      assigneeId: sarahUser.id,
      reporterId: johnUser.id,
      dueDate: tomorrow,
      version: 1,
    },
  });

  // AI-3 (DONE)
  const ai3 = await prisma.task.create({
    data: {
      taskKey: 'AI-3',
      taskNumber: 3,
      projectId: aiProject.id,
      title: 'Prompt sanitization and guardrail filters against prompt injection',
      description: 'Implement input validation filters and token budget rate limiter.',
      priority: 'HIGH',
      status: 'DONE',
      assigneeId: johnUser.id,
      reporterId: alexUser.id,
      dueDate: fiveDaysAgo,
      version: 1,
    },
  });

  // LIB-1 (TODO)
  const lib1 = await prisma.task.create({
    data: {
      taskKey: 'LIB-1',
      taskNumber: 1,
      projectId: libProject.id,
      title: 'Index ISBN metadata from OpenLibrary API',
      description: 'Sync book covers, author biographical details, and catalog publication dates.',
      priority: 'LOW',
      status: 'TODO',
      assigneeId: emilyUser.id,
      reporterId: adminUser.id,
      dueDate: nextWeek,
      version: 1,
    },
  });

  // 5. Add Comments
  await prisma.comment.createMany({
    data: [
      {
        taskId: crm1.id,
        userId: sarahUser.id,
        content: 'Please ensure we handle refresh token rotation according to RFC 6749.',
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        taskId: crm1.id,
        userId: johnUser.id,
        content: 'Working on this now! The token exchange endpoint is operational in the dev cluster.',
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        taskId: crm3.id,
        userId: emilyUser.id,
        content: 'I verified the sample CSV with 10,000 records. Performance is under 800ms.',
        createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      },
    ],
  });

  // 6. Add Activity Logs
  await prisma.activityLog.createMany({
    data: [
      {
        userId: sarahUser.id,
        projectId: crmProject.id,
        action: 'PROJECT_CREATED',
        entity: 'PROJECT',
        entityId: crmProject.id,
        metadata: JSON.stringify({ projectName: 'Enterprise CRM Suite' }),
      },
      {
        userId: sarahUser.id,
        projectId: crmProject.id,
        taskId: crm1.id,
        action: 'TASK_CREATED',
        entity: 'TASK',
        entityId: crm1.id,
        metadata: JSON.stringify({ taskKey: 'CRM-1', title: crm1.title }),
      },
      {
        userId: johnUser.id,
        projectId: crmProject.id,
        taskId: crm1.id,
        action: 'STATUS_CHANGED',
        entity: 'TASK',
        entityId: crm1.id,
        metadata: JSON.stringify({ from: 'TODO', to: 'IN_PROGRESS' }),
      },
    ],
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
