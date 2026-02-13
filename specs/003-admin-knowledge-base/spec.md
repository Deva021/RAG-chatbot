# Specification: Batch 3 — Admin Knowledge Base

**Feature Branch**: `003-admin-knowledge-base`
**Status**: Draft

## Goals

- **Client-Side Ingestion**: Admin can upload PDFs, extract text, chunk, and embed them entirely in the browser to avoid serverless timeouts.
- **Vector Storage**: Store chunks and embeddings in Hosted Supabase (`kb_documents`, `kb_chunks`, `kb_embeddings`) with `pgvector`.
- **Admin Management**: CRUD operations for knowledge base documents (List, Upload, Delete, Disable, Reprocess).
- **Cost Efficiency**: Use `Transformers.js` for free, in-browser embedding generation.

## Non-Goals

- **OCR**: Scanned PDFs (images) are out of scope for the $0 MVP.
- **Server-Side Ingestion**: No heavy processing on Vercel functions.
- **Public Uploads**: Only authenticated Admins can modify the knowledge base.

## User Scenarios & Acceptance Criteria

### User Story 1: Admin Upload & Ingestion (Priority: P0)

As an Admin, I want to upload a PDF and have it automatically processed (text extracted, chunked, embedded) so that the chatbot can answer questions from it.

**Why this priority**: Essential for populating the RAG knowledge base.

**Acceptance Scenarios**:

1. **Given** an Admin on `/admin/documents`, **When** they upload a PDF, **Then** a progress UI shows steps: Uploading -> Extracting -> Chunking -> Embedding -> Saving.
2. **Given** a large PDF (e.g., 50 pages), **When** processing, **Then** the UI remains responsive and updates progress (e.g., "Embedding chunk 5/20").
3. **Given** an ingestion error (e.g., network fail), **When** it occurs, **Then** the process pauses/fails gracefully, and the document status is marked "failed".
4. **Given** a successful run, **When** complete, **Then** the document status becomes "ready" and stats (chunk count) are displayed.

### User Story 2: Document Management (Priority: P1)

As an Admin, I want to see a list of documents and manage their status so that I can keep the knowledge base clean and relevant.

**Acceptance Scenarios**:

1. **Given** a list of documents, **When** I click "Delete", **Then** the document and all associated chunks/embeddings are removed from Supabase.
2. **Given** a document, **When** I toggle "Enabled/Disabled", **Then** the document remains in the DB but is excluded from RAG searches (search query filters by `enabled=true`).
3. **Given** a failed or outdated document, **When** I click "Reprocess", **Then** the ingestion flow runs again explicitly for that document ID.

### User Story 3: Handling Limitations (Priority: P2)

As an Admin, I want to be warned if a file cannot be processed so that I don't waste time on incompatible docs.

**Acceptance Scenarios**:

1. **Given** a scanned PDF (image-only), **When** text extraction yields empty results, **Then** the system warns "No text found (scanned PDF?)" and aborts or marks as empty.
2. **Given** a non-PDF file attempt, **When** selecting files, **Then** the picker restricts to `.pdf` (and maybe `.txt/md`).

## Technical Requirements

### Data Schema (Hosted Supabase)

**1. `kb_documents`**

- `id` (uuid, PK)
- `name` (text, original filename)
- `description` (text, optional)
- `storage_path` (text, bucket path)
- `status` (enum: uploading, processing, ready, failed)
- `checksum` (text, sha256 of file content)
- `meta` (jsonb: `{ page_count, file_size, author }`)
- `created_at` (timestamptz)

**2. `kb_chunks`**

- `id` (uuid, PK)
- `document_id` (uuid, FK -> kb_documents)
- `content` (text, actual text chunk)
- `chunk_index` (int, order in doc)
- `meta` (jsonb: `{ page: 5, section: "Introduction" }`)

**3. `kb_embeddings`**

- `id` (uuid, PK)
- `chunk_id` (uuid, FK -> kb_chunks)
- `embedding` (vector(384) -- assuming generic-all-MiniLM-L6-v2)
- `model` (text, e.g., "Xenova/all-MiniLM-L6-v2")

### Client-Side Ingestion Pipeline

1. **Upload**: User picks file -> File uploaded to Supabase Storage bucket `documents` (private).
2. **Extract**: `pdfjs-dist` (or similar) reads File object in browser -> extracts text per page.
3. **Chunk**: Split text into ~512 token chunks with 10% overlap. Preserve page numbers in metadata.
   - _Rule_: Do not split mid-sentence if possible (use naive regex splitting).
4. **Embed**: Load `Transformers.js` pipeline (`feature-extraction`) -> generate vectors for each chunk.
   - _Batched_: Embed 5-10 chunks at a time to prevent UI freeze (use `requestAnimationFrame` or Web Worker if needed).
5. **Save**:
   - Transaction 1: Create `kb_document`.
   - Transaction 2: Insert all `kb_chunks`.
   - Transaction 3: Insert all `kb_embeddings`.
   - Update `kb_document` status to `ready`.

### Security & RLS

- **Storage**: `documents` bucket.
  - INSERT/UPDATE/DELETE: specific `admin` role only.
  - SELECT: Authenticated users (for RAG inference) or Admin.
- **Tables**:
  - RLS enabled on all `kb_*` tables.
  - Write: Admin only.
  - Read: Authenticated users (filtered by `enabled=true` implicitly via search function, or explicit RLS policy).

## Verification Plan

### Automated Tests

- **Unit Tests**:
  - Test chunking logic: Ensure overlap works and metadata (page numbers) is preserved.
  - Test metadata extractors: Ensure clean JSON output.
- **Component Tests** (mocking Supabase/Transformers):
  - Test IngestionProgressUI: Verify 0% -> 100% states and error variants.

### Manual Verification

1. **End-to-End Ingestion**:
   - Upload a visible PDF (e.g., specific policy doc).
   - Watch progress bars.
   - Check Supabase Table Editor: Verify rows in `kb_documents`, `kb_chunks`, `kb_embeddings`.
2. **Search Verification** (pre-cursor to Batch 4):
   - Use the "Dev Tools" SQL editor to run a similarity search on the new embeddings to prove they work.
