/**
 * Embedder — Client-side embedding generation using Transformers.js.
 *
 * Uses a singleton pipeline to avoid re-loading the model.
 * Processes chunks in batches with progress callbacks.
 */

import { pipeline, type FeatureExtractionPipeline } from '@huggingface/transformers'

const MODEL_ID = 'Xenova/all-MiniLM-L6-v2'
const BATCH_SIZE = 5

let embeddingPipeline: FeatureExtractionPipeline | null = null

/**
 * Get or initialize the embedding pipeline (singleton).
 * First call downloads ~30MB of model files (cached by browser).
 */
export async function getEmbedder(
  onModelLoading?: (progress: number) => void
): Promise<FeatureExtractionPipeline> {
  if (embeddingPipeline) return embeddingPipeline

  embeddingPipeline = await pipeline('feature-extraction', MODEL_ID, {
    progress_callback: (data: any) => {
      if (data.status === 'progress' && data.progress !== undefined) {
        onModelLoading?.(data.progress)
      }
    },
  }) as any

  return embeddingPipeline
}

export interface EmbeddingResult {
  chunkIndex: number
  embedding: number[]
}

/**
 * Generate embeddings for an array of text chunks.
 * Processes in batches of BATCH_SIZE to keep UI responsive.
 */
export async function generateEmbeddings(
  texts: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<EmbeddingResult[]> {
  const embedder = await getEmbedder()
  const results: EmbeddingResult[] = []

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE)

    for (let j = 0; j < batch.length; j++) {
      const output = await embedder(batch[j], {
        pooling: 'mean',
        normalize: true,
      })

      // output is a Tensor — convert to plain array
      const embedding = Array.from(output.data as Float32Array).slice(0, 384)

      results.push({
        chunkIndex: i + j,
        embedding,
      })

      onProgress?.(results.length, texts.length)
    }

    // Yield to keep UI responsive between batches
    await new Promise((resolve) => setTimeout(resolve, 0))
  }

  return results
}

/**
 * Generate embedding for a single question with timeout safety.
 * Throws ERR_LOAD_TIMEOUT if model doesn't load in 15s.
 */
export async function embedQuestion(text: string): Promise<number[]> {
  const timeoutMs = 60000 // Increased to 60s for slow connections/initial load
  const timeoutPromise = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error('ERR_LOAD_TIMEOUT')), timeoutMs)
  )

  const workPromise = async () => {
    try {
      const embedder = await getEmbedder()
      const output = await embedder(text, { pooling: 'mean', normalize: true })
      return Array.from(output.data as Float32Array).slice(0, 384)
    } catch (error: any) {
       // Check for specific WASM errors if needed
       throw error
    }
  }

  return Promise.race([workPromise(), timeoutPromise])
}

export { MODEL_ID }
