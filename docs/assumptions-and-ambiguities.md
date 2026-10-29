# Assumptions & Ambiguity Resolutions Document

This document records architectural decisions made to resolve ambiguities identified in the project requirements.

---

### Ambiguity 1: Project Creation Authority
- **Question**: Can any registered user create a project, or only users with an `ADMIN` role?
- **Decision**: Any authenticated user can create a project. The creator is automatically assigned as the project owner and registered as an initial project member. System administrators (`ADMIN`) can also create projects.
- **Rationale**: In collaborative productivity platforms (such as Jira or Linear), teams allow any team member to start a project workspace without requiring global administrator intervention.

---

### Ambiguity 2: Task Assignment Eligibility
- **Question**: Can a task be assigned to a user who is not a member of that project?
- **Decision**: **NO.** A task can only be assigned to a user who has active membership in the parent project.
- **Rationale**: Allowing non-members to be assigned tasks would break project access boundaries (BR-01), creating data leakage where users see tasks in projects they cannot access.

---

### Ambiguity 3: Removal of Members with Active Tasks
- **Question**: What happens to active tasks assigned to a member when that member is removed from the project?
- **Decision**: All tasks currently assigned to the removed member are automatically updated to **UNASSIGNED** (`assigneeId = null`). The tasks are never deleted. The API returns a notification indicating the number of tasks that were unassigned.
- **Rationale**: Deleting tasks would cause catastrophic loss of historical work and project progress. Unassigning them keeps the work visible in the project backlog for the owner to reallocate.

---

### Ambiguity 4: Project Owner Removal
- **Question**: Can a project owner be removed from the project member list?
- **Decision**: **NO.** The project owner cannot be removed. Any attempt by an administrator or the owner to remove the owner from `ProjectMember` returns `HTTP 400 Bad Request`.
- **Rationale**: An orphaned project with no owner violates domain consistency and project governance rules.

---

### Ambiguity 5: Reopening Completed Tasks
- **Question**: Can normal project members move a task from `DONE` back to `IN_PROGRESS`?
- **Decision**: **NO.** Completed tasks can only be reopened by the Project Owner or a system `ADMIN`. Normal members receive `HTTP 403 Forbidden` if they attempt this transition.
- **Rationale**: Enforces quality control and sign-off integrity, ensuring tasks marked complete are not reopened without leadership approval.

---

### Ambiguity 6: Overdue Task Representation
- **Question**: Should `OVERDUE` be stored as an enum value in the database `TaskStatus` column?
- **Decision**: **NO.** `OVERDUE` is calculated dynamically by comparing the task's `dueDate` against the current timestamp (provided `status !== 'DONE'`).
- **Rationale**: If `OVERDUE` were a stored status, tasks would require a continuous background cron daemon to mutate database records upon midnight transitions, creating synchronization latency and potential race conditions.

---

### Ambiguity 7: Password Reset Delivery Mechanism
- **Question**: How does password reset function when production SMTP email infrastructure is not configured?
- **Decision**: The password reset endpoint generates an industry-standard random 32-byte hexadecimal token with a 1-hour expiration. In development mode, the token is returned in the API response and displayed in the frontend testing card, enabling seamless evaluation testing without live mail servers.
- **Rationale**: Provides 100% testability of the security token lifecycle without external SMTP dependencies.

---

### Ambiguity 8: Concurrency Handling Model
- **Question**: How should simultaneous task updates from multiple users or browser tabs be reconciled?
- **Decision**: Optimistic Concurrency Control (OCC) using an integer `version` field. When saving an update, the backend confirms that the database `version` equals the submitted `version`. If another user committed a change first, the backend rejects the write with `HTTP 409 Conflict`.
- **Rationale**: Prevents accidental overwrites and lost updates while avoiding heavy database table-level locks.
