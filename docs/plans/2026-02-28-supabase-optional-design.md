# Design: Make Supabase Optional with Local DB Alternative

**Date**: 2026-02-28
**Status**: Approved
**Goal**: First-class self-hosted alternative -- SnapAsset runs fully without Supabase using bundled SQLite, local filesystem storage, and local JWT auth.

---

## Provider Selection

At startup, the server reads `DB_PROVIDER` env var or auto-detects:

- `DB_PROVIDER=supabase` → Supabase for DB + Storage + Auth
- `DB_PROVIDER=local` → SQLite + filesystem + local JWT auth
- Not set → auto-detect: if `SUPABASE_URL` exists → supabase, else → local

A factory function `createProviders(config)` in `server/providers/index.js` returns:

```
{ db: DbAdapter, storage: StorageAdapter, auth: AuthAdapter }
```

Attached to `app.locals.providers` at startup, replacing `app.locals.supabase`.

---

## Database Adapter Interface

Repository methods grouped by domain. Services call these instead of Supabase query chains.

### DbAdapter.projects

| Method | Signature | Returns |
|--------|-----------|---------|
| create | (data) | project |
| findById | (id) | project with images, collaborators |
| findByUser | (userId, filters, pagination) | { data, count } |
| update | (id, data) | project |
| delete | (id, soft?) | void |
| addImages | (projectId, imageIds) | void |
| getImages | (projectId, pagination) | { data, count } |
| removeImages | (projectId, imageIds) | void |
| addCollaborator | (projectId, data) | void |
| getCollaborators | (projectId) | collaborators[] |
| removeCollaborator | (projectId, userId) | void |
| createVersion | (projectId, note) | version |
| getVersions | (projectId) | versions[] |
| restoreVersion | (projectId, versionId) | void |

### DbAdapter.analytics

| Method | Signature | Returns |
|--------|-----------|---------|
| trackEvent | (event) | void |
| getDashboard | (userId, period) | dashboardData |
| getUsageTimeline | (userId, period) | timelineData |
| getPlatformBreakdown | (userId, period) | platformData |
| trackCost | (data) | void |
| getCostAnalytics | (userId, period) | costData |
| trackPerformance | (metric) | void |
| getPerformanceMetrics | (type, period) | metrics[] |
| getAdminDashboard | (period) | adminData |
| getUserEngagement | (userId, period) | engagementData |

### DbAdapter.images

| Method | Signature | Returns |
|--------|-----------|---------|
| saveGeneration | (data) | generation |
| saveGeneratedImage | (data) | image |

### DbAdapter.users (local-only, used by LocalAuthAdapter)

| Method | Signature | Returns |
|--------|-----------|---------|
| create | (email, passwordHash, metadata) | user |
| findByEmail | (email) | user |
| findById | (id) | user |

---

## Auth Strategy

### Local Mode

- **Registration**: `POST /api/auth/register` -- bcrypt (12 rounds) password hashing, stores in SQLite `users` table
- **Login**: `POST /api/auth/login` -- verifies bcrypt hash, returns JWT signed with `JWT_SECRET`
- **JWT**: HS256, same claims as Supabase (`sub`, `email`, `iat`, `exp`), 24h expiry
- **Requirement**: `JWT_SECRET` env var mandatory in local mode; server refuses to start without it

### Auth Middleware

Provider-aware token verification:

- `SupabaseAuthAdapter.verifyToken(token)` → calls `supabase.auth.getUser(token)`
- `LocalAuthAdapter.verifyToken(token)` → calls `jwt.verify()` + SQLite user lookup

### Auth Routes (local mode only)

```
POST /api/auth/register  → create user
POST /api/auth/login     → verify credentials, return JWT
GET  /api/auth/me        → return current user from token
```

Not mounted in Supabase mode.

---

## Storage Adapter

### Interface

| Method | Signature | Returns |
|--------|-----------|---------|
| upload | (bucket, path, buffer, options) | { url } |
| getPublicUrl | (bucket, path) | url string |
| delete | (bucket, path) | void |

### Supabase Implementation

Wraps existing `supabase.storage.from(bucket).upload()` and `.getPublicUrl()`.

### Local Implementation

- Files at `./data/storage/{bucket}/{path}` (configurable via `LOCAL_STORAGE_PATH`)
- `upload()` → `fs.mkdir` (recursive) + `fs.writeFile`
- `getPublicUrl()` → returns `/storage/{bucket}/{path}`
- Served via `app.use('/storage', express.static(storagePath))`
- `delete()` → `fs.unlink`

### Directory Structure

```
data/
├── snapasset.db
└── storage/
    └── generated-images/
        └── {userId}/
            └── {generationId}/
                ├── instagram-1080x1080.png
                ├── facebook-1200x630.png
                └── twitter-1600x900.png
```

---

## File Structure

### New Files

```
server/
├── providers/
│   ├── index.js                    ← Factory: createProviders()
│   ├── supabase/
│   │   ├── SupabaseDbAdapter.js
│   │   ├── SupabaseStorageAdapter.js
│   │   └── SupabaseAuthAdapter.js
│   └── local/
│       ├── SqliteDbAdapter.js
│       ├── LocalStorageAdapter.js
│       ├── LocalAuthAdapter.js
│       └── schema.js              ← SQLite CREATE TABLE DDL
├── routes/
│   └── auth.js                    ← Local auth endpoints
└── data/                           ← Runtime, .gitignored
    ├── snapasset.db
    └── storage/
```

### Modified Files

- `server/index.js` -- Replace supabase init with `createProviders()`, attach to `app.locals.providers`, conditionally mount auth routes
- `server/services/ProjectService.js` -- Takes `db` adapter, replaces Supabase chains with repository calls
- `server/services/AnalyticsService.js` -- Same pattern
- `server/services/imageService.js` -- Takes `db` and `storage` adapters
- `server/middleware/auth.js` -- Uses `providers.auth.verifyToken()`
- `server/middleware/analytics.js` -- Gets `db` from `providers`
- `server/routes/projects.js` -- Passes `providers.db` to service
- `server/routes/analytics.js` -- Passes `providers.db` to service
- `server/routes/images.js` -- Uses `providers.storage`
- `server/workers/imageWorker.js` -- Receives providers
- `server/tests/mocks/supabase.js` -- Add mock adapters

### New Dependencies

- `better-sqlite3` -- SQLite engine
- `bcrypt` -- Password hashing
- `jsonwebtoken` -- JWT signing/verification

---

## Startup Flow

```
read env → createProviders(config)
  ├── SUPABASE_URL set?  → Supabase adapters (existing behavior)
  └── not set?           → Local adapters
       ├── ensure ./data/ exists
       ├── open/create snapasset.db
       ├── run schema.js (CREATE TABLE IF NOT EXISTS)
       └── require JWT_SECRET or exit with error
→ attach providers to app.locals
→ mount routes (conditionally add /api/auth for local mode)
→ start server
```

---

## Design Decisions

1. **Repository pattern over API shim**: Clean adapter boundary, independently testable, no fragile Supabase SDK mimicry
2. **better-sqlite3 over Knex/ORM**: Zero-config, single file, synchronous API, minimal dependency footprint
3. **bcrypt + jsonwebtoken for local auth**: Production-proven, secure, minimal surface area
4. **Local filesystem over S3**: Simplest self-hosted option, no extra services needed
5. **Auto-detection over explicit config**: Zero-config default experience; set SUPABASE_URL to use Supabase, don't set it to use local
6. **Mandatory JWT_SECRET**: Prevents insecure local deploys
