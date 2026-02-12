# Decisions Log

## 2026-02-12: KB Visibility

- **Decision**: Authenticated users can read all KB documents/chunks.
- **Rationale**: The RAG chatbot needs to access knowledge to answer questions for any user. We do not have user-specific knowledge bases in this iteration.
- **Constraints**:
  - Admin-only write access (strict).
  - Storage bucket `artifacts` is private (Admin read/write). Users access content via the vector store (chunks) or signed URLs if implemented later.

## 2026-02-12: Vector Dimensions

- **Decision**: 384 dimensions.
- **Rationale**: Standard for `all-MiniLM-L6-v2` / `bge-small-en`, which are efficient for local/edge inference if needed, and cheap for hosted generation.
- **Impact**: `kb_embeddings` table uses `vector(384)`.
