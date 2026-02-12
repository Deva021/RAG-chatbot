# Tasks: Batch 1 - Foundation

**Spec**: `specs/001-batch-1-foundation/spec.md`
**Status**: Completed

## Phase 1: Repo & Environment

### [x] 1. Create Next.js app skeleton

- **Goal**: Initialize Next.js App Router + TS project
- **Done When**: App runs locally with a home route

### [x] 2. Add pnpm + lock workflow

- **Goal**: Standardize package manager + scripts
- **Done When**: pnpm install/dev scripts work

### [x] 3. Set up code quality tooling

- **Goal**: Add ESLint + Prettier configs
- **Done When**: lint/format scripts pass

### [x] 4. Create env var template

- **Goal**: Add .env.example + docs for required keys
- **Done When**: Dev can configure env without guesswork

### [x] 5. Provision hosted Supabase project

- **Goal**: Create Supabase project for dev/staging
- **Done When**: Project URL + anon key available

## Phase 2: Core Database Schema

### [x] 6. Enable pgvector extension (migration)

- **Goal**: Add SQL migration enabling pgvector
- **Done When**: pgvector extension is enabled in DB

### [x] 7. Create profiles table (migration)

- **Goal**: Add profiles table keyed by auth.users id
- **Done When**: profiles table exists with timestamps

### [x] 8. Create roles enum (migration)

- **Goal**: Define role enum for app authorization
- **Done When**: role enum exists and used by profiles

### [x] 9. Add RLS to profiles

- **Goal**: Enable RLS and policies for self-read/update
- **Done When**: Users only access their own profile row

## Phase 3: Knowledge Base (KB)

### [x] 10. Create kb_documents table (migration)

- **Goal**: Create documents metadata table
- **Done When**: kb_documents exists with status fields

### [x] 11. Create kb_chunks table (migration)

- **Goal**: Create chunk storage table with metadata
- **Done When**: kb_chunks exists with doc FK + chunk_index

### [x] 12. Create kb_embeddings table (migration)

- **Goal**: Store vector embeddings per chunk
- **Done When**: kb_embeddings exists with vector column

### [x] 13. Add vector index (migration)

- **Goal**: Create pgvector index for similarity search
- **Done When**: Vector index exists and queryable

### [x] 14. Add RLS to kb_documents

- **Goal**: Restrict doc management to admins
- **Done When**: Non-admin cannot insert/update/delete docs

### [x] 15. Add RLS to kb_chunks

- **Goal**: Restrict chunk write to admins; read rules defined
- **Done When**: Policies enforce intended access

### [x] 16. Add RLS to kb_embeddings

- **Goal**: Restrict embedding writes to admins; read rules defined
- **Done When**: Policies enforce intended access

### [x] 17. Define KB visibility rule

- **Goal**: Decide: KB shared to all users vs per-admin docs only
- **Done When**: Policy decision recorded in docs/decisions.md

### [x] 18. Implement KB read policies

- **Goal**: Implement RLS read policies per chosen visibility rule
- **Done When**: Users only read allowed KB content

## Phase 4: Chat Schema

### [x] 19. Create chat_sessions table (migration)

- **Goal**: Optional chat session storage schema
- **Done When**: chat_sessions exists

### [x] 20. Create chat_messages table (migration)

- **Goal**: Optional message storage schema with citations json
- **Done When**: chat_messages exists

### [x] 21. Add RLS to chat tables

- **Goal**: Restrict chats to the owner user
- **Done When**: Users can only see their own chats

## Phase 5: Storage & Configuration

### [x] 22. Create storage bucket (private)

- **Goal**: Create private Supabase Storage bucket for PDFs
- **Done When**: Bucket exists and is private

### [x] 23. Add storage upload policy (admin-only)

- **Goal**: Allow only admins to upload PDFs
- **Done When**: Non-admin upload is denied

### [x] 24. Add storage read policy (controlled)

- **Goal**: Allow read via signed URLs or allowed users
- **Done When**: Docs cannot be publicly fetched

### [x] 25. Add migrations workflow documentation

- **Goal**: Document how to apply migrations to hosted Supabase
- **Done When**: README includes migration steps

### [x] 26. Add decisions log

- **Goal**: Create docs/decisions.md and record core decisions
- **Done When**: Decisions log exists and has initial entries

### [x] 27. Add minimal seed for admin role

- **Goal**: Document how to promote a user to admin safely
- **Done When**: Admin promotion steps are clear + repeatable

### [x] 28. Set up Supabase client helpers

- **Goal**: Create server/client supabase helpers for Next.js
- **Done When**: Helpers used by a sample route

### [x] 29. Add error logging baseline

- **Goal**: Centralize basic logging and error boundaries
- **Done When**: Errors are visible and not swallowed

### [x] 30. Create smoke checklist doc

- **Goal**: Define manual smoke checks for critical flows
- **Done When**: docs/smoke-checklist.md exists
