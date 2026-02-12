# Implementation Plan - Batch 1 (Foundation)

This plan implements the core foundation for **AI Landing Page + RAG Chatbot** using **Hosted Supabase** (no local).

## 1. Project Initialization & Tooling

### 1.1 Next.js Setup

- **Why**: Establish the web application framework.
- **Input**: `npx create-next-app`
- **Output**: Next.js App Router + TypeScript + Tailwind.
- **Verification**: `pnpm dev` opens the default Next.js page at `localhost:3000`.

### 1.2 Tooling & Quality

- **Why**: Enforce code style and prevent bad commits.
- **Files**:
  - `.eslintrc.json`: Add strict rules.
  - `.prettierrc`: Project standard formatting.
  - `.husky/`: Pre-commit hooks for lint/type-check.
- **Verification**: `pnpm build` passes without errors.

### 1.3 Environment Variables

- **Why**: Connect to hosted Supabase securely.
- **Files**:
  - `.env.example`: Template for developers.
  - `.env.local`: Valid keys (not committed).
- **Verification**: App can log `NEXT_PUBLIC_SUPABASE_URL` (in dev console).

---

## 2. Supabase Database & Migrations

**Constraint**: All SQL must be idempotent (`IF NOT EXISTS`) and run manually in Supabase Dashboard.

### 2.1 Enable Extensions

- **File**: `supabase/migrations/20260212000000_enable_pgvector.sql`
- **Content**: `CREATE EXTENSION IF NOT EXISTS vector;`
- **Verification**: Run `SELECT * FROM pg_extension WHERE extname = 'vector';` in Supabase SQL Editor.

### 2.2 User Profiles & Roles

- **File**: `supabase/migrations/20260212000001_create_profiles.sql`
- **Purpose**: Store user roles (admin/user) and link to `auth.users`.
- **Schema**:
  - `public.profiles` (`id` references `auth.users`, `role` enum).
  - Trigger `on_auth_user_created` to auto-create profile.
- **Verification**: Sign up a new user; check `profiles` table for new row.

### 2.3 Knowledge Base Schema (Vector Store)

- **File**: `supabase/migrations/20260212000002_create_kb_schema.sql`
- **Schema**:
  - `kb_documents`: Metadata (name, status).
  - `kb_chunks`: Text content.
  - `kb_embeddings`: `vector(384)` column (store dimensions as constant in code too).
  - Index: `ivfflat` or `hnsw` on `kb_embeddings`.
- **Verification**: Insert dummy data into `kb_embeddings` and run a similarity search query.

### 2.4 Chat History Schema

- **File**: `supabase/migrations/20260212000003_create_chat_schema.sql`
- **Schema**: `chat_sessions` and `chat_messages`.
- **Verification**: `SELECT` from tables returns empty result (no errors).

---

## 3. Security (Row Level Security)

**Guideline**: Enable RLS on all tables.

### 3.1 Profiles RLS

- **File**: `supabase/migrations/20260212000004_rls_profiles.sql`
- **Policy**:
  - `SELECT`: Users see own profile.
  - `UPDATE`: Users update own profile.
- **Safety**: Policy `using (auth.uid() = id)`.

### 3.2 Knowledge Base RLS (Admin Only Write)

- **File**: `supabase/migrations/20260212000005_rls_kb.sql`
- **Policy**:
  - `SELECT`: Depends on visibility (start with Admin-only or Authenticated).
  - `INSERT/UPDATE/DELETE`: **Admin only**.
- **Lockout Prevention**: Ensure the initial Admin user is seeded or manually set in DB before enabling strict RLS, OR allow a "break glass" SQL script.

### 3.3 Chat RLS

- **File**: `supabase/migrations/20260212000006_rls_chat.sql`
- **Policy**: Users can only CRUD their own sessions/messages.

---

## 4. Storage

### 4.1 Buckets & Policies

- **File**: `supabase/migrations/20260212000007_storage_buckets.sql`
- **Buckets**: `artifacts` (private).
- **Policies (SQL)**:
  - Insert: Admin only.
  - Select: Admin only (or signed URL).
- **Verification**: Upload file via Dashboard; try to fetch via public URL (should fail).

---

## 5. Verification Checklist

- [ ] **Repo**: `pnpm dev` builds and runs.
- [ ] **DB**: All tables exist in Supabase Dashboard.
- [ ] **Vectors**: `pgvector` extension is active.
- [ ] **Auth**: Sign up works; Profile created automatically.
- [ ] **RLS**:
  - User A cannot see User B's chats.
  - User A cannot write to `kb_documents`.
- [ ] **Storage**: `artifacts` bucket exists and is private.
