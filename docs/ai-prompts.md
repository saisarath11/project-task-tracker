# AI Prompts Document

This document records the prompts used throughout the architecture, design, and implementation of the TaskPulse Project and Task Tracker application.

---

### Category 1: Project Architecture & Monorepo Setup
```text
Design a scalable monorepo structure for an enterprise Jira-like web application.
Stack: React + Vite + TypeScript + Tailwind CSS (frontend) and Node.js + Express + TypeScript + Prisma ORM + PostgreSQL (backend).
Ensure distinct separation of concerns with controllers, services, middleware, validators, schemas, layouts, components, hooks, and tests.
```

---

### Category 2: Relational Database Schema & Prisma
```text
Write a Prisma schema for a project and task tracker with:
- User (id, name, email, passwordHash, role: USER | ADMIN)
- Project (id, projectName, projectKey unique, ownerId, taskCounter, startDate, endDate)
- ProjectMember (projectId, userId, role, unique compound constraint)
- Task (id, taskKey unique, taskNumber, title, description, priority, status, assigneeId, reporterId, dueDate, version for OCC)
- Comment (id, taskId, userId, content, timestamps)
- ActivityLog (id, user, project, task, action, entity, metadata)
- PasswordResetToken (id, token, userId, expiresAt, used)
Include proper relations, onDelete cascades, and indexes.
```

---

### Category 3: Authentication & Security Middleware
```text
Implement an Express authentication controller and middleware:
1. Register with bcrypt password hashing (10 salt rounds) and unique email check.
2. Login validating credentials and returning a JWT token with userId, email, and role.
3. Auth middleware to extract Bearer token, verify signature, and attach user to req.user.
4. Role middleware (requireAdmin) to restrict administrative endpoints.
5. Password reset flow with cryptographic tokens and expiration.
```

---

### Category 4: Business Rules & Access Control (BR-01 through BR-07)
```text
Implement Express controllers and services enforcing:
- BR-01: Only project members or ADMINs can access project details or its tasks.
- BR-02: Only project owners or ADMINs can add/remove members. Project owner cannot be removed.
- BR-03: Tasks can only be assigned to existing members of the same project.
- BR-04: Tasks must move sequentially: TODO -> IN_PROGRESS -> IN_REVIEW -> DONE. Reject TODO -> DONE.
- BR-05: DONE tasks can only be reopened to IN_PROGRESS by project owner or ADMIN.
- BR-06: Overdue dynamically calculated where current date > dueDate and status != DONE.
- BR-07: Only task reporter, project owner, or ADMIN can delete a task.
```

---

### Category 5: Concurrency & Atomic Task Key Generation
```text
1. Implement atomic task key generation (e.g. CRM-1, CRM-2) using a Prisma transaction that increments project.taskCounter.
2. Implement Optimistic Concurrency Control (OCC) for task updates:
   - Accept client expected version.
   - If task.version in DB != expected version, return HTTP 409 Conflict with a readable error message.
   - Increment version on every successful update.
```

---

### Category 6: React Frontend & Kanban Board
```text
Create a modern React Kanban board with:
- Columns: TO DO, IN PROGRESS, IN REVIEW, DONE.
- Task cards displaying Task Key, Priority badge, Title, Assignee avatar, Due Date, and Overdue indicator.
- Status transition action bar enforcing business rules (BR-04 and BR-05).
- Modal for editing task details with optimistic concurrency conflict detection (HTTP 409 alert + Refresh button).
- Threaded comments in chronological order and activity audit history tab.
```

---

### Category 7: Dashboards & Recharts
```text
1. Build a User Dashboard showing summary metric cards, tasks assigned to me, tasks due this week, and overdue tasks.
2. Build an Admin Dashboard with Recharts showing tasks by status, tasks per team member, and a global overdue table.
3. Build a Project Analytics tab showing project status breakdown and member task distribution.
```

---

### Category 8: Vitest & Supertest API Tests
```text
Write a comprehensive test suite using Vitest and Supertest testing:
- Functional cases: registration, login, profile, project creation, member assignment, status transition.
- Negative cases: duplicate email, password < 8, end date before start date, assigning to non-member, unauthorized DONE reopening, skipping status (TODO -> DONE).
- Edge cases: concurrent updates returning 409 Conflict, member removal setting tasks to UNASSIGNED without deleting tasks.
```
