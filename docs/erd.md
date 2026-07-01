# Entity-Relationship Diagram

## Mermaid ERD

```mermaid
erDiagram
    auth_users ||--o| profiles : has
    auth_users ||--o{ books : owns
    auth_users ||--o{ highlights : creates
    auth_users ||--o{ notes : creates
    auth_users ||--o{ bookmarks : creates
    books ||--o{ highlights : contains
    books ||--o{ notes : contains
    books ||--o{ bookmarks : contains
    highlights ||--o| notes : optional_link

    auth_users {
        uuid id PK
        string email
        timestamptz created_at
    }

    profiles {
        uuid id PK_FK
        boolean is_admin
        timestamptz last_seen_at
        timestamptz created_at
    }

    books {
        uuid id PK
        uuid user_id FK
        text title
        text author
        text category
        text pdf_path
        text cover_path
        int progress_percent
        int last_page
        int total_pages
        int read_count
        float reading_scroll_y
        float reading_zoom
        timestamptz last_opened_at
        timestamptz created_at
    }

    highlights {
        uuid id PK
        uuid book_id FK
        uuid user_id FK
        int page_number
        text selected_text
        text color
        text highlight_type
        jsonb position
        timestamptz created_at
    }

    notes {
        uuid id PK
        uuid book_id FK
        uuid user_id FK
        uuid highlight_id FK
        int page_number
        text note_text
        text text_color
        jsonb position
        timestamptz created_at
        timestamptz updated_at
    }

    bookmarks {
        uuid id PK
        uuid book_id FK
        uuid user_id FK
        int page_number
        float scroll_y
        text label
        text note_text
        text color
        timestamptz created_at
        timestamptz updated_at
    }
```

## Storage buckets (Supabase Storage)

| Bucket | Content | Access |
|--------|---------|--------|
| `book-pdfs` | Original PDF files | Signed URL, per user |
| `book-covers` | JPEG/PNG covers | Signed URL, per user |

Path pattern: `{user_id}/{book_id}/file.pdf`

## Relationships

- **Cascade delete:** deleting a `book` removes its highlights, notes, and bookmarks
- **Cascade delete:** deleting an `auth.users` row removes the profile, books, and all annotations
- **Notes → highlights:** the `highlight_id` link is optional; a note can exist standalone on a page

## Auth note

`profiles.is_admin` exists in the schema, but **admin access is currently gated by the `ADMIN_EMAILS` env var** in application code (`src/lib/admin.ts`). Buyers may choose to unify on the database flag instead.
