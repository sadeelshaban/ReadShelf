# API Reference

All routes live under `src/app/api/`. Authentication uses Supabase session cookies unless noted.

**Base URL:** `https://your-domain.com/api`

---

## Auth

### `POST /api/auth/signup`

Create account and send confirmation email.

| Field | Type | Required |
|-------|------|----------|
| `email` | string | yes |
| `password` | string | yes |

**Response:** `{ ok: true }` or `{ error: string }`

---

### `POST /api/auth/login`

| Field | Type | Required |
|-------|------|----------|
| `email` | string | yes |
| `password` | string | yes |

**Response:** Sets session cookie; `{ redirect: string }` or field errors.

---

### `POST /api/auth/forgot-password`

Send OTP recovery email.

| Field | Type | Required |
|-------|------|----------|
| `email` | string | yes |

---

### `GET /api/auth/destination`

Returns post-login redirect path (`/admin` for admins, `/shelf` for users).

**Auth:** Session required.

---

## Books

### `POST /api/books/upload-urls`

Get signed upload URLs for PDF and cover.

**Auth:** Session required.

| Field | Type | Required |
|-------|------|----------|
| `bookId` | uuid | yes |
| `pdfContentType` | string | yes |
| `coverContentType` | string | yes |

**Response:** `{ pdfPath, coverPath, pdfUploadUrl, coverUploadUrl }`

---

### `POST /api/books/upload-file`

Register book after storage upload.

| Field | Type | Required |
|-------|------|----------|
| `bookId` | uuid | yes |
| `title` | string | yes |
| `author` | string | no |
| `pdfPath` | string | yes |
| `coverPath` | string | no |
| `totalPages` | number | yes |

---

### `PATCH /api/books/[id]`

Update title/author.

**Auth:** Owner only.

---

### `DELETE /api/books/[id]`

Delete book, storage files, annotations, cache.

**Auth:** Owner only.

---

### `GET /api/books/[id]/pdf`

Stream PDF bytes (signed access).

**Auth:** Owner only.

---

### `GET|POST /api/books/[id]/pdf/export`

Generate annotated PDF with highlights and notes embedded.

- **GET** — export with server-stored annotations
- **POST** — optional client annotation payload for offline merge

**Auth:** Owner only.  
**Response:** `application/pdf` attachment.

---

### `GET /api/books/cover-url`

Query: `path` — storage path. Returns signed cover URL.

**Auth:** Session required.

---

## Presence

### `POST /api/presence`

Updates `profiles.last_seen_at` for current user.

**Auth:** Session required.

---

## Admin

Requires admin session (`ADMIN_EMAILS`) + `SUPABASE_SERVICE_ROLE_KEY` on server.

### `GET /api/admin/users`

List all users with profile metadata.

### `DELETE /api/admin/users/[id]`

Delete user account and associated data.

### `POST /api/admin/users/[id]/sign-out`

Force sign-out all sessions for user.

---

## Client-side data (not REST)

Most annotation CRUD runs through `src/lib/offline/reader-api.ts`:

- Direct Supabase client when online
- IndexedDB + sync queue when offline

Functions: `insertHighlight`, `insertNote`, `insertBookmark`, `saveReadingProgress`, `resetBookForReread`, `flushSyncQueue`, etc.

---

## Error format

```json
{ "error": "Human-readable message" }
```

HTTP status: `400` validation, `401` unauthenticated, `403` forbidden, `404` not found, `500` server error.

---

## Rate limits

No custom rate limiting in app layer. Subject to Vercel and Supabase platform limits.
