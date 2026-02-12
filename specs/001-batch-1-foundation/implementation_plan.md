# Implementation Plan - Batch 1 Foundation

## Goal Description

Implement the core foundation for **AI Landing Page + RAG Chatbot**.

- **Stack**: Next.js 14+, TypeScript, Tailwind.
- **Backend**: Hosted Supabase (PG + Auth + Storage).
- **Scope**: Repo setup, DB schema (migrations), RLS, Storage.

## Phase 1: Repo & Environment

- **Files**: `package.json`, `.eslintrc.json`, `.env.example`, `.env.local`.
- **Action**: Initialize Next.js app, install dependencies, configure linting/formatting.
- **Verification**: `pnpm dev` runs; `pnpm build` passes.

## Phase 2: Supabase & DB Schema

- **Files**: `supabase/migrations/*.sql`.
- **Action**: Create SQL migrations for `pgvector`, `profiles`, `kb_*` tables, `chat_*` tables.
- **Verification**: Run SQL in Supabase Dashboard; Verify tables exist.

## Phase 3: RLS Policies

- **Files**: `supabase/migrations/*.sql`.
- **Action**: enable RLS, add policies for Users (self-access) and Admins (KB-access).
- **Verification**: Test RLS with policies active.

## Phase 4: Storage

- **Files**: `supabase/migrations/*.sql`.
- **Action**: Create `artifacts` bucket, set private, add policies.
- **Verification**: Test upload/download permissions.

## Phase 5: Documentation & Helpers

- **Files**: `README.md`, `docs/decisions.md`, `docs/smoke-checklist.md`, `lib/supabase/*.ts`.
- **Action**: Write docs, set up client helpers.
- **Verification**: Review docs, verified helpers.
