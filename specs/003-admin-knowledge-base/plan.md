# Implementation Plan: Admin Knowledge Base Ingestion

**Branch**: `003-admin-knowledge-base`
**Spec**: [specs/003-admin-knowledge-base/spec.md](file:///home/dawa/Documents/CSEC/specs/003-admin-knowledge-base/spec.md)

## Summary

This batch implements the core RAG ingestion module. Admins can upload PDFs which are processed entirely client-side (extracted, chunked, embedded) to populate the `kb_documents`, `kb_chunks`, and `kb_embeddings` tables in Supabase. This avoids Vercel timeout limits and keeps the architecture serverless-friendly.

## Proposed Changes

### 1. Database Schema

#### [NEW] [schema-sql]

- **File**: `supabase/migrations/20260213000000_knowledge_base.sql`
- **Tables**:
  - `kb_documents`: Tracks file metadata, status, and checksums.
  - `kb_chunks`: Stores text segments and page metadata.
  - `kb_embeddings`: Stores vector data (`vector(384)` for MiniLM).
- **Extensions**: Enable `vector` if not already on.
- **RLS**: Admin read/write, Public/Auth read-only (based on `enabled` flag).

### 2. Client-Side Processing Libs

#### [NEW] [processing-libs]

- `src/lib/pdf-loader.ts`: Wrapper around `pdfjs-dist` to extract text and metadata per page.
- `src/lib/chunker.ts`: Function to split text with overlap (e.g., 512 tokens, 50 overlap) while preserving page boundaries.
- `src/lib/embeddings.ts`: Singleton for `Transformers.js` pipeline to generate embeddings in the browser.

### 3. Admin Ingestion UI

#### [NEW] [admin-ui]

- `src/components/admin/kb/ingestion-wizard.tsx`:
  - **Upload Step**: File picker, validates PDF, uploads to Storage bucket `documents`.
  - **Processing Step**: Visual progress bar for Extraction -> Chunking -> Embedding.
  - **Batching**: Processes chunks in small batches (e.g., 5-10) to keep UI responsive.
  - **Error Handling**: Fails gracefully on bad PDFs or network errors.

- `src/app/admin/documents/page.tsx`:
  - Replaces placeholder with real data table.
  - Lists documents with Status badges (Ready, Processing, Failed).
  - Actions: Delete (cascading), Toggle Enabled.

### 4. Admin Search Tool

#### [NEW] [admin-search]

- `src/app/admin/documents/search/page.tsx`: Simple internal tool to sanity check embeddings by running a similarity search.

## Verification Plan

### Automated Tests

- **Unit**: Test `chunker.ts` with various text lengths and edge cases.
- **Unit**: Test `pdf-loader.ts` mock for correct metadata extraction structure.

### Manual Verification

1.  **Full Ingestion**: Upload `Security_Policy.pdf`. Watch 5-step progress. Verify DB rows.
2.  **Search**: Use the Admin Search tool to find "password requirements" from the uploaded doc to confirm embeddings are valid.
3.  **Failure**: Upload a text file renamed as .pdf to verify error handling.
