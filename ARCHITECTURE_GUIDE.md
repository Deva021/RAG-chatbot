# Architecture Guide — Hosted Supabase + Full JS + Transformers.js (Zero-Budget)

> This guide captures the **recommended architecture** based on the final decisions:
>
> - **Hosted Supabase (cloud)** (no local Supabase at all)
> - **Full JS/TS** implementation
> - **Transformers.js** for embeddings (and optionally generation)
> - **Testing strategy** avoids tight coupling to hosted Supabase

---

## 1) Final Decisions (Confirmed)

### Stack

- **Frontend/Backend:** Next.js (App Router) + TypeScript
- **Auth/DB/Storage:** Hosted Supabase (Auth + Postgres + Storage)
- **Vector search:** Postgres + **pgvector** on Supabase
- **Embeddings:** **Transformers.js**
- **Generation:** Prefer **extraction + citations** for speed; optional small local generation model via Transformers.js

### Constraints & Acceptances

- **Gotcha #1 accepted:** Avoid tight integration tests against hosted Supabase to prevent accidental data corruption.
- **Gotcha A accepted:** Transformers.js model size/performance requires careful choices (especially client-side).
- **Gotcha B accepted:** Avoid serverless timeouts by doing heavy ingestion work client-side (Admin only).
- Gotcha #2 (Ollama security/hosting) is **not applicable** because Ollama is not used.

---

## 2) Recommended Architecture (Decision-Optimized)

### 2.1 Ingestion (Admin Only — Client-Side Pipeline)

**Goal:** Avoid serverless timeouts and keep costs at $0.

**Pipeline**

1. Admin uploads PDF to **Supabase Storage** (private)
2. Extract text using **client-side PDF parser**
3. Chunk in the browser
4. Embed each chunk using **Transformers.js**
5. Insert into `kb_chunks` + `kb_embeddings` (pgvector) in Supabase

**Why client-side ingestion**

- No long-running server job
- No Vercel/serverless execution limits
- Faster iteration for competition demos
- Keeps infra simple: only Supabase + Next.js

---

### 2.2 Chat (User — Retrieval + Grounded Answer)

**Pipeline**

1. User asks a question
2. Compute question embedding with **Transformers.js**
   - Choose where:
     - **Client-side** (cheap & simple)
     - **Server-side** (more consistent, but can hit serverless limits if model is large)
3. Server queries Supabase **pgvector** for top-K relevant chunks (fast/cheap)
4. Generate response:

#### Option 1 (Simple)

- **Client-side generation** using a small Transformers.js model
- Always show citations

Pros:

- End-to-end “AI chat” feel (streaming)
- No paid APIs

Cons:

- Heavy on client devices
- Model download time

#### Option 2 (Fastest + Most Reliable) ✅ Recommended for Competition

- **Extractive response + citations**
- Produce a concise answer by:
  - selecting best 2–4 chunks
  - summarizing them into an answer (rules-based + lightweight prompt template)
  - always attaching sources

Pros:

- Very fast
- Low CPU
- Works on weaker devices
- Judge trust increases due to citations

Cons:

- Less “creative” chat feel (but more correct)

---

## 3) Database Model (Minimum)

### Tables

- `profiles`
  - `id`, `email`, `role` (`user` | `admin`)
- `kb_documents`
  - `id`, `title`, `source_type` (`pdf` | `url` | `text`), `storage_path`, `checksum`, `status`
- `kb_chunks`
  - `id`, `document_id`, `chunk_index`, `content`, `metadata (jsonb)`
- `kb_embeddings`
  - `chunk_id`, `embedding (vector)`, `model`, `dims`
- (Optional) `chat_sessions`, `chat_messages` for history

### Vector Query

- Filter by active docs + permissions
- Retrieve `top_k` chunks by similarity
- Return metadata needed for citations: doc title, page, section, url

---

## 4) Security (Keep It Simple, Still Correct)

these are minimal musts:

- Supabase **RLS on** for user data (sessions/messages).
- Storage bucket for PDFs should be **private**.
- Only admins can upload/manage documents.
- Service Role key never goes to the client.

---

## 5) Testing Strategy (Aligned with Gotcha #1)

### Principle

Do **not** rely on hosted Supabase in automated tests.

### What to test strongly (without Supabase)

- Chunking correctness
- Embedding pipeline wrapper logic (mock embeddings)
- Retriever query builder (mock DB results)
- Prompt assembly / answer formatting
- Citation formatting & “refuse when no evidence” rules

### Recommended Test Layers

1. **Unit tests (strong)**
   - chunker, citation formatting, response generator rules
2. **Component tests**
   - chat widget UI states (streaming, typing, citations)
3. **Mocked integration tests**
   - mock Supabase client responses for retrieval
4. **Manual smoke checklist (mandatory)**
   - Upload PDF → processed → ask question → answer has citations

### Manual Smoke Checklist (Minimum)

- Admin uploads PDF → document becomes `ready`
- Ask question contained in PDF → response includes correct sources
- Ask question not in KB → bot refuses and suggests uploading docs

---

## 6) Transformers.js Performance Notes (Aligned with Gotcha A)

### Model selection rules

- Prefer **small embedding model** for speed
- Cache the embedding model in memory after first load
- Use batching for chunk embeddings

### UX handling

- On first use:
  - show “Loading AI model…” progress
  - store a “model ready” flag
- For low-power devices:
  - default to **Option 2** (extractive answer)

---

## 7) Ingestion Notes (Aligned with Gotcha B)

### PDF extraction in browser

- Use a client-side PDF text extraction library
- Store page numbers in metadata
- Handle scanned PDFs gracefully (no OCR in $0 MVP)

### Chunking rules

- consistent size + overlap
- store `chunk_index`
- store `page_start/page_end` if possible

---

## 8) Product-Level Suggestion (Landing Page Access)

### Suggested approach (optional)

- Keep **landing page public**
- Require login for:
  - chatbot usage
  - admin knowledge-base page
    If competition rules require auth everywhere, keep it fully gated.

---

## 9) Recommended Default for Winning a Competition

If you want the best chance to win:

- Use **Option 2** (extractive + citations) as default
- Add streaming UI + typing indicator (still feels “AI”)
- Always show sources (trust wins)

---

## 10) Implementation Plan Snapshot (Very Short)

1. Supabase hosted project: schema + RLS + private storage bucket
2. Auth pages + protected routes
3. Admin upload UI
4. Client-side ingestion: extract → chunk → embed → insert
5. Chat: embed question → pgvector search → answer + citations
6. Tests: unit + component + mocked integration + manual smoke checklist

---

**End of Guide**
