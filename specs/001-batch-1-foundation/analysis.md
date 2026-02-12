# Analysis: Batch 1 — Foundation

This report evaluates the specification, implementation plan, and task list for the foundation of the CSEC RAG Chatbot.

## Summary of Intent

Batch 1 establishes the core infrastructure using Next.js (App Router) and Hosted Supabase. It focuses on repository initialization, database schema implementation (Profiles, Knowledge Base, Chat), and strictly enforced Row Level Security (RLS). This foundational work is critical for enabling subsequent RAG features while maintaining a $0 infrastructure cost using Transformers.js for client-side/edge embeddings.

## Gaps & Missing Requirements

- **Embedding Model Specifics**: The vector dimension is set to `384`, but the specific `transformers.js` model (e.g., `all-MiniLM-L6-v2`) is not named. This is a "hard" dependency for indexing.
- **Admin "Bootstrap" Process**: There is a circular dependency risk: you need an Admin to manage the KB, but RLS prevents setting an Admin unless you are already an Admin or use the SQL Editor. The process for promoting the first user to `admin` role should be explicitly documented.
- **Chunking Strategy**: While `kb_chunks` exists, requirements for chunk size or overlap (essential for RAG performance) are missing.
- **Environment Variable List**: The specific keys for `.env.local` (URL, Anon Key, etc.) are not enumerated in the spec.

## Ambiguities

- **KB Visibility (Task 17)**: The decision between "global KB" and "per-user KB" is deferred but affects Phase 3 RLS policies.
- **Storage Read Logic**: It's unclear if citations will use signed URLs (short-lived) or if the `artifacts` bucket will allow authenticated `SELECT` access for all users.
- **Ingestion Auth Flow**: The Constitution mandates browser-based ingestion. It needs to be clarified if this uses the logged-in user's JWT (requiring strict RLS) or a specific service flow.

## Risks

- **Admin Lockout (Critical)**: Applying strict RLS to the `profiles` or `kb_*` tables before the first user is promoted to `admin` will block all KB management.
- **Manual Migration Drift (High)**: As there is no automated migration tool, the hosted Supabase instance and repo SQL files can easily diverge.
- **Vector Dimension Fragility**: Hardcoding `384` makes switching models later a breaking change for the entire database.

## Dependency & Order Check

- **Order Correct**: Extension enabling -> Profile creation -> RLS setup.
- **Constraint**: Task 17 (Visibility Decision) must be completed **before** starting Phase 3 (RLS Implementation) to avoid rework.

## Scope Creep / Over-engineering

- **Chat History (Phase 4)**: Including chat persistence in the "Foundation" batch adds complexity (Sessions, Messages, RLS) that might be better suited for a "Batch 1.1" or "Batch 2" once the core KB + RAG flow is verified.

## Concrete Fixes

- **[MODIFY] [spec.md](file:///home/dawa/Documents/CSEC/specs/001-batch-1-foundation/spec.md)**: Explicitly name the embedding model `Xenova/all-MiniLM-L6-v2` to match the 384 dimensions.
- **[MODIFY] [plan.md](file:///home/dawa/Documents/CSEC/specs/001-batch-1-foundation/plan.md)**: Add a "Bootstrap" step to Section 2.2: "Promote the first user to admin via SQL Editor: `UPDATE profiles SET role = 'admin' WHERE id = '...';`".
- **[MODIFY] [tasks.md](file:///home/dawa/Documents/CSEC/specs/001-batch-1-foundation/tasks.md)**: Move Task 17 (Visibility Decision) to the beginning of Phase 3.
- **[NEW] [decisions.md](file:///home/dawa/Documents/CSEC/docs/decisions.md)**: Initialize this file immediately to resolve the KB Visibility ambiguity.

---

**Next recommended command**: `/speckit.clarify` to resolve the KB visibility and storage policies.
