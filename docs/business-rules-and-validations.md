# Business Rules & Validation Document

## 1. Core Business Rules

### BR-01: Strict Project Membership Access
- **Rule**: Only confirmed members of a project (or global system ADMINs) can view a project, list its tasks, view task details, or create/edit work items.
- **Enforcement**:
  - Backend: `checkProjectAccess()` runs on `/api/projects/:id`, `/api/projects/:id/tasks`, and task detail endpoints. Non-members receive `HTTP 403 Forbidden`.
  - Frontend: Direct navigation to `/projects/:id` renders an explicit "Access Restricted" view if the API responds with 403.

### BR-02: Project Member Management Privileges
- **Rule**: Only the Project Owner or a system ADMIN can add or remove members.
- **Constraints**:
  - The Project Owner is automatically enrolled upon project creation with the role `OWNER`.
  - The Project Owner **cannot** be removed from the project under any circumstances.
  - Adding a member requires a valid registered user email and ensures no duplicate memberships exist.

### BR-03: Task Assignment Boundary
- **Rule**: A task can **only** be assigned to an active member of that project, or left `UNASSIGNED` (`null`).
- **Enforcement**:
  - Creation/Update validates that `assigneeId` exists in `ProjectMember` for that `projectId`.
  - The UI restricts the assignee dropdown exclusively to current project members.

### BR-04: Sequential Task Status Lifecycle
- **Rule**: Tasks must progress in sequential order:
  $$\text{TODO} \longrightarrow \text{IN\_PROGRESS} \longrightarrow \text{IN\_REVIEW} \longrightarrow \text{DONE}$$
- **Disallowed Transitions**:
  - Jumping from `TODO` directly to `DONE` is rejected (`HTTP 400 Bad Request`).
  - Skipping review stages is prohibited.
- **Allowed Rollbacks**:
  - `IN_PROGRESS` $\longrightarrow$ `TODO` (e.g., blocked/reprioritized work).
  - `IN_REVIEW` $\longrightarrow$ `IN_PROGRESS` (e.g., revisions requested during review).

### BR-05: Completed Task Reopening Exception
- **Rule**: Once a task is marked `DONE`, it can **only** be reopened by:
  1. The Project Owner, or
  2. A system ADMIN.
- **Allowed Reopen Target**:
  - `DONE` $\longrightarrow$ `IN_PROGRESS`.
- **Enforcement**:
  - Non-owner members attempting to reopen a `DONE` task receive `HTTP 403 Forbidden`.
  - The UI disables/hides the reopen button for normal members with an explanatory tooltip.

### BR-06: Dynamic Overdue Evaluation
- **Rule**: A task is classified as `OVERDUE` if:
  $$\text{Current Date} > \text{Due Date} \quad \text{AND} \quad \text{Status} \neq \text{DONE}$$
- **Implementation**:
  - `OVERDUE` is calculated dynamically rather than stored as a static column to avoid stale database states.
  - Displayed with visual warnings (red badge, pulsating alert icon) across the Kanban cards and dashboards.

### BR-07: Task Deletion Authority
- **Rule**: A task may **only** be deleted by:
  1. The Task Reporter (original author),
  2. The Project Owner, or
  3. A system ADMIN.
- **Enforcement**:
  - Other project members attempting to delete receive `HTTP 403 Forbidden`.
  - A confirmation dialog is required prior to deletion.

---

## 2. Input Validation Specifications

| Entity | Field | Rule | Error Message |
|---|---|---|---|
| User | `name` | String, min 1 char, trimmed | "Name is required" |
| User | `email` | Valid email syntax, unique, lowercase | "Please enter a valid email address" |
| User | `password` | Min 8 characters | "Password must contain at least 8 characters" |
| User | `confirmPassword` | Exact match with password | "Passwords do not match" |
| Project | `projectName` | Min 1 char, trimmed | "Project name is required" |
| Project | `projectKey` | 2-10 chars, uppercase regex `^[A-Z0-9]+$` | "Project key must be uppercase letters and numbers only" |
| Project | `endDate` | Cannot be earlier than `startDate` | "End date cannot be earlier than start date" |
| Task | `title` | Min 1 char, trimmed | "Task title is required" |
| Task | `dueDate` | Cannot be earlier than start of today | "Due date cannot be in the past" |
| Task | `assigneeId` | Must exist in `ProjectMember` | "Task can only be assigned to a project member" |
| Task | `version` | Required integer for updates | "Task version is required for concurrency control" |
| Comment | `content` | Min 1 char, non-whitespace | "Comment cannot be empty" |
