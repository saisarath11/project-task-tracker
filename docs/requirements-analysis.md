# Requirement Analysis Document: TaskPulse Project & Task Tracker

## 1. Project Objective
TaskPulse is an enterprise-grade full-stack project and task tracking web application designed for agile teams, engineering leads, and project managers. The system mirrors core Jira functionality, providing authentication, project scoping, fine-grained access control, Kanban visualization, task lifecycle transitions, real-time concurrency conflict prevention, and analytical reporting dashboards.

## 2. Functional Requirements
### 2.1 User Management
- **Registration**: Allows new users to create accounts with email, name, and secure password (minimum 8 characters, confirmation match).
- **Authentication**: JWT-based session security with bcrypt password hashing (10 salt rounds).
- **Profile Management**: Users can inspect and update their display name and email address. Normal users cannot escalate their role.
- **Password Reset**: Development-friendly secure token generation, validation, and password replacement.

### 2.2 Project Management
- **Creation**: Any authenticated user can create a project and automatically becomes the project owner and initial member.
- **Identification**: Each project receives a unique, uppercase alphanumeric key (e.g., `CRM`, `LIB`, `AI`).
- **Access Boundary**: Strict data isolation—only confirmed members and system administrators can view or collaborate within a project.
- **Member Management**: Only project owners or administrators can add or remove members.

### 2.3 Task Management & Concurrency
- **Identifiers**: Sequential, project-prefixed task keys (e.g. `CRM-1`, `CRM-2`) generated atomically via database transactions.
- **Validation**: Strict validation ensuring title presence, future/today due date, and member-only assignment.
- **Lifecycle Control**: Enforces sequential statuses (`TODO` &rarr; `IN_PROGRESS` &rarr; `IN_REVIEW` &rarr; `DONE`).
- **Reopening Guard**: Restricts reopening completed tasks exclusively to project owners or system administrators.
- **Optimistic Concurrency Control**: Tracks integer `version` numbers on task records to detect and reject concurrent overwrites with HTTP 409 Conflict.
- **Comments & Audit Trail**: Chronological comment threading and entity-level activity audit logging.

### 2.4 Dashboards
- **User Dashboard**: Summary cards for personal workload, immediate deadlines due this week, and overdue alerts.
- **Project Analytics**: Status distribution and member workload balance for project owners.
- **Admin Dashboard**: System-wide statistics, global overdue task tracking, and cross-team throughput charts.

---

## 3. Non-Functional Requirements
- **Security**: No plaintext passwords; zero client-trust architecture; role-based and membership-based backend route guards; SQL injection prevention via Prisma ORM parameterized queries.
- **Data Integrity**: Database constraints (`@unique`, foreign keys, cascade deletes on memberships/comments, `onDelete: SetNull` on task assignees).
- **Performance**: Normalized schema with indexed query paths (`projectId`, `assigneeId`, `status`, `dueDate`).
- **Usability**: Responsive layout for desktop and mobile devices; clean typography and intuitive status badges; accessible forms and clear validation feedback.

---

## 4. User Roles and Permissions Matrix

| Capability | Anonymous | Authenticated USER | Project Member | Project Owner | System ADMIN |
|---|:---:|:---:|:---:|:---:|:---:|
| Register / Login | Yes | - | - | - | - |
| Create Project | No | Yes | Yes | Yes | Yes |
| View Project Details | No | No | Yes | Yes | Yes |
| Add / Remove Members | No | No | No | Yes | Yes |
| Create & Edit Tasks | No | No | Yes | Yes | Yes |
| Reopen DONE Tasks | No | No | No | Yes | Yes |
| Delete Task | No | No | Only if Reporter | Yes | Yes |
| Access Admin Console | No | No | No | No | Yes |

---

## 5. Concurrency & Data Consistency Strategy
To prevent silent overwrites in multi-user collaborative environments:
1. Every task entity maintains a numeric `version` counter (starts at 1).
2. Read operations return the entity and its active `version`.
3. Mutating operations (`PATCH /api/tasks/:id` and `PATCH /api/tasks/:id/status`) require the client to pass the expected version.
4. If `dbTask.version !== clientVersion`, the backend aborts the transaction and returns `409 Conflict`.
5. The UI surfaces an explicit conflict alert with a one-click "Refresh Task" button.
