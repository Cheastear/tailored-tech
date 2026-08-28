# DataRoom

A virtual Data Room MVP for secure document storage and sharing — built as a full-stack take-home project for Acme Corp.'s multi-billion dollar acquisition due diligence scenario.

**Live demo:** [tailored-tech-neon.vercel.app](https://tailored-tech-neon.vercel.app)

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Data Model](#data-model)
- [How It Scales](#how-it-scales)
- [Design Decisions](#design-decisions)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [AI Usage](#ai-usage)

---

## Tech Stack

| Layer                 | Technology                                                 |
| --------------------- | ---------------------------------------------------------- |
| Frontend              | Vite · React 19 · TypeScript · Tailwind CSS v4 · Shadcn UI |
| State / Data fetching | Redux Toolkit · RTK Query                                  |
| Routing               | React Router v7                                            |
| Backend               | NestJS · Prisma ORM                                        |
| Database              | PostgreSQL                                                 |
| File storage          | Vercel Blob                                                |
| Auth                  | JWT (HTTP-only cookie) · Google OAuth 2.0                  |
| Real-time             | Socket.io (WebSocket)                                      |
| Monorepo              | npm workspaces                                             |
| Deployment            | Vercel                                                     |

---

## Features

### Spaces (Data Rooms)

- Create and manage multiple Data Rooms
- Each Space belongs to its owner and is invisible to others unless explicitly shared

### Folders

- Create folders and nest them arbitrarily deep
- Breadcrumb navigation reflecting the current path
- Rename folders in-place
- Delete a folder with a confirmation dialog listing all nested folders and files that will be removed

### Files

- Upload PDFs — multiple at once, drag-and-drop, with per-file upload progress
- Preview files directly in the browser
- Rename files (name conflicts within a folder are handled with automatic versioning)
- Move files between folders
- Delete files

### Sharing

- Share a Space, a folder, or a single file
- **Public link** — anyone with the token URL gets read-only access, no login required
- **Permissioned share** — only specific email addresses you grant can view the content
- Sharing a Space or folder automatically includes all nested content
- Owner can revoke any share at any time; revoked links stop working immediately

### Search

- Search files by name across the entire Data Room

### Real-time sync

- Uploads, renames, deletes, and moves are broadcast over WebSocket so all open sessions in the same Space see updates without a manual refresh

---

## Data Model

```
User
  id        cuid  PK
  email     unique
  password  nullable    — null for Google-only accounts
  googleId  nullable    — null for email/password accounts
  name
  avatar    nullable

Space  (= one Data Room)
  id        cuid  PK
  name
  ownerId   → User

SpaceMember  (role-based membership at the Space level)
  spaceId   → Space  (cascade delete)
  userId    → User
  role      OWNER | WRITER | READER
  UNIQUE(spaceId, userId)

Folder
  id        cuid  PK
  name
  spaceId   → Space   (cascade delete)
  parentId  → Folder  (nullable — null means root of the Space)
              self-referential with cascade delete for full subtree removal

File
  id           cuid  PK
  name
  url          Vercel Blob URL
  size         Int (bytes)
  mimeType
  spaceId      → Space   (cascade delete)
  folderId     → Folder  (nullable — null means root of the Space)
  uploadedById → User

Share
  id            cuid  PK
  token         cuid  UNIQUE  — used as the public link token
  mode          PUBLIC | PERMISSIONED
  resourceType  SPACE | FOLDER | FILE
  spaceId       → Space   (nullable, cascade delete)
  folderId      → Folder  (nullable, cascade delete)
  fileId        → File    (nullable, cascade delete)
  createdById   → User
  allowedEmails String[]  — non-empty for PERMISSIONED mode
  revokedAt     DateTime? — soft revoke; null means active
```

**Cascade behaviour:** deleting a `Space` removes all its `Folder`, `File`, and `Share` records. Deleting a `Folder` recursively removes all child folders and their files via the self-referential cascade. This is enforced at the database level in the Prisma schema, so no application code is required to clean up orphaned records.

### ERD (simplified)

```
User ──< SpaceMember >── Space ──< Folder (self-ref tree)
                           │              │
                           └──< File >────┘
                           │
                           └──< Share (→ Space | Folder | File)
```

---

## How It Scales

### 1. Total size and item count of a folder subtree

The current implementation traverses the tree in-memory via Prisma relations. At scale this should become a single `WITH RECURSIVE` CTE that walks the self-join in one DB round-trip:

```sql
WITH RECURSIVE subtree AS (
  SELECT id FROM "Folder" WHERE id = $folderId
  UNION ALL
  SELECT f.id FROM "Folder" f
  JOIN subtree s ON f."parentId" = s.id
)
SELECT
  COUNT(fi.id)                  AS file_count,
  COALESCE(SUM(fi.size), 0)    AS total_bytes
FROM "File" fi
WHERE fi."folderId" IN (SELECT id FROM subtree);
```

For write-heavy workloads, a denormalized `size` and `itemCount` counter column on `Folder` (incremented/decremented on every mutation inside a transaction) eliminates the recursive query at read time entirely.

### 2. One Data Room with 100,000 files

Three changes matter most:

- **Composite index on `(spaceId, folderId)`** on the `File` table — this is the primary listing access pattern and keeps direct-children queries O(log n) regardless of total file count.
- **Cursor-based pagination** instead of `OFFSET` on folder contents and search results — offset scans degrade linearly; a keyset cursor on `(createdAt, id)` stays constant.
- **Trigram index (`pg_trgm`) on `File.name`** — enables fast `ILIKE '%query%'` search without a full-table scan.

Listing only direct children by default (not the full recursive subtree) means the common UI action remains O(1) in depth regardless of tree size.

### 3. Extending sharing to per-user roles without remodeling

`SpaceMember.role` already carries `OWNER | WRITER | READER` at the Space level. Extending this to folder- or file-level granularity requires no changes to `Folder` or `File`:

- Add a `role` column (same enum) to the `Share` table. A permissioned share then encodes both _who_ can access and _what they can do_.
- Replace `allowedEmails String[]` with a `ShareMember(shareId, userId, role)` join table for proper FK constraints, per-user revocation, and easy role upgrades without touching the share itself.

Access-control logic stays entirely in the Share layer — the resource tables are untouched.

---

## Design Decisions

**Monorepo with npm workspaces** — the API and web app share a `packages/shared` package for TypeScript types, keeping the frontend and backend contracts in sync without duplication or manual copying.

**JWT in HTTP-only cookies, not localStorage** — the access token is never readable by JavaScript, eliminating the XSS attack surface. `SameSite=Strict` is set on the cookie, so CSRF is not a concern for same-origin requests.

**Share via opaque token, not resource URL** — `Share.token` is a random cuid that resolves to the resource server-side. Revoking a share (setting `revokedAt`) immediately invalidates the link even if it was bookmarked, without touching the underlying resource or its URL.

**Cascade deletes at the DB level** — all `onDelete: Cascade` relations are declared in the Prisma schema. Deleting a Space or Folder is a single statement and the database guarantees orphan-free cleanup regardless of which code path triggers the delete.

**WebSocket real-time sync** — NestJS `@WebSocketGateway` broadcasts each mutation (upload, rename, delete, move) to all connected clients in the same Space. The frontend calls RTK Query's `refetch()` directly rather than `invalidateTags` to get immediate, non-batched updates.

**File versioning on name conflict** — when a file is uploaded or renamed to a name already present in that folder, the incoming file gets a `(1)`, `(2)`, … suffix appended rather than overwriting or throwing an error. This matches the behaviour users expect from Google Drive and Dropbox.

**Sharing scope by resource type** — `Share.resourceType` is an explicit enum (`SPACE | FOLDER | FILE`) rather than inferred from which FK is set. This makes permission checks a single equality test and prevents ambiguous states where multiple FKs might be set.

---

## Local Setup

### Prerequisites

- Node.js ≥ 20
- Docker (for local Postgres)

### 1. Clone and install

```bash
git clone https://github.com/your-username/tailored-tech.git
cd tailored-tech
npm install
```

### 2. Start the database

```bash
npm run dev:db   # runs docker-compose up -d
```

### 3. Configure environment variables

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Fill in the values — see [Environment Variables](#environment-variables) below.

### 4. Run database migrations

```bash
npm run db:migrate --workspace=apps/api
```

### 5. Start both apps

```bash
npm run dev   # starts API on :3000 and web on :5173 concurrently
```

The web app is available at `http://localhost:5173` and the API at `http://localhost:3000`.

---

## Environment Variables

### `apps/api/.env`

| Variable                | Description                                                                     |
| ----------------------- | ------------------------------------------------------------------------------- |
| `DATABASE_URL`          | PostgreSQL connection string                                                    |
| `JWT_SECRET`            | Secret used to sign JWT access tokens                                           |
| `GOOGLE_CLIENT_ID`      | Google OAuth 2.0 client ID                                                      |
| `GOOGLE_CLIENT_SECRET`  | Google OAuth 2.0 client secret                                                  |
| `GOOGLE_CALLBACK_URL`   | OAuth redirect URL (e.g. `http://localhost:3000/api/auth/google/callback`)      |
| `FRONTEND_URL`          | Frontend origin used for CORS and OAuth redirect (e.g. `http://localhost:5173`) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob read/write token                                                    |

### `apps/web/.env`

| Variable       | Description                                     |
| -------------- | ----------------------------------------------- |
| `VITE_API_URL` | Backend base URL (e.g. `http://localhost:3000`) |

---

## AI Usage

AI (Claude Code) was used moderately throughout the build:

- **Scaffolding** — generated the initial NestJS module structure (controllers, services, guards, DTOs) and the Vite + React project boilerplate to move past setup quickly.
- **Specific problems** — used to work through the WebSocket / RTK Query integration pattern, the Vercel Blob multipart upload flow, and the recursive Prisma cascade-delete behavior for folder trees.

All architecture decisions, the data model design, and feature scoping were made manually. AI-generated code was reviewed and adjusted before committing.
