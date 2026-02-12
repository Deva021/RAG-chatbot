# Project Constitution

## 1. Engineering Principles

### Clarity > Cleverness

- Code must be understandable by a junior engineer.
- Avoid premature optimization or "clever" one-liners that obscure intent.
- **Simple First**: Start with the simplest solution (YAGNI). Refactor to complexity only when requirements demand it.

### Correctness & Reliability

- Features must work as intended and handle edge cases gracefully.
- **crash-free**: The app should never crash due to unhandled exceptions.

### Testing Strategy

- **Test-Driven / Test-First**: Write tests (or at least plan them) before implementation.
- **No Hosted Supabase in Tests**: Do **not** rely on hosted Supabase in automated tests. Use mocks/stubs to prevent data corruption and flakiness.
- **Manual Smoke Checklist**: Mandatory manual verification for critical flows (e.g., PDF ingestion).

## 2. Security Baseline

### Authorization by Default

- **RLS (Row Level Security)**: MUST be enabled on all tables containing user data or sensitive content.
- **Least Privilege**: Service Role keys must NEVER be exposed to the client.
- **Validation**: validate all inputs at the system boundary (API routes, RLS policies).

### Data Protection

- Admin uploads must go to private storage buckets.
- Only admins can manage the knowledge base.

## 3. Developer Experience (DX)

### File Naming & Structure

- Use `kebab-case` for file and directory names (e.g., `user-profile.tsx`, `api-utils.ts`).
- Follow the project structure defined in `ARCHITECTURE_GUIDE.md`.

### Source of Truth

- **Spec/Plan/Tasks**: The `spec/`, `plan/`, and `tasks/` (or `task.md`) files are the source of truth. Update them before writing code.
- **Commit Hygiene**: Write clear, descriptive commit messages. standard conventional commits are preferred (e.g., `feat: add user login`).

## 4. Performance Expectations

### Database

- Avoid N+1 queries.
- Use pagination for lists.
- Add indexes for frequently queried columns (especially for `pgvector` searches).

### Client-Side Processing

- **Avoid Serverless Timeouts**: Heavy ingestion tasks (PDF extraction, chunking, embedding) should happen **client-side** where possible (Admin contexts).
- **Transformers.js**: Use efficient models; cache models in memory.

## 5. Repo-Specific Defaults

### Architecture & Stack (from Architecture Guide)

- **Stack**: Next.js (App Router) + TypeScript.
- **Backend/DB**: **Hosted Supabase** (Auth + Postgres + Storage). No local Supabase.
- **AI/ML**:
  - **Embeddings**: Transformers.js (run client-side or server-side as needed).
  - **Vector Search**: `pgvector` on Supabase.
  - **Generation**: Extraction + Citations preferred over open-ended generation.
- **Editor Prompts**: Prefer concise prompts; avoid dumping huge documentation blocks.

### User-Provided Constraints (from ARCHITECTURE_GUIDE.md)

1. **Hosted Supabase Only**: No local Supabase development environment.
2. **Transformers.js**: Used for embeddings to keep costs at $0.
3. **Client-Side Ingestion**: To avoid Vercel timeouts, admin ingestion (PDF parsing, chunking, embedding) runs in the browser.
4. **Testing**: Automated tests must NOT touch the live Supabase instance.
5. **No Ollama**: Ollama is not used; purely Transformers.js + Supabase.
