# Implementation Plan: Batch 4 — Chat Backend

**Branch**: `004-batch-4-chat` | **Date**: 2026-02-13 | **Spec**: [spec.md](file:///home/dawa/Documents/CSEC/specs/004-batch-4-chat/spec.md)

## Summary

Wire up the full RAG chat pipeline: `/api/chat` receives a question embedding from the client, queries pgvector for top-K chunks, applies an evidence threshold, assembles an extractive answer with citations, and streams it back via SSE. Optionally persist chat sessions and messages in Supabase. All automated tests mock Supabase — no hosted dependency.

## Technical Context

**Language/Version**: TypeScript 5.x (Next.js 14 App Router)
**Primary Dependencies**: `@supabase/supabase-js`, `@huggingface/transformers`, `lucide-react`
**Storage**: Hosted Supabase (Postgres + pgvector + Auth)
**Testing**: Vitest (to be configured; no test framework exists yet)
**Target Platform**: Vercel (Web)
**Constraints**: SSE streaming < 10s function timeout; **STRICT** client-side embedding; no hosted Supabase in tests; 15s UI timeout for model load.

## Constitution Check

| Gate                           | Status                                                       |
| ------------------------------ | ------------------------------------------------------------ |
| No local Supabase              | ✅ All DB via hosted Supabase + SQL migrations               |
| No hosted Supabase in tests    | ✅ Mocked retrieval; no live DB calls                        |
| RLS on user data tables        | ✅ `chat_sessions` / `chat_messages` RLS planned             |
| Service keys never on client   | ✅ Server route uses server client                           |
| Client-side embedding default  | ✅ Client sends vector; server never imports Transformers.js |
| Extractive + citations default | ✅ No LLM generation in default path                         |

---

## Project Structure

### Source Code (new & modified files)

```text
src/
├── app/
│   └── api/
│       └── chat/
│           └── route.ts               ← [MODIFY] Replace placeholder with POST handler + SSE
├── lib/
│   ├── rag/
│   │   ├── embedder.ts                ← [EXISTING] Client-side singleton — add embedQuestion() helper
│   │   ├── retriever.ts               ← [MODIFY] Implement match_chunks RPC call
│   │   ├── prompt.ts                  ← [MODIFY] Implement extractive answer formatter
│   │   ├── evidence.ts                ← [NEW] Evidence threshold check + refusal logic
│   │   └── types.ts                   ← [NEW] Shared types (RetrievedChunk, Citation, ChatRequest, etc.)
│   ├── chat/
│   │   ├── session.ts                 ← [NEW] Session creation, title generation, resume
│   │   ├── messages.ts                ← [NEW] Message persistence + deduplication
│   │   └── rate-limit.ts              ← [NEW] In-memory sliding window rate limiter
│   └── sanitize.ts                    ← [NEW] Markdown/HTML sanitizer for chunk content
├── components/
│   └── chat/
│       ├── chat-widget.tsx            ← [MODIFY] Replace mock streaming with real SSE client
│       ├── citation.tsx               ← [MODIFY] Add chunk_id, url, "show more" toggle
│       ├── message-bubble.tsx         ← [MODIFY] Add safe markdown rendering
│       ├── typing-indicator.tsx       ← [EXISTING] No changes
│       ├── chat-history.tsx           ← [NEW] Session list + resume
│       └── copy-button.tsx            ← [NEW] Copy answer to clipboard

supabase/
└── migrations/
    ├── 20260213100000_match_chunks_rpc.sql   ← [NEW] pgvector RPC function
    └── 20260213200000_chat_history.sql       ← [NEW] chat_sessions + chat_messages tables + RLS

__tests__/                             ← [NEW] Test directory
├── setup.ts                           ← [NEW] Vitest global setup
├── lib/
│   ├── evidence.test.ts               ← [NEW]
│   ├── prompt.test.ts                 ← [NEW]
│   ├── rate-limit.test.ts             ← [NEW]
│   ├── session.test.ts                ← [NEW]
│   └── sanitize.test.ts              ← [NEW]
└── api/
    └── chat.test.ts                   ← [NEW] Mocked integration test for route
```

---

## Implementation Steps

Steps are dependency-ordered. Each step lists the files it touches and its batch task IDs.

---

### Phase 0 — Foundation: Types, Migration, Test Setup

#### Step 0.1 — Shared RAG Types

**Tasks**: —
**File**: `src/lib/rag/types.ts` [NEW]

Define TypeScript types used across the pipeline:

- `RetrievedChunk` — `{ chunk_id, content, document_id, document_title, page, section, url, similarity }`
- `Citation` — `{ chunk_id, document_title, page, section, url }`
- `ChatRequest` — `{ embedding: number[], message: string, session_id?: string, message_id: string }`
- `ChatResponse` — union of `AnswerStream | Refusal | ErrorResponse`
- `SSEEvent` — `answer_start | answer_delta | sources | answer_end | error | refusal`

#### Step 0.2 — `match_chunks` RPC Migration

**Tasks**: 95, 96, 97
**File**: `supabase/migrations/20260213100000_match_chunks_rpc.sql` [NEW]

SQL function for pgvector retrieval:

- Parameters: `query_embedding vector(384)`, `match_count int`, `threshold float`
- JOINs: `kb_embeddings` → `kb_chunks` → `kb_documents`
- Filters: `status = 'ready'`, `enabled IS NOT FALSE`
- Returns: `chunk_id, content, meta, document_id, document_title, document_url, similarity`
- Ordered by cosine similarity DESC, limited to `match_count`

#### Step 0.3 — Chat History Migration

**Tasks**: 110, 111
**File**: `supabase/migrations/20260213200000_chat_history.sql` [NEW]

- Create `chat_sessions` table: `id, user_id, title, created_at, updated_at`
- Create `chat_messages` table: `id (client-generated), session_id, role, content, citations (jsonb), created_at`
- RLS: users read/write own sessions only; messages scoped via session ownership

#### Step 0.4 — Vitest Setup

**Tasks**: —
**Files**: `vitest.config.ts` [NEW], `__tests__/setup.ts` [NEW], `package.json` [MODIFY]

- Install `vitest` + `@testing-library/react` as dev dependencies
- Configure path aliases (`@/` → `src/`)
- Global setup file for common mocks (Supabase client mock)

---

### Phase 1 — Retrieval Pipeline (Server)

#### Step 1.1 — Retriever

**Tasks**: 95, 96, 97
**File**: `src/lib/rag/retriever.ts` [MODIFY — currently empty]

- Export `matchChunks(embedding: number[], options?: { matchCount?: number, threshold?: number }): Promise<RetrievedChunk[]>`
- Calls Supabase RPC `match_chunks` using server client
- Default `matchCount = 5`, `threshold = 0.35` (from env `CHAT_EVIDENCE_THRESHOLD`)
- Maps RPC result rows to `RetrievedChunk` type

#### Step 1.2 — Evidence Check

**Tasks**: 98, 99
**File**: `src/lib/rag/evidence.ts` [NEW]

- Export `checkEvidence(chunks: RetrievedChunk[]): { pass: true, chunks: RetrievedChunk[] } | { pass: false, refusal: RefusalResponse }`
- If `chunks.length === 0` → refusal
- If `max(similarity) < EVIDENCE_THRESHOLD` → refusal
- Refusal template: `{ type: 'refusal', message: '...', suggestions: ['Contact support', 'Rephrase your question'] }`

#### Step 1.3 — Extractive Answer Formatter

**Tasks**: 100, 101
**File**: `src/lib/rag/prompt.ts` [MODIFY — currently empty]

- Export `formatExtractiveAnswer(chunks: RetrievedChunk[]): { text: string, citations: Citation[] }`
- Selects the top chunk's content (≤ 3 sentences)
- Merges overlapping chunks if they come from the same page
- Builds `Citations[]` array from chunk metadata
- Output: `{ text: "short answer...", citations: [{ title, page, section, url, chunk_id }] }`

#### Step 1.4 — Content Sanitizer

**Tasks**: 109
**File**: `src/lib/sanitize.ts` [NEW]

- Export `sanitizeMarkdown(raw: string): string`
- Strip `<script>`, `<iframe>`, `on*` attributes, `javascript:` URLs
- Allow safe markdown: bold, italic, lists, code blocks, links (http/https only)
- Uses a simple regex-based approach (no heavy dependency)

---

### Phase 2 — API Route & Streaming

#### Step 2.1 — `/api/chat` Route (Auth + Input Validation)

**Tasks**: 91, 92, 105
**File**: `src/app/api/chat/route.ts` [MODIFY — replace placeholder]

- Change method from `GET` to `POST`
- Parse body: validate `ChatRequest` shape (embedding must be `number[384]`, message_id must be string)
- Auth: create Supabase server client → `getUser()` → reject with `401` if unauthenticated
- Deduplication: check if `message_id` already exists in `chat_messages` → if so, return cached response / no-op
- On validation failure: `400` with structured error

#### Step 2.2 — Streaming Response (SSE)

**Tasks**: 102
**File**: `src/app/api/chat/route.ts` [continued from Step 2.1]

- After retrieval + answer assembly, return `new Response(stream, { headers: { 'Content-Type': 'text/event-stream', ... } })`
- Use `ReadableStream` with `TransformStream` controller to emit SSE events:
  1. `answer_start` → `{ session_id }`
  2. `answer_delta` → emit answer text in 2–3 word chunks (simulate stream for extractive mode)
  3. `sources` → `{ citations: [...] }`
  4. `answer_end` → `{ message_id }`
- For refusals: return regular JSON `{ type: 'refusal', ... }` with `200` status (not SSE)
- For errors: return JSON with `4xx/5xx`

#### Step 2.3 — Rate Limiter

**Tasks**: 106
**File**: `src/lib/chat/rate-limit.ts` [NEW]

- Export `checkRateLimit(userId: string): { allowed: boolean, retryAfterMs?: number }`
- In-memory sliding window: 20 requests/minute per user
- For Vercel (serverless): use a Map with TTL cleanup — good enough for per-instance limiting
- Returns `429` with `Retry-After` header when exceeded

#### Step 2.4 — Wire Rate Limiter into Route

**Tasks**: 106
**File**: `src/app/api/chat/route.ts` [continued]

- Before retrieval: call `checkRateLimit(user.id)`
- If not allowed: return `429` with `{ code: 'RATE_LIMITED', message: '...', retryAfterMs }`

---

### Phase 3 — Chat History Persistence

#### Step 3.1 — Session Manager

**Tasks**: 110, 114
**File**: `src/lib/chat/session.ts` [NEW]

- `getOrCreateSession(userId: string, sessionId?: string, firstMessage?: string): Promise<string>` → returns session ID
- If `sessionId` provided and exists: return it, touch `updated_at`
- If not: create new row, generate title from first message (first 80 chars, word boundary, ellipsis)
- Uses server Supabase client

#### Step 3.2 — Message Persistence

**Tasks**: 111, 105
**File**: `src/lib/chat/messages.ts` [NEW]

- `saveMessage(msg: { id: string, sessionId: string, role: 'user'|'assistant', content: string, citations?: Citation[] }): Promise<void>`
- `getMessageById(id: string): Promise<ChatMessage | null>` — for deduplication check
- `getSessionMessages(sessionId: string): Promise<ChatMessage[]>` — for resume
- Uses Supabase upsert on `id` (client-generated UUID) for idempotency

#### Step 3.3 — Integrate Persistence into Route

**Tasks**: 110, 111
**File**: `src/app/api/chat/route.ts` [continued]

- After auth: `getOrCreateSession(...)` to get/create session
- Save user message via `saveMessage()`
- After answer assembly: save assistant message + citations via `saveMessage()`

---

### Phase 4 — Client UI Wiring

#### Step 4.1 — Embed Question on Client

**Tasks**: 93, 94
**File**: `src/lib/rag/embedder.ts` [MODIFY — add helper]

- Add `embedQuestion(text: string): Promise<number[]>` — convenience wrapper around the existing singleton
- **Timeout Logic**: Implement a `Promise.race()` to wrap the model load with a 15-second timeout.
- **Error Handling**: Throw specific error codes (`ERR_WASM_UNSUPPORTED`, `ERR_LOAD_TIMEOUT`) for the UI to catch.
- Returns flat `number[384]` array.

#### Step 4.2 — Chat Widget → Real SSE

**Tasks**: 103
**File**: `src/components/chat/chat-widget.tsx` [MODIFY]

- Replace `simulateStream()` with `sendMessage()`:
  1. Call `embedQuestion(input)` to get embedding vector
  2. `fetch('/api/chat', { method: 'POST', body: JSON.stringify({ embedding, message, message_id, session_id }) })`
  3. If response is JSON (refusal/error): display message
  4. If SSE stream: parse `EventSource`-style lines → on `answer_delta` append text, on `sources` render citations, etc.
- Show "Loading AI model…" indicator during first `embedQuestion()` call
- Handle rate limit (`429`) with user-friendly message
- Extend `Message` interface to include `citations?: Citation[]` and `message_id: string`

#### Step 4.3 — Citation Component Enhancements

**Tasks**: 104, 117
**File**: `src/components/chat/citation.tsx` [MODIFY]

- Add `chunk_id`, `url` to `CitationProps.source`
- Clickable: link to document URL or expand to show chunk text
- "Show more sources" toggle when > 3 citations
- Style update: match dark theme of chat widget

#### Step 4.4 — Safe Markdown Rendering in Bubbles

**Tasks**: 109
**File**: `src/components/chat/message-bubble.tsx` [MODIFY]

- Render assistant messages through `sanitizeMarkdown()` → then via a lightweight markdown renderer (e.g., `react-markdown` or simple regex-based)
- User messages remain plain text

#### Step 4.5 — Copy Answer Button

**Tasks**: 118
**File**: `src/components/chat/copy-button.tsx` [NEW]

- Small button rendered below assistant messages
- Copies plain-text answer (without citations markup) to clipboard via `navigator.clipboard.writeText()`
- Visual feedback: icon changes to checkmark for 2 seconds

#### Step 4.6 — Chat History UI

**Tasks**: 112, 113
**File**: `src/components/chat/chat-history.tsx` [NEW]

- Fetches user's sessions from Supabase (`chat_sessions` ordered by `updated_at DESC`)
- Renders as a sidebar or overlay list: title, last message time
- On click: loads session messages → hydrates chat widget → new messages append
- Wire into `chat-widget.tsx` with a `session_id` state prop

---

### Phase 5 — Polish & Optional Features

#### Step 5.1 — Error Mapping

**Tasks**: 119
**File**: `src/app/api/chat/route.ts` + `src/components/chat/chat-widget.tsx`

- Map server error codes to user-friendly messages:
  - `401` → "Please log in to use the chat."
  - `429` → "You're sending messages too fast. Please wait {N} seconds."
  - `500` → "Something went wrong. Please try again."
  - `refusal` → display the refusal message and suggestions
- Client shows error inline in the chat bubble (never as a browser alert)

#### Step 5.2 — Optional: Admin Chat Metrics

**Tasks**: 115
**File**: `src/app/admin/chat-metrics/page.tsx` [NEW] (optional)

- Query `chat_messages` for top questions (group by content similarity or exact match)
- Show unanswered count (messages that triggered refusals)
- Simple table view; no real-time analytics

#### Step 5.3 — Optional: Retrieval Caching

**Tasks**: 116
**File**: `src/lib/rag/retriever.ts` [MODIFY]

- Add in-memory LRU cache for embedding → retrieval results
- Cache key: hash of embedding vector (first 10 components as string)
- TTL: 5 minutes
- Skip cache when `CHAT_CACHE_DISABLED=true`

#### Step 5.4 — Optional: Small-Model Generation Mode

**Tasks**: 107, 108
**Files**: `src/lib/rag/prompt.ts` [MODIFY], `src/app/api/chat/route.ts` [MODIFY]

- Add `formatGeneratedAnswer(chunks, question)` to `prompt.ts` — builds a prompt and runs a small Transformers.js text-generation model
- Toggle via env var `CHAT_ANSWER_MODE=extractive|generative` (default `extractive`)
- Route branches on mode before answer assembly

#### Step 5.5 — Final Polish Pass

**Tasks**: 120
**Files**: various UI components

- Optimize transitions between typing indicator → answer → citations
- Reduce time-to-first-token by starting SSE immediately after retrieval
- Ensure all loading states feel smooth (no layout shift)

---

## Verification Plan

### Test Framework Setup

Install and configure Vitest (Step 0.4). All tests use mocked Supabase client — zero hosted dependency.

### Unit Tests

| Test File            | What It Tests                     | Key Cases                                                                                       |
| -------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------- |
| `evidence.test.ts`   | `checkEvidence()`                 | Empty array → refusal; max score = 0.34 → refusal; score = 0.36 → pass; threshold boundary 0.35 |
| `prompt.test.ts`     | `formatExtractiveAnswer()`        | Single chunk → 1 citation; 3 chunks → 3 citations; ≤ 3 sentence output                          |
| `rate-limit.test.ts` | `checkRateLimit()`                | 20th request allowed; 21st blocked; window expiry resets                                        |
| `session.test.ts`    | `getOrCreateSession()`, title gen | New session creates row; existing session returned; title truncation at 80 chars                |
| `sanitize.test.ts`   | `sanitizeMarkdown()`              | Script tags stripped; safe markdown preserved; `javascript:` URLs removed                       |

### Mocked Integration Tests

| Test File      | What It Tests     | Key Cases                                                                                                                                 |
| -------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `chat.test.ts` | `/api/chat` route | Auth rejection (401); valid request → SSE stream; refusal on low evidence; rate limit (429); duplicate message_id → no duplicate response |

### Component Tests (optional, if time permits)

| Component          | What to Test                                                                                       |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| `chat-widget.tsx`  | SSE parsing renders incremental text; refusal shows inline message; rate limit shows retry message |
| `citation.tsx`     | "Show more" toggle works; clickable link opens document                                            |
| `chat-history.tsx` | Sessions list renders; clicking session loads messages                                             |

### Manual Smoke Checklist

| #   | Step                                                   | Expected Result                         |
| --- | ------------------------------------------------------ | --------------------------------------- |
| 1   | Log in → open chat → ask a KB-present question         | Streaming answer + correct citations    |
| 2   | Ask a question NOT in KB                               | Refusal message with suggestions        |
| 3   | Double-click send rapidly                              | Only one response (dedup by message_id) |
| 4   | Open chat in fresh browser (cold model load)           | "Loading AI model…" → then answer       |
| 5   | Disable a document via admin → ask its question        | Refusal (disabled doc excluded)         |
| 6   | DevTools → Network → Offline mid-stream                | Partial answer + error indicator        |
| 7   | Send 21+ messages in 1 minute                          | Rate limit message on excess            |
| 8   | Close chat → reopen → check history                    | Previous session listed with title      |
| 9   | Click past session → send new message                  | Old messages load; new message appends  |
| 10  | Paste `<script>alert(1)</script>` as question          | No XSS; content sanitized               |
| 11  | Toggle generation mode (if implemented) → ask question | Fuller generated answer with citations  |

---

## Complexity Tracking

No constitution violations. All decisions align with stated constraints:

- Client-side embedding (no server-side Transformers.js)
- Extractive mode default (no LLM)
- Mocked tests only (no hosted Supabase in CI)
- In-memory rate limiter (acceptable for Vercel serverless; per-instance)
