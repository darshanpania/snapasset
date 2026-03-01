# BYOK + Sign in with ChatGPT — Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let users bring their own OpenAI API key (manually or via ChatGPT OAuth) so every user can generate images without a shared server key.

**Architecture:** Embed ChatGPT OAuth2+PKCE flow directly into the SnapAsset Express server. Store per-user API keys encrypted (AES-256-GCM) in SQLite. Resolve keys at job time: user key > server fallback. Add a Settings page to the frontend for key management.

**Tech Stack:** Node.js/Express, crypto (AES-256-GCM), OAuth2+PKCE, React, SQLite

---

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Gateway topology | Embedded in API server | No extra service to manage |
| Key storage | AES-256-GCM encrypted in DB | Secure at rest, decrypted only at job time |
| Account model | Auto-create local account on ChatGPT login | Unified user table, can switch auth methods |
| Fallback key | Yes — use server `OPENAI_API_KEY` if user has none | Good for demos and self-hosted |

## Database Changes

Add columns to `users` table:

```sql
ALTER TABLE users ADD COLUMN encrypted_openai_key TEXT DEFAULT NULL;
ALTER TABLE users ADD COLUMN openai_key_source TEXT DEFAULT NULL; -- 'manual' | 'chatgpt'
ALTER TABLE users ADD COLUMN chatgpt_account_id TEXT DEFAULT NULL;
```

## Key Encryption

- Algorithm: AES-256-GCM
- Key derivation: HKDF from `KEY_ENCRYPTION_SECRET` env var (falls back to `JWT_SECRET`)
- Storage format: `base64(iv):base64(authTag):base64(ciphertext)`
- Module: `server/utils/encryption.js`

## Key Resolution Order (Worker)

1. Query user's `encrypted_openai_key` from DB, decrypt
2. Fall back to `process.env.OPENAI_API_KEY`
3. Fail with "No API key configured"

## ChatGPT OAuth — Embedded Routes

### New Files (ported from divyekant/SignInWithChatGPT)

| File | Purpose |
|------|---------|
| `server/auth/pkce.js` | `generateCodeVerifier()`, `createCodeChallenge()` |
| `server/auth/chatgpt-oauth.js` | Build authorize URL, exchange code, exchange API key |
| `server/auth/oauth-state-store.js` | In-memory state store with TTL + cleanup |
| `server/routes/chatgpt-auth.js` | Express router for `/api/auth/chatgpt/*` |

### Endpoints

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/auth/chatgpt/start` | GET | No | Generate PKCE pair, store state, return `authorizationUrl` |
| `/api/auth/chatgpt/callback` | GET | No | Validate state, exchange code, create user, issue JWT, redirect |

### OAuth Flow

1. Frontend redirects to `/api/auth/chatgpt/start?returnTo=/&redirect=1`
2. Server generates PKCE pair, stores state in memory, redirects to OpenAI
3. User authenticates at OpenAI
4. OpenAI redirects to `/api/auth/chatgpt/callback?code=...&state=...`
5. Server validates state, exchanges code for tokens (PKCE proof)
6. Decodes `id_token` claims: email, chatgptAccountId, chatgptPlanType
7. Exchanges `id_token` for OpenAI API key (token exchange grant)
8. Finds or creates local user by email (password_hash = `'chatgpt_oauth'` sentinel)
9. Encrypts and stores API key, sets `openai_key_source = 'chatgpt'`
10. Issues local JWT, redirects to `returnTo` with `?token=...`

## Settings API (Backend)

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/settings/api-key` | GET | Yes | Returns `{ hasKey, source, maskedKey }` |
| `/api/settings/api-key` | PUT | Yes | Validates key format, encrypts, stores |
| `/api/settings/api-key` | DELETE | Yes | Removes stored key |
| `/api/config` | GET | No | Returns `{ chatgptAuthEnabled }` feature flag |

## Settings Page (Frontend)

- Route: `/settings`
- Sections:
  - **API Key**: Status badge (Manual/ChatGPT/Server default), masked key display, input to set/update, delete button
  - **Account**: Email (read-only), auth method, sign out
- Navigation: Gear icon in header next to profile avatar

## Frontend Auth Updates

- "Sign in with ChatGPT" button on login/signup pages (conditionally shown via `/api/config`)
- After ChatGPT callback redirect, frontend extracts `?token=` from URL and stores in localStorage
- Settings link added to header navigation

## New Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CHATGPT_CLIENT_ID` | For ChatGPT auth | — | OAuth client ID from OpenAI |
| `CHATGPT_CLIENT_SECRET` | No | — | Optional client secret |
| `KEY_ENCRYPTION_SECRET` | No | Derived from JWT_SECRET | AES-256-GCM encryption key |

## Error Handling

- Invalid/expired OAuth state: redirect to login with error message
- API key exchange failure: log error, create user without key, show notice in Settings
- Encrypted key decryption failure: treat as no key, log warning
- Invalid API key format on manual entry: reject with validation error
