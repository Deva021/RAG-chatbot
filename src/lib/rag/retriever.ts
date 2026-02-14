import { createClient } from '@/lib/supabase/server'
import { RetrievedChunk } from './types'

export async function matchChunks(
  embedding: number[], 
  options: { matchCount?: number; threshold?: number } = {}
): Promise<RetrievedChunk[]> {
  const supabase = await createClient()
  const { matchCount = 10, threshold = 0.2 } = options
  
  const { data, error } = await supabase.rpc('match_chunks', {
    query_embedding: embedding,
    match_count: matchCount,
    threshold
  })

  if (error) {
    console.error('Vector search error:', error)
    // Fail gracefully by returning empty array in production, 
    // but useful to know if RPC is missing
    throw new Error(`Vector search failed: ${error.message}`)
  }
  
  return (data || []).map((row: any) => ({
    chunk_id: row.chunk_id,
    content: row.content,
    document_id: row.document_id,
    document_title: row.document_title,
    document_url: row.document_url,
    page: row.meta?.page,
    section: row.meta?.section,
    similarity: row.similarity
  }))
}
