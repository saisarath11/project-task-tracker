# Known Issues & Limitations Document

In the interest of full technical transparency, this document lists all known operational boundaries, design trade-offs, and intentionally scoped limitations in the TaskPulse application.

---

### 1. Production Email Delivery Service (SMTP / SES / SendGrid)
- **Status**: Not Configured (Scoped to Development Flow).
- **Details**: The password reset mechanism fully generates cryptographically secure 32-byte hexadecimal tokens stored with a 1-hour expiration date. However, live third-party email delivery services (such as AWS SES, SendGrid, or SMTP relays) are not wired up to prevent delivery failures during offline or sandboxed evaluations.
- **Workaround / Development Mechanism**: The endpoint `/api/auth/forgot-password` returns the generated reset token in the response payload (`devResetToken`), and the frontend surfaces this token in a development banner with a direct one-click navigation link to the reset form.

---

### 2. Real-Time Push Synchronization (WebSockets / Socket.io)
- **Status**: Deferred in favor of Query Invalidation & Polling.
- **Details**: While task updates are guarded by Optimistic Concurrency Control (OCC) with automatic `HTTP 409 Conflict` detection, multi-client updates do not push instant live diffs across websockets.
- **Workaround**: TanStack Query is configured with `refetchOnWindowFocus: true` and immediate cache invalidation following mutations (`createTask`, `updateTask`, `updateStatus`, `addComment`).

---

### 3. File Attachments & Binary Uploads
- **Status**: Scoped Out of Core Requirement.
- **Details**: Tasks support rich textual descriptions and threaded comments, but binary file uploads (PDFs, screenshots, logs) to object storage (e.g. AWS S3 or MinIO) are not implemented.

---

### 4. Subtasks & Issue Hierarchy
- **Status**: Single-Tier Task Structure.
- **Details**: Tasks exist at a single hierarchy level under their parent Project. Multi-level nesting (Epics &rarr; Stories &rarr; Tasks &rarr; Subtasks) is an architectural improvement planned for future iterations.

---

### 5. Multi-Database Provider Adaptability
- **Status**: PostgreSQL Provider Configured in Prisma.
- **Details**: The primary `schema.prisma` is optimized for PostgreSQL (enums, relational constraints, foreign keys). Running without PostgreSQL requires Docker or an active PostgreSQL instance, or switching the datasource provider to SQLite for standalone local testing.
