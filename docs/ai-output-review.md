# AI Output Review & Modification Document

This document records the critical reviews, technical audits, identified deficiencies, and architectural modifications made to AI-generated code during development.

---

### Review 1: Task Status Transition & Reopening (BR-04, BR-05)
- **Component**: `backend/src/controllers/task.controller.ts` (`updateTaskStatus`)
- **Initial AI Output**: An Express route that directly accepted `status` and called `prisma.task.update({ data: { status } })`.
- **Deficiencies Identified**:
  1. Did not enforce sequential progression (`TODO` $\to$ `IN_PROGRESS` $\to$ `IN_REVIEW` $\to$ `DONE`).
  2. Allowed skipping directly from `TODO` to `DONE`, violating BR-04.
  3. Allowed normal members to reopen completed tasks, violating BR-05.
  4. Did not check if the requesting user was a member of the project (violating BR-01).
- **Modifications Made**:
  - Implemented explicit state transition validation.
  - Added authorization check verifying `project.ownerId === userId || role === 'ADMIN'` before allowing reopening from `DONE`.
  - Added transition verification rejecting invalid status jumps with `400 Bad Request`.
- **Reason**: Essential for business rule compliance and data lifecycle integrity.

---

### Review 2: Task ID Generation Concurrency Race Conditions
- **Component**: `backend/src/controllers/task.controller.ts` (`createTask`)
- **Initial AI Output**: Generated task IDs by querying `const count = await prisma.task.count({ where: { projectId } })` and using `count + 1`.
- **Deficiencies Identified**:
  - In concurrent task creation (e.g. multiple team members creating tasks simultaneously), two concurrent requests query the same count and generate duplicate keys (`CRM-2`), failing the unique database constraint and throwing unhandled 500 errors.
- **Modifications Made**:
  - Added a dedicated `taskCounter: Int @default(0)` field on the `Project` model.
  - Wrapped task creation in a database transaction (`prisma.$transaction`) that atomically increments `taskCounter: { increment: 1 }` and returns the newly incremented integer.
- **Reason**: Guarantees gapless, concurrency-safe, unique task IDs per project under high concurrency.

---

### Review 3: Project Member Removal Task Orphanage (Ambiguity 3)
- **Component**: `backend/src/controllers/project.controller.ts` (`removeProjectMember`)
- **Initial AI Output**: Performed `prisma.projectMember.delete()`.
- **Deficiencies Identified**:
  - Left tasks assigned to the removed member pointing to a user ID that was no longer part of the project, violating BR-03 and causing UI rendering anomalies.
- **Modifications Made**:
  - Added an atomic multi-step transaction:
    1. Query all tasks with `projectId` and `assigneeId: targetUserId`.
    2. Set `assigneeId: null` on these tasks (`prisma.task.updateMany`).
    3. Delete the `projectMember` record.
    4. Return the count of unassigned tasks in the API response.
  - Prevented removing the project owner (`ownerId === targetUserId`) with HTTP 400.
- **Reason**: Satisfies Ambiguity 3 requirements and ensures task work is preserved while maintaining strict project boundaries.

---

### Review 4: Optimistic Concurrency Control (OCC)
- **Component**: `backend/src/controllers/task.controller.ts` (`updateTask`) & `frontend/src/components/tasks/TaskDetailModal.tsx`
- **Initial AI Output**: Generic update endpoint without version tracking; client writes blindly overwrote previous data.
- **Deficiencies Identified**:
  - Did not handle simultaneous updates from two users editing the same task card.
- **Modifications Made**:
  - Added an integer `version` field to the `Task` model.
  - Backend checks `if (existingTask.version !== clientVersion)` and responds with `HTTP 409 Conflict` and message: `"This task was updated by another user. Please refresh and try again."`
  - Frontend catches 409 and displays a dedicated warning banner with a "Refresh Task" button.
- **Reason**: Prevents silent overwrite bugs in collaborative agile environments.

---

### Review 5: Frontend Direct URL Security Bypass
- **Component**: `frontend/src/pages/ProjectDetailPage.tsx`
- **Initial AI Output**: Attempted to filter out non-member actions only by hiding UI buttons.
- **Deficiencies Identified**:
  - Relied on client-side state; entering `/projects/:id` directly into the browser URL bar did not display an access denied message if the backend returned a 403 error.
- **Modifications Made**:
  - Added explicit 403 status capture in `fetchProjectData`.
  - Rendered a secure "Access Restricted" view when 403 is received.
  - Backend independently authorizes every single API route using `checkProjectAccess()`.
- **Reason**: True zero-trust architecture; backend must never rely solely on hidden frontend buttons.
