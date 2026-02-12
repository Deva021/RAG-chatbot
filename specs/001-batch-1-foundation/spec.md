# Feature Specification: Batch 1 — Foundation

**Feature Branch**: `001-batch-1-foundation`
**Created**: 2026-02-12
**Status**: Draft
**Input**: Batch 1 - Foundation: Repo, Hosted Supabase, DB Schema, RLS, Storage

## Overview

Establish the core foundation for an **AI Landing Page + RAG Chatbot**. This batch sets up the Next.js application skeleton, connects it to a **Hosted Supabase** project (Auth, Postgres, Storage), and implements the database schema required for user profiles, knowledge base (vectors), and chat history.

**Key Constraints**:

- **NO Local Supabase**: All development against the hosted project.
- **Manual Migrations**: SQL files committed to repo, executed manually in Supabase Dashboard SQL Editor.
- **Security**: strict RLS for user data; Admin-only write access for KB.

## Goals

1.  **Initialize Project**: Next.js App Router + TypeScript, ESLint, Prettier, Husky.
2.  **Connect Cloud Infrastructure**: Provision hosted Supabase and configure environment variables.
3.  **Implement Data Model**: Tables for Users, KB (Docs/Chunks/Embeddings), and Chat using `pgvector`.
4.  **Secure Access**: Implement RLS policies for all tables and Storage buckets.

## User Scenarios & Testing

### User Story 1 - Project Initialization (Priority: P0)

As a developer, I need a stable repo with verified connections to Hosted Supabase so I can build features without infrastructure issues.

**Acceptance Scenarios**:

1.  **Given** a fresh clone, **When** I run `pnpm install && pnpm dev`, **Then** the app starts at `localhost:3000`.
2.  **Given** valid `.env.local` keys, **When** the app starts, **Then** it can connect to Supabase (verified via a simple query or auth check).

### User Story 2 - User Profiles (Priority: P1)

As a user, I want a profile automatically created when I sign up so that my application role and data are stored.

**Acceptance Scenarios**:

1.  **Given** a new user signs up (via Supabase Auth), **When** the trigger fires, **Then** a row is created in `public.profiles`.
2.  **Given** I am a logged-in user, **When** I query `profiles`, **Then** I only see my own profile (RLS).

### User Story 3 - Knowledge Base Management (Priority: P1)

As an Admin, I want to store documents and their vector embeddings so the chatbot has context.

**Acceptance Scenarios**:

1.  **Given** I am an Admin, **When** I upload a PDF to the `private` storage bucket, **Then** it succeeds.
2.  **Given** I am a normal User, **When** I try to upload, **Then** it fails (RLS/Storage Policy).
3.  **Given** document chunks, **When** I insert them into `kb_embeddings`, **Then** `pgvector` accepts the standard vector format.

### User Story 4 - Chat History (Priority: P2)

As a user, I want my chat history saved so I can review past conversations.

**Acceptance Scenarios**:

1.  **Given** I am logged in, **When** I save a message to `chat_messages`, **Then** it is persisted.
2.  **Given** I am User A, **When** I try to read User B's chats, **Then** I receive no data (RLS).

## Data Model

### Extensions

- **`vector`**: Enabled for embedding search.

### Tables

1.  **`public.profiles`**
    - `id` (uuid, PK, ref `auth.users`)
    - `role` (enum: `admin`, `user`)
    - `created_at`

2.  **`public.kb_documents`**
    - `id` (uuid, PK)
    - `name` (text)
    - `status` (text)
    - `metadata` (jsonb)

3.  **`public.kb_chunks`**
    - `id` (uuid, PK)
    - `document_id` (fk `kb_documents`)
    - `chunk_index` (int)
    - `content` (text)

4.  **`public.kb_embeddings`**
    - `id` (uuid, PK)
    - `chunk_id` (fk `kb_chunks`)
    - `embedding` (vector(384)) _Note: Dimension depends on model_

5.  **`public.chat_sessions`**
    - `id` (uuid, PK)
    - `user_id` (fk `auth.users`)

6.  **`public.chat_messages`**
    - `id` (uuid, PK)
    - `session_id` (fk `chat_sessions`)
    - `role` (user/assistant)
    - `content` (text)
    - `citations` (jsonb)

### Storage

- **Bucket**: `artifacts` (Private)
- **Policies**:
  - `SELECT`: Admin only (or signed URLs)
  - `INSERT/UPDATE/DELETE`: Admin only

## Migration Strategy

- **Location**: `supabase/migrations/*.sql`
- **Format**: Standard timestamped SQL files (e.g., `20240101120000_init_schema.sql`).
- **Execution**: Manual copy-paste into Supabase SQL Editor.
- **Tracking**: Since no CLI/migration tool is connected to the hosted instance, we will manually verify `done_when` criteria. **Crucial**: SQL must be idempotent (`IF NOT EXISTS`) to prevent errors on re-runs.

## Requirements

### Functional Requirements

- **FR-001**: System MUST connect to hosted Supabase using environment variables.
- **FR-002**: Database MUST support vector search via `pgvector`.
- **FR-003**: RLS MUST prevent cross-user data access for Profiles and Chats.
- **FR-004**: Only users with `admin` role can write to KB tables.

### Developer Experience

- **DX-001**: `npm run dev` starts the full stack (frontend).
- **DX-002**: `npm run lint` and `npm run format` ensure code quality.

## Risks & Edge Cases

- **RLS Lockout**: If Admin policies are incorrect, no one can manage the KB. _Mitigation: Seed an initial admin user carefully._
- **Vector Dimension Mismatch**: If the embedding model changes, DB vector column dimensions will break. _Mitigation: Define dimension constant in code and match migration._
- **Manual Migration Drift**: Hosted DB might drift from local SQL files. _Mitigation: "Code is Truth" - always update SQL file first, then apply._

## Testing Strategy

Since we cannot run automated integration tests against the hosted production DB easily in this batch:

1.  **Manual Smoke Checks**: Follow `docs/smoke-checklist.md`.
    - Sign up a new user.
    - Verify profile creation in Supabase Dashboard.
    - Check RLS by trying to query other users' data (should return empty).
2.  **Lint/Type Check**: Automated via CI or pre-commit hooks.
