-- Knowledge Base Schema

-- 1. Documents (Metadata)
CREATE TABLE IF NOT EXISTS public.kb_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  status text DEFAULT 'active', -- active, archived
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Chunks (splitted text)
CREATE TABLE IF NOT EXISTS public.kb_chunks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id uuid REFERENCES public.kb_documents(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 3. Embeddings (Vectors)
-- Note: Using 384 dimensions (standard for all-MiniLM-L6-v2)
CREATE TABLE IF NOT EXISTS public.kb_embeddings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  chunk_id uuid REFERENCES public.kb_chunks(id) ON DELETE CASCADE,
  embedding vector(384),
  created_at timestamptz DEFAULT now()
);

-- 4. Indexes
-- HNSW index for performance
CREATE INDEX IF NOT EXISTS kb_embeddings_embedding_idx 
ON public.kb_embeddings 
USING hnsw (embedding vector_cosine_ops);
