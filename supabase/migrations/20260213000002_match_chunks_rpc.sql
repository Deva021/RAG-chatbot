-- RPC function to match chunks using pgvector and filters
-- Matches existing kb_embeddings schema
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(384),
  match_count int DEFAULT 5,
  threshold float DEFAULT 0.35
)
RETURNS TABLE (
  chunk_id uuid,
  content text,
  meta jsonb,
  document_id uuid,
  document_title text,
  document_url text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS chunk_id,
    c.content,
    c.meta,
    d.id AS document_id,
    d.name AS document_title,
    d.meta->>'url' AS document_url,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM kb_embeddings e
  JOIN kb_chunks c ON c.id = e.chunk_id
  JOIN kb_documents d ON d.id = c.document_id
  WHERE d.status = 'ready'
    AND d.enabled IS NOT FALSE
    AND 1 - (e.embedding <=> query_embedding) >= threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
