-- Batch 3: Knowledge Base Schema Update
-- Adds missing columns required by the spec to existing KB tables.

-- 1. kb_documents: add description, storage_path, proper status, checksum, enabled, meta
ALTER TABLE public.kb_documents
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS storage_path text,
  ADD COLUMN IF NOT EXISTS checksum text,
  ADD COLUMN IF NOT EXISTS enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS meta jsonb DEFAULT '{}'::jsonb;

-- Update status column: change default from 'active' to 'uploading'
-- and add a check constraint for valid values
ALTER TABLE public.kb_documents
  ALTER COLUMN status SET DEFAULT 'uploading';

ALTER TABLE public.kb_documents
  ADD CONSTRAINT kb_documents_status_check
  CHECK (status IN ('uploading', 'processing', 'ready', 'failed'));

-- 2. kb_chunks: add meta for page/section info
ALTER TABLE public.kb_chunks
  ADD COLUMN IF NOT EXISTS meta jsonb DEFAULT '{}'::jsonb;

-- 3. kb_embeddings: add model identifier
ALTER TABLE public.kb_embeddings
  ADD COLUMN IF NOT EXISTS model text DEFAULT 'Xenova/all-MiniLM-L6-v2';
