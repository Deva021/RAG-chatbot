/**
 * Ingestion Pipeline — Orchestrates the full upload → extract → chunk → embed → save flow.
 *
 * Reports step-by-step progress via a callback for the UI.
 */

import { createClient } from '@/lib/supabase/client'
import { extractTextFromPDF, isScannedPDF } from './pdf-loader'
import { chunkText, type Chunk } from './chunker'
import { generateEmbeddings, MODEL_ID } from './embedder'

export type IngestionStep =
  | 'uploading'
  | 'extracting'
  | 'chunking'
  | 'embedding'
  | 'saving'
  | 'done'
  | 'error'

export interface IngestionProgress {
  step: IngestionStep
  message: string
  /** 0-100 progress within the current step */
  progress: number
}

export interface IngestionResult {
  documentId: string
  chunkCount: number
  pageCount: number
}

/**
 * Run the full ingestion pipeline for a PDF file.
 */
export async function runIngestionPipeline(
  file: File,
  onProgress: (progress: IngestionProgress) => void
): Promise<IngestionResult> {
  const supabase = createClient()

  let documentId: string | null = null

  try {
    // ──── Step 1: Upload file to Supabase Storage ────
    onProgress({ step: 'uploading', message: 'Uploading file...', progress: 0 })

    const storagePath = `kb/${Date.now()}_${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('artifacts')
      .upload(storagePath, file, { contentType: file.type })

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

    onProgress({ step: 'uploading', message: 'File uploaded', progress: 100 })

    // ──── Create document record ────
    const checksum = await computeChecksum(file)

    const { data: docData, error: docError } = await supabase
      .from('kb_documents')
      .insert({
        name: file.name,
        status: 'processing',
        storage_path: storagePath,
        checksum,
        meta: { file_size: file.size },
      })
      .select('id')
      .single()

    if (docError || !docData) throw new Error(`DB insert failed: ${docError?.message}`)
    documentId = docData.id

    // ──── Step 2: Extract text from PDF ────
    onProgress({ step: 'extracting', message: 'Extracting text...', progress: 0 })

    const extractResult = await extractTextFromPDF(file, (current, total) => {
      onProgress({
        step: 'extracting',
        message: `Extracting page ${current}/${total}`,
        progress: Math.round((current / total) * 100),
      })
    })

    // Check for scanned PDF
    if (isScannedPDF(extractResult)) {
      await supabase
        .from('kb_documents')
        .update({ status: 'failed', meta: { error: 'No text found (scanned PDF?)' } })
        .eq('id', documentId)

      throw new Error('No text found — this appears to be a scanned PDF (image-only).')
    }

    // Update doc with page count
    await supabase
      .from('kb_documents')
      .update({ meta: { file_size: file.size, page_count: extractResult.pageCount } })
      .eq('id', documentId)

    // ──── Step 3: Chunk text ────
    onProgress({ step: 'chunking', message: 'Chunking text...', progress: 0 })

    const chunks = chunkText(extractResult.pages)

    onProgress({
      step: 'chunking',
      message: `Created ${chunks.length} chunks`,
      progress: 100,
    })

    // ──── Step 4: Generate embeddings ────
    onProgress({ step: 'embedding', message: 'Loading model...', progress: 0 })

    const embeddings = await generateEmbeddings(
      chunks.map((c) => c.content),
      (completed, total) => {
        onProgress({
          step: 'embedding',
          message: `Embedding chunk ${completed}/${total}`,
          progress: Math.round((completed / total) * 100),
        })
      }
    )

    // ──── Step 5: Save chunks and embeddings to DB ────
    onProgress({ step: 'saving', message: 'Saving to database...', progress: 0 })

    // Insert chunks
    const chunkRows = chunks.map((c: Chunk) => ({
      document_id: documentId,
      chunk_index: c.chunkIndex,
      content: c.content,
      meta: c.meta,
    }))

    const { data: insertedChunks, error: chunkError } = await supabase
      .from('kb_chunks')
      .insert(chunkRows)
      .select('id, chunk_index')

    if (chunkError || !insertedChunks) {
      throw new Error(`Chunk insert failed: ${chunkError?.message}`)
    }

    onProgress({ step: 'saving', message: 'Saving embeddings...', progress: 50 })

    // Insert embeddings matched to chunk IDs
    const embeddingRows = embeddings.map((e) => {
      const chunkRecord = insertedChunks.find((c: { chunk_index: number }) => c.chunk_index === e.chunkIndex)
      return {
        chunk_id: chunkRecord!.id,
        embedding: JSON.stringify(e.embedding),
        model: MODEL_ID,
      }
    })

    const { error: embError } = await supabase
      .from('kb_embeddings')
      .insert(embeddingRows)

    if (embError) throw new Error(`Embedding insert failed: ${embError.message}`)

    // ──── Mark document as ready ────
    await supabase
      .from('kb_documents')
      .update({ status: 'ready' })
      .eq('id', documentId)

    onProgress({ step: 'done', message: 'Ingestion complete!', progress: 100 })

    return {
      documentId,
      chunkCount: chunks.length,
      pageCount: extractResult.pageCount,
    }
  } catch (error) {
    // Mark document as failed if it was created
    if (documentId) {
      try {
        await supabase
          .from('kb_documents')
          .update({ status: 'failed' })
          .eq('id', documentId)
      } catch (err) {
        console.error('Failed to mark document as failed:', err)
      }
    }

    const message = error instanceof Error ? error.message : 'Unknown error'
    onProgress({ step: 'error', message, progress: 0 })
    throw error
  }
}

/**
 * Compute SHA-256 checksum of a file.
 */
async function computeChecksum(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}
