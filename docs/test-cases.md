# Comprehensive Test Cases Specification

| ID | Category | Test Case | Preconditions | Steps | Expected Result | Status |
|:---|:---|:---|:---|:---|:---|:---:|
| **TC-F01** | Functional | User Registration | Valid new email, 8+ char password | Submit POST `/api/auth/register` | 201 Created, user object returned without passwordHash, JWT token provided | PASS |
| **TC-F02** | Functional | User Login | User registered in database | Submit POST `/api/auth/login` with correct password | 200 OK, JWT token issued, user state loaded | PASS |
| **TC-F03** | Functional | View User Profile | User authenticated | Send GET `/api/users/me` with Bearer token | 200 OK, returns user profile details (id, name, email, role) | PASS |
| **TC-F04** | Functional | Update Profile | User authenticated | Send PATCH `/api/users/me` with updated name | 200 OK, updated user profile returned | PASS |
| **TC-F05** | Functional | Password Reset Flow | User registered | 1. POST `/api/auth/forgot-password`<br>2. POST `/api/auth/reset-password` with token & new pass | 200 OK, token validated and user password successfully updated | PASS |
| **TC-F06** | Functional | Create Project | User authenticated | Send POST `/api/projects` with name & key | 201 Created, project initialized with taskCounter=0, creator enrolled as OWNER member | PASS |
| **TC-F07** | Functional | View Project List | User authenticated | Send GET `/api/projects` | 200 OK, returns list of projects user owns or is a member of | PASS |
| **TC-F08** | Functional | View Project Details | User is member of project | Send GET `/api/projects/:id` | 200 OK, returns project details, owner info, members list | PASS |
| **TC-F09** | Functional | Edit Project | User is project owner or admin | Send PATCH `/api/projects/:id` with new description | 200 OK, updated project returned | PASS |
| **TC-F10** | Functional | Add Project Member | User is project owner or admin | Send POST `/api/projects/:id/members` with registered email | 201 Created, new member enrolled in project | PASS |
| **TC-F11** | Functional | Remove Member | User is project owner or admin | Send DELETE `/api/projects/:id/members/:userId` | 200 OK, member removed, their active tasks reset to UNASSIGNED | PASS |
| **TC-F12** | Functional | Create Task | User is project member | Send POST `/api/projects/:id/tasks` with title & member assignee | 201 Created, unique key `KEY-1` generated, status `TODO` | PASS |
| **TC-F13** | Functional | Sequential Status Progress | Task in `TODO` status | Send PATCH `/api/tasks/:id/status` with `IN_PROGRESS` and version | 200 OK, task status updated to `IN_PROGRESS`, version incremented | PASS |
| **TC-F14** | Functional | Add Task Comment | User is project member | Send POST `/api/tasks/:id/comments` with non-empty string | 201 Created, comment appended with author info | PASS |
| **TC-F15** | Functional | Task Search & Filter | Tasks exist in project | Send GET `/api/projects/:id/tasks?status=IN_PROGRESS&priority=HIGH` | 200 OK, returns tasks strictly matching both filters | PASS |
| **TC-F16** | Functional | User Dashboard | User has assigned tasks | Send GET `/api/dashboard/me` | 200 OK, returns summary counts, tasks assigned to user, due this week, and overdue | PASS |
| **TC-N01** | Negative | Invalid Password Login | User exists | Submit POST `/api/auth/login` with wrong password | 401 Unauthorized, "Invalid email or password" | PASS |
| **TC-N02** | Negative | Duplicate Email Register | Email already registered | Submit POST `/api/auth/register` with existing email | 409 Conflict, "A user with this email address already exists" | PASS |
| **TC-N03** | Negative | Invalid Email Syntax | Registration form | Submit POST `/api/auth/register` with "bademail" | 422 Unprocessable Entity, "Please enter a valid email address" | PASS |
| **TC-N04** | Negative | Short Password (<8 chars) | Registration form | Submit POST `/api/auth/register` with 5-character password | 422 Unprocessable Entity, "Password must contain at least 8 characters" | PASS |
| **TC-N05** | Negative | Empty Project Name | Project creation | Submit POST `/api/projects` with `projectName: ""` | 422 Unprocessable Entity, "Project name is required" | PASS |
| **TC-N06** | Negative | Duplicate Project Key | Key "CRM" already exists | Submit POST `/api/projects` with `projectKey: "CRM"` | 409 Conflict, "Project key 'CRM' is already taken" | PASS |
| **TC-N07** | Negative | Invalid Project Key Format | Project creation | Submit POST `/api/projects` with `projectKey: "crm_low"` | 422 Unprocessable Entity, "must be uppercase letters and numbers only" | PASS |
| **TC-N08** | Negative | End Date Before Start Date | Project creation | Submit POST `/api/projects` with `startDate: 2026-12-01`, `endDate: 2026-11-01` | 422 Unprocessable Entity, "End date cannot be earlier than start date" | PASS |
| **TC-N09** | Negative | Assign Task to Non-Member | User is not project member | Submit POST `/api/projects/:id/tasks` with stranger user ID | 400 Bad Request, "Task can only be assigned to a project member" | PASS |
| **TC-N10** | Negative | Past Due Date On Create | Task creation form | Submit POST `/api/projects/:id/tasks` with due date 5 days ago | 422 Unprocessable Entity, "Due date cannot be in the past" | PASS |
| **TC-N11** | Negative | Non-Member Direct Project Access | User is not member of project | Send GET `/api/projects/:id` | 403 Forbidden, "You don't have permission to access this project" | PASS |
| **TC-N12** | Negative | Member Management by Normal Member | User is normal project member | Send POST `/api/projects/:id/members` to add user | 403 Forbidden, "Only the project owner or an administrator can add project members" | PASS |
| **TC-N13** | Negative | Remove Project Owner | Owner removal attempt | Send DELETE `/api/projects/:id/members/:ownerId` | 400 Bad Request, "The project owner cannot be removed from the project" | PASS |
| **TC-N14** | Negative | Empty Comment Content | Task comment form | Submit POST `/api/tasks/:id/comments` with `content: ""` | 422 Unprocessable Entity, "Comment cannot be empty" | PASS |
| **TC-N15** | Negative | Reopening DONE by Normal User | Task status is `DONE`, user is normal member | Send PATCH `/api/tasks/:id/status` with `status: IN_PROGRESS` | 403 Forbidden, "A task marked DONE can be reopened only by the project owner or an administrator" | PASS |
| **TC-E01** | Edge Case | Skipping Status `TODO` &rarr; `DONE` | Task is in `TODO` | Send PATCH `/api/tasks/:id/status` with `status: DONE` | 400 Bad Request, "Invalid status transition... Tasks must move sequentially" | PASS |
| **TC-E02** | Edge Case | Reopening `DONE` by Project Owner | Task is `DONE`, user is Project Owner | Send PATCH `/api/tasks/:id/status` with `status: IN_PROGRESS` | 200 OK, transition permitted for owner | PASS |
| **TC-E03** | Edge Case | Concurrent Updates (OCC) | Task at version 1 | Client sends update with stale `version: 1` when DB is at `version: 2` | 409 Conflict, "This task was updated by another user. Please refresh and try again." | PASS |
| **TC-E04** | Edge Case | Atomic Concurrent Task Key Gen | Multiple simultaneous task creations | High concurrency tasks created simultaneously | Database transaction atomically increments taskCounter, producing gapless unique keys (`CRM-1`, `CRM-2`, etc.) | PASS |
| **TC-E05** | Edge Case | Removing Member with Assigned Tasks | Member has 3 assigned tasks | Project owner removes that member | 200 OK, member removed, all 3 tasks updated to `assigneeId = null`, tasks not deleted | PASS |
| **TC-E06** | Edge Case | Direct URL Access by Non-Member | Non-member pastes direct URL | Frontend loads `/projects/:unauthorizedId` | Backend returns 403, UI captures 403 and renders secure "Access Restricted" screen | PASS |
| **TC-E07** | Edge Case | Unauthorized Task Deletion | User is not reporter, owner, or admin | Send DELETE `/api/tasks/:id` | 403 Forbidden, "Only the task reporter, project owner, or an administrator can delete this task" | PASS |
| **TC-E08** | Edge Case | Dynamic Overdue Calculation | Task dueDate in past, status `IN_PROGRESS` | System evaluates task | Rendered as OVERDUE with red warning badge. When status updated to `DONE`, OVERDUE flag instantly clears without cron | PASS |
