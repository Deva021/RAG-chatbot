# Specification: Batch 4 — Chat Backend: Retrieval, Answering, Citations, Streaming, History

**Feature Branch**: `004-batch-4-chat`
**Created**: 2026-02-13
**Status**: Draft
**Batch Tasks**: 91–120 (30 tasks)

## Goals

- **Retrieval-Augmented Answering**: Authenticated users ask a question → embed it → vector search → return an evidence-backed answer with clickable citations.
- **Default Mode — Extractive + Citations**: The primary answering mode selects and reformats the best chunk(s) verbatim, appending source metadata. No LLM generation required for MVP.
- **Streaming to UI**: Deliver partial responses incrementally so the user sees content appear in real-time.
- **Chat History (optional)**: Persist sessions, messages, and citations in Supabase for resume and admin metrics.
- **Refusal When Evidence Is Insufficient**: The system MUST decline to answer rather than hallucinate.

## Non-Goals

- **Full LLM generation**: Large model inference (GPT, Claude, etc.) is out of scope. An _optional_ small on-device generation mode via Transformers.js may exist but must not alter the default extractive path.
- **Multi-turn RAG context window**: Each question is embedded independently; conversation history is not fed back into retrieval.
- **Tight integration tests against hosted Supabase**: Per constitution, automated tests mock the DB layer.
- **OCR / image-based knowledge**: Already excluded in Batch 3.

---

## User Scenarios & Acceptance Criteria

### User Story 1 — Ask a Question and Get a Cited Answer (Priority: P0)

As an authenticated user, I want to type a question and receive a concise, citation-backed answer derived from the knowledge base so that I can trust the response.

**Why this priority**: Core value proposition of the chatbot.

**Independent Test**: Send a question whose answer exists in `kb_chunks` → verify the response contains the correct text excerpt and at least one clickable citation linking back to the source document + page.

**Acceptance Scenarios**:

1. **Given** an authenticated user and a populated KB, **When** they ask "What is the refund policy?", **Then** the assistant responds with a short extractive answer and a _Sources_ block listing document title, page number, and section.
2. **Given** a question with multiple relevant chunks, **When** retrieval returns K > 1 chunks above threshold, **Then** the answer merges information from all qualifying chunks and each gets its own citation.
3. **Given** a disabled document, **When** retrieval runs, **Then** chunks from disabled docs are excluded from results.
4. **Given** a duplicate/retried request (same message ID), **When** the server receives it, **Then** only one response is generated (idempotent via message ID).

---

### User Story 2 — Refusal When Knowledge Base Lacks Evidence (Priority: P0)

As a user, I want the bot to honestly say "I don't know" when the KB doesn't contain relevant information so that I'm not misled.

**Why this priority**: Prevents hallucination; critical for trust and correctness.

**Independent Test**: Ask a question completely unrelated to any ingested document → the bot responds with a standardized refusal message and optional next-steps (e.g., "Contact support").

**Acceptance Scenarios**:

1. **Given** a question with no chunks above the similarity threshold, **When** retrieval returns zero qualifying results, **Then** the assistant responds with the refusal template: _"I don't have enough information to answer that. You might try [next-step]."_
2. **Given** a question where all chunks score below the evidence threshold, **When** the max similarity score < `EVIDENCE_THRESHOLD`, **Then** the system treats it as "no evidence" and refuses.

---

### User Story 3 — Streaming Response (Priority: P0)

As a user, I want to see the assistant's response appear incrementally so the experience feels fast and responsive.

**Why this priority**: Users perceive streaming as significantly faster even when total latency is similar.

**Independent Test**: Send a question → verify the UI renders partial content before the full response is complete.

**Acceptance Scenarios**:

1. **Given** a valid question, **When** the server begins responding, **Then** the UI renders text segments as they arrive (not all-at-once).
2. **Given** a streaming response, **When** the sources block is ready, **Then** sources are sent as a final structured segment after the answer text.
3. **Given** a network interruption mid-stream, **When** the connection drops, **Then** the UI shows the partial response received so far plus an error indicator.

---

### User Story 4 — Chat History & Session Resume (Priority: P1)

As an authenticated user, I want my past conversations saved so I can return and review or continue them.

**Why this priority**: Enhances usability but not essential for MVP answering.

**Independent Test**: Start a session → send 2 messages → close the chat → reopen → verify the previous messages and citations are restored.

**Acceptance Scenarios**:

1. **Given** a user's first message, **When** no active session exists, **Then** a new `chat_sessions` row is created with an auto-generated title from the first message.
2. **Given** an existing session, **When** the user sends another message, **Then** both the user message and assistant response (with citations) are appended to `chat_messages`.
3. **Given** a list of sessions, **When** the user visits the history page, **Then** sessions are listed in reverse chronological order with their titles.
4. **Given** a past session, **When** the user clicks it, **Then** messages and citations load and new messages can be appended.

---

### User Story 5 — Citations UX Enhancements (Priority: P2)

As a user, I want to interact with citations: click them, expand to see more sources, and copy answers easily.

**Acceptance Scenarios**:

1. **Given** an answer with sources, **When** the user clicks a citation, **Then** the citation expands to show the full chunk text or navigates to the document.
2. **Given** more than 3 sources, **When** rendered, **Then** a "Show more sources" toggle reveals the rest.
3. **Given** an assistant answer, **When** the user clicks "Copy", **Then** the answer text (without metadata markup) is copied to the clipboard.

---

### User Story 6 — Optional Small-Model Generation Mode (Priority: P3)

As an admin, I want to optionally enable a small on-device generation mode that produces fuller, more natural answers using Transformers.js, without breaking the default extractive mode.

**Acceptance Scenarios**:

1. **Given** the admin toggles generation mode to "small-model", **When** a user asks a question, **Then** the answer is generated by the on-device model using retrieved chunks as context.
2. **Given** generation mode is set to "extractive" (default), **When** the toggle exists, **Then** the extractive path is used and no model is loaded.

---

### Edge Cases

- **Empty KB**: If no documents are ingested, every question triggers refusal with a message like _"The knowledge base is empty. Please contact an admin."_
- **Very long question**: Questions exceeding the embedding model's token limit are truncated with a warning.
- **Concurrent requests**: Multiple users asking simultaneously must not cause race conditions on session creation.
- **Markdown injection in answers**: Chunk content rendered in the UI must be sanitized (no raw HTML, no script tags, no unsafe links).

---

## RAG Flow Details

### End-to-End Pipeline

```
User Question
  │
  ▼
┌─────────────────────────┐
│ 1. Embed Question       │  Transformers.js (client-side by default)
│    Model: all-MiniLM-L6 │  vector(384)
└──────────┬──────────────┘
           │  embedding vector
           ▼
┌─────────────────────────┐
│ 2. Vector Search        │  Supabase pgvector: cosine similarity
│    Top-K = 5            │  Filter: doc.enabled = true
│    + metadata shaping   │  Return: content, doc_title, page, section, url
└──────────┬──────────────┘
           │  ranked chunks [ ]
           ▼
┌─────────────────────────┐
│ 3. Evidence Check       │  max_similarity >= EVIDENCE_THRESHOLD (0.35)?
│                         │  Yes → continue │ No → refusal template
└──────────┬──────────────┘
           │  qualifying chunks
           ▼
┌─────────────────────────┐
│ 4. Answer Construction  │  Extractive (default): select best passages,
│                         │  format as short answer + "Sources:" block
│                         │  ─── OR (optional) ───
│                         │  Small-model: prompt Transformers.js model
│                         │  with chunks as context
└──────────┬──────────────┘
           │  answer + citations
           ▼
┌─────────────────────────┐
│ 5. Stream to UI         │  SSE or chunked transfer; see Streaming Protocol
└─────────────────────────┘
```

### Embedding Location Decision

**Decision**: Default to **client-side** embedding. The client sends the embedding vector (not the raw question text) to `/api/chat`. Server-side embedding is **strictly forbidden** to avoid Vercel 10s timeouts. If client-side embedding fails or is unsupported (e.g., no WASM), the UI must show a "Browser Not Supported" error with a recommendation to use a modern browser.

### Loading & Timeout Safety

To prevent the app from hanging on slow connections:

1. **Loading State**: Show a persistent "Initializing AI..." indicator during the first load.
2. **Timeout**: If `getEmbedder()` does not resolve within 15 seconds, the UI must abort and show a "Connection Timed Out" error with a retry button.
3. **WASM Fallback**: Use a `try/catch` block around the initial model loading to catch "WASM not supported" errors immediately.

### Evidence Threshold & Refusal

- **`EVIDENCE_THRESHOLD`**: `0.35` (cosine similarity). Configurable via environment variable `CHAT_EVIDENCE_THRESHOLD`.
- **Behavior when below threshold**:
  1. Return a structured refusal response (not a stream):
     ```json
     {
       "type": "refusal",
       "message": "I don't have enough information to answer that question. You might try contacting support or rephrasing your question.",
       "suggestions": ["Contact support", "Rephrase your question"]
     }
     ```
  2. Log the unanswered question for admin metrics (optional Task 115).
- **Behavior when KB is empty**: Short-circuit before vector search; return refusal immediately.

### Retrieval SQL Query

```sql
-- Supabase RPC function: match_chunks(query_embedding, match_count, threshold)
SELECT
  c.id            AS chunk_id,
  c.content,
  c.meta,
  d.id            AS document_id,
  d.name          AS document_title,
  d.meta->>'url'  AS document_url,
  1 - (e.embedding <=> $1) AS similarity
FROM kb_embeddings e
JOIN kb_chunks c    ON c.id = e.chunk_id
JOIN kb_documents d ON d.id = c.document_id
WHERE d.status = 'ready'
  AND d.enabled IS NOT FALSE
  AND 1 - (e.embedding <=> $1) >= $2
ORDER BY similarity DESC
LIMIT $3;
```

Parameters: `$1` = query embedding, `$2` = threshold, `$3` = match count (default 5).

### Answer Formatting (Extractive Mode)

```
[Concise answer synthesized from the top chunk(s)]

**Sources:**
1. [Document Title] — Page X, Section Y  [→ link]
2. [Document Title] — Page Z  [→ link]
```

Rules:

- Maximum 3 sentences for the main answer.
- Sources block always present (even if only 1 source).
- Each citation includes: document title, page number (if available), section (if available), and a link/reference ID.

---

## Streaming Protocol

### Transport: Server-Sent Events (SSE)

The `/api/chat` endpoint returns `Content-Type: text/event-stream` for successful answers.

### Event Types

| Event          | Data Shape                                                             | When Sent                                 |
| -------------- | ---------------------------------------------------------------------- | ----------------------------------------- |
| `answer_start` | `{ "session_id": "..." }`                                              | First event; includes session ID          |
| `answer_delta` | `{ "text": "partial text" }`                                           | One or more times as answer builds        |
| `sources`      | `{ "citations": [{ "title", "page", "section", "url", "chunk_id" }] }` | Once, after all answer deltas             |
| `answer_end`   | `{ "message_id": "..." }`                                              | Terminal event; includes final message ID |
| `error`        | `{ "code": "...", "message": "..." }`                                  | On failure; terminal                      |
| `refusal`      | `{ "message": "...", "suggestions": [...] }`                           | When evidence insufficient; terminal      |

### Client Handling

1. Open `EventSource` or `fetch` with `ReadableStream` to `/api/chat`.
2. On `answer_start`: create assistant message bubble, show typing indicator.
3. On `answer_delta`: append text to the bubble incrementally.
4. On `sources`: render citations block below the answer.
5. On `answer_end`: finalize message, remove typing indicator, store `message_id`.
6. On `error` / `refusal`: display appropriate UI.
7. On connection drop: show partial content + retry prompt.

### Non-Streaming Responses

Refusals and errors are sent as regular JSON (`Content-Type: application/json`) with appropriate HTTP status codes, not as SSE — simplifies client error handling.

---

## Chat History Storage

### Data Schema (Hosted Supabase)

**1. `chat_sessions`**

| Column       | Type                  | Notes                             |
| ------------ | --------------------- | --------------------------------- |
| `id`         | uuid, PK              |                                   |
| `user_id`    | uuid, FK → auth.users |                                   |
| `title`      | text                  | Auto-generated from first message |
| `created_at` | timestamptz           |                                   |
| `updated_at` | timestamptz           |                                   |

**2. `chat_messages`**

| Column       | Type                     | Notes                                                                                   |
| ------------ | ------------------------ | --------------------------------------------------------------------------------------- |
| `id`         | uuid, PK                 | Client-generated for idempotency                                                        |
| `session_id` | uuid, FK → chat_sessions |                                                                                         |
| `role`       | text                     | `'user'` or `'assistant'`                                                               |
| `content`    | text                     | Message text                                                                            |
| `citations`  | jsonb                    | `[{ "chunk_id", "document_title", "page", "section", "url" }]` — null for user messages |
| `created_at` | timestamptz              |                                                                                         |

### RLS Policies

- `chat_sessions`: Users can only read/write their own sessions (`user_id = auth.uid()`).
- `chat_messages`: Users can only read/write messages in their own sessions (via join to `chat_sessions`).

### Session Title Generation

On the first user message in a new session, the title is derived by:

1. Taking the first 80 characters of the user's message.
2. Truncating at the last word boundary.
3. Appending `"…"` if truncated.

No LLM is used for title generation (keeping it simple and deterministic).

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST expose `/api/chat` accepting `{ embedding: number[], message: string, session_id?: string, message_id: string }`.
- **FR-002**: System MUST reject unauthenticated requests to `/api/chat` with `401`.
- **FR-003**: System MUST perform vector similarity search using the provided embedding against `kb_embeddings`.
- **FR-004**: System MUST exclude chunks from disabled or non-ready documents.
- **FR-005**: System MUST return a refusal response when no chunk meets `EVIDENCE_THRESHOLD`.
- **FR-006**: System MUST stream answer + citations via SSE for qualifying results.
- **FR-007**: System MUST format answers as extractive text + structured sources block.
- **FR-008**: System MUST deduplicate requests by `message_id` (idempotent).
- **FR-009**: System MUST enforce rate limiting (e.g., 20 requests/minute/user) with a friendly `429` error.
- **FR-010**: System MUST sanitize all rendered chunk content against XSS (no raw HTML/scripts).
- **FR-011** _(optional)_: System SHOULD persist sessions and messages in `chat_sessions` / `chat_messages`.
- **FR-012** _(optional)_: System SHOULD support an alternative small-model generation mode, controlled by admin toggle or env var.

### Key Entities

- **Chat Session**: A conversation thread owned by one user, identified by UUID, titled from the first message.
- **Chat Message**: A single user or assistant turn within a session, with optional citations JSON.
- **Citation**: A reference linking an answer segment to a specific KB chunk + source document metadata.

---

## Risks & Mitigations

| Risk                                                                                | Impact                               | Mitigation                                                                                                                                                        |
| ----------------------------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Embedding location**: Client-side WASM fails on older browsers or restrictive CSP | Users can't chat                     | Detect WASM support; fall back to server-side embedding with clear error if both fail.                                                                            |
| **Model load latency**: First embedding call loads ~30MB model                      | Perceived slowness on first question | Cache model in browser (`IndexedDB` / service worker); show "Loading AI model…" indicator.                                                                        |
| **Rate limits on Supabase**: High traffic exhausts connection pool                  | 5xx errors                           | Rate limit at the API layer (FR-009); use connection pooling; monitor usage.                                                                                      |
| **Prompt injection** (if generation mode enabled)                                   | Adversarial input tricks the model   | Extractive mode is immune (no prompt). For generation mode: sanitize input, limit context window, prepend system instruction "Answer only from provided context." |
| **Stale embeddings**: KB updated but old embeddings remain                          | Wrong answers                        | Embedding model version stored in `kb_embeddings.model`; admin reprocess flow (Batch 3) handles re-embedding.                                                     |
| **Streaming connection drops**                                                      | Partial answers                      | Client renders partial content + "Connection lost" indicator + retry button.                                                                                      |

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: For questions with relevant KB content, the answer includes at least one correct citation ≥ 95% of the time.
- **SC-002**: For questions without relevant KB content, the system refuses (does not fabricate) 100% of the time.
- **SC-003**: Time-to-first-token for streaming responses is under 500ms (after model is cached).
- **SC-004**: Chat history loads past sessions in under 1 second.
- **SC-005**: Rate limiter correctly blocks burst traffic exceeding 20 req/min/user.

---

## Verification Plan

### Automated Tests

**Unit Tests (Jest / Vitest)**:

1. **Evidence Check Logic**:
   - Input: array of chunks with similarity scores → output: qualifying chunks or refusal signal.
   - Test threshold boundary: score at exactly `0.35`, at `0.34` (refuse), at `0.36` (pass).
   - Test empty input array → immediate refusal.

2. **Answer Formatter (Extractive)**:
   - Input: qualifying chunks with metadata → output: formatted answer string with sources block.
   - Verify: correct number of citations, document title / page / section present, max 3 sentences.

3. **Message Deduplication**:
   - Input: same `message_id` sent twice → only one response generated.

4. **Session Title Generation**:
   - Input: "What is the university's policy on academic integrity and plagiarism in submitted coursework?" → output: "What is the university's policy on academic integrity and plagiarism…"
   - Input: "Refund?" → output: "Refund?" (no truncation).

5. **Rate Limiter**:
   - Simulate 25 requests in 1 minute → first 20 succeed, rest return 429.

6. **Sanitization**:
   - Input chunk containing `<script>alert('xss')</script>` → output has script tags stripped/escaped.

**Mocked Retrieval Tests**:

7. **Retrieval Integration (mocked Supabase)**:
   - Mock `match_chunks` RPC → verify `/api/chat` returns correct answer structure.
   - Mock zero-result retrieval → verify refusal response.
   - Mock disabled document → verify its chunks are excluded.

8. **Auth Enforcement**:
   - Call `/api/chat` without auth header → verify 401.
   - Call with valid token → verify 200 / SSE stream.

**Component Tests (React Testing Library / Playwright)**:

9. **Streaming UI**:
   - Mock SSE stream → verify text appears incrementally in the chat bubble.
   - Mock `sources` event → verify citations render below the answer.
   - Mock `error` event → verify error UI.
   - Mock `refusal` event → verify refusal message displays.

10. **Citations Rendering**:
    - Verify clickable citation links.
    - Verify "Show more sources" toggle with > 3 sources.
    - Verify "Copy answer" button copies correct text.

11. **Chat History UI**:
    - Mock session list → verify sessions render in reverse chronological order.
    - Mock session load → verify messages and citations restore.

### Manual Smoke Checklist

| #   | Step                                                                    | Expected                                    |
| --- | ----------------------------------------------------------------------- | ------------------------------------------- |
| 1   | Log in → open chat widget → ask a question present in KB                | Streaming answer with correct citations     |
| 2   | Ask a question NOT in KB                                                | Refusal message with suggestions            |
| 3   | Ask the same question twice rapidly (< 1s)                              | Only one response; no duplicate messages    |
| 4   | Open chat on a fresh browser (cold model load)                          | "Loading AI model…" indicator → then answer |
| 5   | Disable a document in admin → ask a question only that doc answers      | Refusal (disabled doc excluded)             |
| 6   | Kill network mid-stream (DevTools → offline)                            | Partial answer shown + error indicator      |
| 7   | Send > 20 questions in 1 minute                                         | Rate limit message on excess requests       |
| 8   | Close chat → reopen → check session list                                | Previous session appears with title         |
| 9   | Click a past session → verify history loads → send a new message        | Old messages render; new message appends    |
| 10  | If generation mode enabled: toggle to small-model mode → ask a question | Fuller generated answer with citations      |
| 11  | Input `<img src=x onerror=alert(1)>` as question → check answer display | No XSS; content sanitized                   |
