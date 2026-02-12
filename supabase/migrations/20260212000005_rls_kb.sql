-- RLS for Knowledge Base
-- Guidelines:
-- 1. Visibility Rule: Documents are visible to ALL authenticated users (for now, simpler for MVP).
--    (Alternative: only Admins see docs. But usually RAG bots need to read docs to answer users).
-- 2. Management: Only Admins can CUD (Create/Update/Delete).

ALTER TABLE public.kb_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_embeddings ENABLE ROW LEVEL SECURITY;

-- Helper policy for "Is Admin"
-- Note: Subqueries in RLS can be expensive but permissible for Admin checks (low volume).
-- Better approach: JWT claims/custom claims. For now, we stick to table lookup as defined in spec.

-- 1. kb_documents
CREATE POLICY "Admins can manage documents"
  ON public.kb_documents
  FOR ALL
  USING (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can read documents"
  ON public.kb_documents
  FOR SELECT
  TO authenticated
  USING (true);

-- 2. kb_chunks
CREATE POLICY "Admins can manage chunks"
  ON public.kb_chunks
  FOR ALL
  USING (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can read chunks"
  ON public.kb_chunks
  FOR SELECT
  TO authenticated
  USING (true);

-- 3. kb_embeddings
CREATE POLICY "Admins can manage embeddings"
  ON public.kb_embeddings
  FOR ALL
  USING (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can read embeddings"
  ON public.kb_embeddings
  FOR SELECT
  TO authenticated
  USING (true);
