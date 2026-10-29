# TaskPulse — Project & Task Tracker Web Application

TaskPulse is a full-stack, enterprise-grade Jira-like issue tracking and project management platform. Designed for engineering leads and collaborative teams, it enforces strict role-based access control, relational scoping, sequential task lifecycles, optimistic concurrency control, interactive Kanban boards, and analytical reporting dashboards.

---

## Table of Contents
1. [Key Features](#key-features)
2. [Technology Stack](#technology-stack)
3. [Architecture & Design System](#architecture--design-system)
4. [Monorepo Project Structure](#monorepo-project-structure)
5. [Prerequisites](#prerequisites)
6. [Quick Start & Installation](#quick-start--installation)
7. [Database Setup & Prisma Migrations](#database-setup--prisma-migrations)
8. [Database Seeding & Demo Credentials](#database-seeding--demo-credentials)
9. [Running the Application](#running-the-application)
10. [Automated Testing Suite](#automated-testing-suite)
11. [API Endpoints Reference](#api-endpoints-reference)
12. [Business Rules Summary](#business-rules-summary)
13. [Known Limitations](#known-limitations)

---

## 1. Key Features

- **Robust Authentication & Roles**:
  - Secure registration with client and server-side Zod validation.
  - JWT token-based authentication with bcrypt password hashing (10 salt rounds).
  - Role-based authorization (`USER` and `ADMIN`).
  - Development-friendly password reset flow with token expiration.
  - Profile inspection and editing (role tampering strictly prevented).

- **Strict Multi-Project Isolation**:
  - Any authenticated user can create a project and automatically becomes the Owner.
  - Short, uppercase, unique project keys (e.g., `CRM`, `AI`, `LIB`).
  - **BR-01**: Only confirmed project members or system administrators can view project details or collaborate on tasks. Direct URL access (`/projects/:id`) by non-members is rejected with `HTTP 403 Forbidden`.
  - **BR-02**: Only the Project Owner or system `ADMIN` can add or remove members. The Project Owner cannot be removed.
  - **Ambiguity 3 Resolution**: Removing a member automatically unassigns all tasks previously assigned to that member without deleting them.

- **Advanced Task Lifecycle & Validation**:
  - Concurrency-safe, sequential task IDs generated atomically per project (e.g., `CRM-1`, `CRM-2`, `CRM-3`).
  - Strict validations: title required, due dates cannot be in the past on creation, assignees must be current project members.
  - **BR-04 Sequential Transitions**: Tasks move through `TODO` &rarr; `IN_PROGRESS` &rarr; `IN_REVIEW` &rarr; `DONE`. Skipping states (e.g. `TODO` &rarr; `DONE`) is rejected.
  - **BR-05 Completed Task Reopening**: Moving a task from `DONE` back to `IN_PROGRESS` is restricted strictly to the Project Owner or system `ADMIN`.
  - **BR-06 Overdue Evaluation**: Dynamically evaluated based on `current date > dueDate && status != DONE`.
  - **BR-07 Deletion Authority**: Tasks can only be deleted by the Task Reporter, Project Owner, or system `ADMIN`.

- **Optimistic Concurrency Control (OCC)**:
  - Every task tracks an integer `version`. Stale client updates are detected and rejected with `HTTP 409 Conflict`, prompting the user to refresh instead of silently overwriting changes.

- **Kanban Board & Productivity Dashboards**:
  - Kanban board with column breakdowns (`TO DO`, `IN PROGRESS`, `IN REVIEW`, `DONE`).
  - Multi-parameter filtering: instant title search, status filter, priority filter, assignee filter, and one-click reset.
  - Chronological comment threads with author attribution.
  - Activity audit logging on project and task mutations.
  - Personal User Dashboard: My Tasks, Due This Week, Overdue Work items.
  - Admin Dashboard: System-wide analytics with Recharts status distributions, tasks per member charts, and global overdue tables.
  - Project Analytics Tab: Project-specific status breakdowns and member workload balances.

---

## 2. Technology Stack

### Frontend
- **Framework**: React 18 with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Lucide React icons
- **State & Server Cache**: TanStack Query (React Query)
- **Routing**: React Router DOM v6
- **Forms & Validation**: React Hook Form with Zod resolvers
- **Data Visualization**: Recharts

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma ORM
- **Database**: PostgreSQL (Docker-compose configuration included)
- **Authentication**: JSON Web Tokens (JWT) & bcryptjs
- **Validation**: Zod schema validation
- **Architecture**: Controller-Service-Repository pattern with centralized error middleware

### Testing
- **Test Runner**: Vitest
- **HTTP Assertions**: Supertest
- **Mocking**: Vitest mocks for isolated integration testing

---

## 3. Architecture & Design System

TaskPulse follows a strict zero-trust architecture. Frontend checks and hidden buttons exist purely for user convenience; all business rules, authorization boundaries, and state transition rules are validated independently on the backend API:

```
[ Frontend: React + Vite + Tailwind ]
               |
          (REST API / JWT)
               v
[ Backend: Express + TypeScript ]
  ├── Auth Middleware (JWT Verification)
  ├── Project Access Guard (BR-01 Check)
  ├── Owner/Admin Guard (BR-02 / BR-05 Check)
  ├── Zod Request Validators
  ├── Centralized Error Handler (HTTP 400, 401, 403, 404, 409, 422, 500)
  └── Prisma ORM (Atomic Transactions & OCC)
               v
[ Relational PostgreSQL Database ]
```

---

## 4. Monorepo Project Structure

```
project-task-tracker/
│
├── frontend/
│   ├── src/
│   │   ├── api/          # Typed API clients (auth, projects, tasks, dashboard, users)
│   │   ├── components/   # UI components (Kanban, modals, task filters, forms, layout)
│   │   ├── hooks/        # useAuth and custom application hooks
│   │   ├── pages/        # Route pages (Login, Register, Dashboard, Projects, Tasks, Admin)
│   │   ├── types/        # TypeScript interfaces and enum declarations
│   │   ├── utils/        # Date formatting, overdue logic, tailwind class merger (cn)
│   │   ├── App.tsx       # Route definitions with ProtectedRoute & AdminRoute
│   │   └── main.tsx      # QueryClient & AuthProvider root mounts
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── controllers/  # auth, user, project, task, dashboard controllers
│   │   ├── middleware/   # auth token verification, requireAdmin, centralized error handler
│   │   ├── routes/       # Express route definitions
│   │   ├── services/     # Activity audit logging service
│   │   ├── utils/        # Prisma singleton, JWT signing, response helpers
│   │   ├── validators/   # Zod validation schemas
│   │   ├── app.ts        # Express app initialization (exported for testing)
│   │   └── server.ts     # Server port listener
│   ├── prisma/
│   │   ├── schema.prisma # PostgreSQL relational models, enums, and indexes
│   │   └── seed.ts       # Comprehensive evaluation seed data
│   ├── tests/
│   │   └── api.test.ts   # Functional, negative, and edge case API tests
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
│
├── docs/
│   ├── requirements-analysis.md
│   ├── business-rules-and-validations.md
│   ├── assumptions-and-ambiguities.md
│   ├── ai-prompts.md
│   ├── ai-output-review.md
│   ├── test-cases.md
│   └── known-issues-and-limitations.md
│
├── docker-compose.yml     # Standalone PostgreSQL service container
├── .env.example           # Environment template
└── README.md
```

---

## 5. Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm** or **pnpm**
- **Docker & Docker Compose** (for running local PostgreSQL container) OR a locally running PostgreSQL instance (v14+)

---

## 6. Quick Start & Installation

Clone or open the repository root:

```bash
cd project-task-tracker
```

### Install Backend Dependencies:
```bash
cd backend
npm install
```

### Install Frontend Dependencies:
```bash
cd ../frontend
npm install
```

---

## 7. Database Setup & Prisma Migrations

### Option A: Using Docker Compose (Recommended)
From the project root:
```bash
docker-compose up -d
```
This spins up PostgreSQL on `localhost:5432` with user `postgres` and password `postgrespassword`.

### Option B: Local PostgreSQL
Configure your connection string in `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/project_task_tracker?schema=public"
```

### Run Prisma Migration & Generate Client:
```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

---

## 8. Database Seeding & Demo Credentials

Populate the database with pre-configured users, projects (`CRM`, `AI`, `LIB`), tasks in every status, comments, and overdue work items:

```bash
cd backend
npm run prisma:seed
```

### Evaluation Demo Credentials:
All pre-seeded demo accounts use password: **`Password123!`**

| Name | Role | Email | Project Ownership / Context |
|---|:---:|---|---|
| **System Admin** | `ADMIN` | `admin@taskpulse.io` | Global administrative analytics & Digital Library (`LIB`) owner |
| **Sarah Connor** | `USER` | `sarah@taskpulse.io` | Project Owner of Enterprise CRM (`CRM`) |
| **John Doe** | `USER` | `john@taskpulse.io` | Project Owner of AI Copilot (`AI`) & CRM Member |
| **Emily Davis** | `USER` | `emily@taskpulse.io` | CRM Member & LIB Member |
| **Alex Rivera** | `USER` | `alex@taskpulse.io` | AI Copilot Member |

> **Tip**: The login page provides **1-Click Quick Fill** buttons for each demo user!

---

## 9. Running the Application

### 1. Start the Backend API (Port 5000):
```bash
cd backend
npm run dev
```
The API is live at `http://localhost:5000` (Health check: `http://localhost:5000/api/health`).

### 2. Start the Frontend Client (Port 5173):
```bash
cd frontend
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 10. Automated Testing Suite

The application includes automated integration tests covering functional flows, negative validation rejections, access control rules, and edge cases (including optimistic concurrency conflicts and status skipping):

```bash
cd backend
npm test
```

### Running with Vitest UI / Watch Mode:
```bash
cd backend
npx vitest
```

---

## 11. API Endpoints Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new account
- `POST /api/auth/login` — Authenticate and receive JWT
- `POST /api/auth/logout` — Invalidate client session
- `POST /api/auth/forgot-password` — Generate dev password reset token
- `POST /api/auth/reset-password` — Submit new password with token
- `GET /api/auth/me` — Retrieve active authenticated user

### Users (`/api/users`)
- `GET /api/users/me` — View current user profile
- `PATCH /api/users/me` — Update name/email (role change blocked)
- `GET /api/users` — Search users directory

### Projects (`/api/projects`)
- `GET /api/projects` — List user's projects (or all projects if Admin)
- `POST /api/projects` — Create project (creator becomes owner)
- `GET /api/projects/:id` — View project details (BR-01 member check)
- `PATCH /api/projects/:id` — Edit project (BR-02 owner/admin check)
- `GET /api/projects/:id/members` — List project members
- `POST /api/projects/:id/members` — Add member by email (BR-02)
- `DELETE /api/projects/:id/members/:userId` — Remove member & unassign tasks (BR-02 & Ambiguity 3)
- `GET /api/projects/:id/dashboard` — Project-specific analytics

### Tasks (`/api/tasks` & `/api/projects/:projectId/tasks`)
- `GET /api/projects/:projectId/tasks` — List tasks with query filters (`search`, `status`, `priority`, `assignee`)
- `POST /api/projects/:projectId/tasks` — Create task with atomic sequential key (`KEY-1`)
- `GET /api/tasks/:id` — View task details, comments, and activity audit log
- `PATCH /api/tasks/:id` — Edit task details with optimistic concurrency check (`version`)
- `PATCH /api/tasks/:id/status` — Sequential status progression (BR-04) and reopening guard (BR-05)
- `DELETE /api/tasks/:id` — Delete task (BR-07: reporter, owner, or admin)
- `GET /api/tasks/:id/comments` — List comments in chronological order
- `POST /api/tasks/:id/comments` — Add comment to task

### Dashboards (`/api/dashboard`)
- `GET /api/dashboard/me` — Authenticated user personal dashboard
- `GET /api/dashboard/admin` — System administrator analytics (Admin only)

---

## 12. Business Rules Summary

- **BR-01**: Access is restricted to confirmed project members or administrators.
- **BR-02**: Member management is exclusive to Project Owners and administrators. Project Owners cannot be removed.
- **BR-03**: Tasks can only be assigned to members of the parent project.
- **BR-04**: Task statuses progress strictly: `TODO` &rarr; `IN_PROGRESS` &rarr; `IN_REVIEW` &rarr; `DONE`. Skipping stages (e.g. `TODO` &rarr; `DONE`) is rejected.
- **BR-05**: Tasks marked `DONE` can only be reopened (`DONE` &rarr; `IN_PROGRESS`) by the Project Owner or an administrator.
- **BR-06**: Overdue is dynamically computed: `now > dueDate && status != DONE`.
- **BR-07**: Tasks can only be deleted by the Task Reporter, Project Owner, or an administrator.

---

## 13. Known Limitations

1. **Email Service**: Live SMTP mail delivery is stubbed for evaluation; password reset returns tokens directly via dev mode.
2. **Push Synchronization**: Real-time multi-tab consistency uses TanStack Query invalidation and window focus refetching rather than WebSockets.
3. **File Attachments**: File/binary storage is not implemented in the current scope.
4. For detailed analysis, refer to `docs/known-issues-and-limitations.md`.
