# Analysis: Batch 4 — Chat Backend

## Summary of Intent

This batch implements the core Retrieval-Augmented Generation (RAG) feature. It leverages client-side embeddings via Transformers.js to stay within the "$0 cost" constraint, sending vectors to a Next.js API that queries a Supabase `pgvector` store. The response is a streamed "extractive" answer—composed of verbatim snippets from top-ranked chunks—accompanied by structured citations. Chat history is persisted for session resume and management.

## Gaps / Missing Requirements

- **Citation Viewer**: The spec links citations to source documents and page numbers, but there is no explicitly defined "Document Viewer" component for users to actually _see_ the source PDF in its original layout.
- **WASM Support Detection**: While "fall back to server-side" is mentioned, the exact mechanism for detecting WASM/Transformers.js failure on the client isn't detailed.
- **Extractive Formatting**: The logic for "synthesizing" multiple chunks into a "concise answer" without an LLM is slightly ambiguous. Concatenation might produce disjointed results if not handled carefully.

## Ambiguities

- **Server-Side Fallback**: Implementing Transformers.js on serverless (Vercel) is risky due to the 50MB-250MB size of model files and the 10s execution limit. If client-side fails, a server-side embedding might fail too.
- **Session Resume UX**: Does clicking a past session replace the current input, or does it navigate to a separate view? The "navigates to session load" vs "hydrates widget" needs consistent handling.

## Risks

- **Serverless Timeouts**: Streaming SSE over Vercel functions is limited by the 10s (Hobby) or 15s/30s (Pro) execution window. While embedding happens on the client, the retrieval + stream must fit comfortably in this window.
- **Client Resource Pressure**: Transformers.js (even a 30MB model) can crash low-memory mobile browser tabs.
- **Rate Limit Isolation**: In-memory rate limiting in serverless environments is per-instance, not global. This might allow more traffic than intended if Vercel scales out.

## Dependency/Order Check

The Mermaid diagram and task ordering are logical:

1. **Foundation** (DB schema/RPC)
2. **Server Logic** (retrieval/formatting)
3. **API Layer** (SSE/Auth)
4. **Client UI** (widget/history)
5. **Polishing**

No blockers found in the current sequence.

## Scope Creep / Over-engineering Flags

- **Retrieval Caching (Task 116)**: Likely unnecessary for the current scale and might introduce staleness if chunks are updated.
- **Small-Model Generation (Task 118)**: Adding a generative model in-browser is a massive increase in complexity and assets. Recommended to keep this strictly P3/Experimental.

## Concrete Fixes

- **[MODIFY] [spec.md](file:///home/dawa/Documents/CSEC/specs/004-batch-4-chat/spec.md)**:
  - Define a "Simple Concatenation" rule for multi-chunk answers to avoid over-complicating extractive logic.
  - Specify that "sources" include a direct link to the Storage URL as a fallback for the missing viewer.
- **[MODIFY] [plan.md](file:///home/dawa/Documents/CSEC/specs/004-batch-4-chat/plan.md)**:
  - Add `dompurify` or similar lightweight lib for sanitization instead of custom regex.
  - Detail the WASM check (use a simple `try/catch` on model load).
- **[MODIFY] [tasks.md](file:///home/dawa/Documents/CSEC/specs/004-batch-4-chat/tasks.md)**:
  - Add a sub-task to Task 104 to handle "heartbeat" or early-close in SSE to prevent zombie connections.

## Next Recommended Command

`/speckit.clarify`
