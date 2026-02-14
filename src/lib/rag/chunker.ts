/**
 * Text Chunker — Splits text into overlapping chunks with metadata.
 *
 * Uses sentence boundaries to avoid mid-sentence splits.
 * Preserves page numbers from the source PDF.
 */

import type { PageText } from './pdf-loader'

export interface Chunk {
  content: string
  chunkIndex: number
  meta: {
    pages: number[]       // which source pages contributed
    charStart: number     // character offset in full text
    charEnd: number
  }
}

export interface ChunkerOptions {
  /** Target chunk size in characters (≈512 tokens × 4 chars). Default: 2000 */
  chunkSize?: number
  /** Overlap in characters. Default: 200 (≈10% of 2000) */
  overlap?: number
}

const DEFAULT_CHUNK_SIZE = 1200
const DEFAULT_OVERLAP = 150

/**
 * Split page texts into overlapping chunks.
 */
export function chunkText(
  pages: PageText[],
  options: ChunkerOptions = {}
): Chunk[] {
  const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE
  const overlap = options.overlap ?? DEFAULT_OVERLAP

  // Build a flat text with page boundary markers
  const segments: { text: string; page: number }[] = []
  for (const p of pages) {
    if (p.text.trim()) {
      segments.push({ text: p.text, page: p.page })
    }
  }

  if (segments.length === 0) return []

  // Build cumulative char ranges per page
  interface PageRange { page: number; start: number; end: number }
  const fullTextParts: string[] = []
  const pageRanges: PageRange[] = []
  let cursor = 0

  for (const seg of segments) {
    const start = cursor
    fullTextParts.push(seg.text)
    cursor += seg.text.length
    pageRanges.push({ page: seg.page, start, end: cursor })
    // Add space between pages
    fullTextParts.push(' ')
    cursor += 1
  }

  const fullText = fullTextParts.join('')

  // Split into sentences for clean boundaries
  const sentences = splitSentences(fullText)
  const chunks: Chunk[] = []
  let chunkIndex = 0
  let sentenceIdx = 0

  while (sentenceIdx < sentences.length) {
    let currentLen = 0
    const chunkSentences: string[] = []
    const startSentenceIdx = sentenceIdx

    // Fill chunk up to target size
    while (sentenceIdx < sentences.length && currentLen < chunkSize) {
      chunkSentences.push(sentences[sentenceIdx])
      currentLen += sentences[sentenceIdx].length
      sentenceIdx++
    }

    const content = chunkSentences.join('').trim()
    if (!content) continue

    // Calculate char position in full text
    let charStart = 0
    for (let i = 0; i < startSentenceIdx; i++) {
      charStart += sentences[i].length
    }
    const charEnd = charStart + content.length

    // Determine which pages this chunk spans
    const pagesInChunk = new Set<number>()
    for (const pr of pageRanges) {
      if (pr.end > charStart && pr.start < charEnd) {
        pagesInChunk.add(pr.page)
      }
    }

    chunks.push({
      content,
      chunkIndex,
      meta: {
        pages: Array.from(pagesInChunk).sort((a, b) => a - b),
        charStart,
        charEnd,
      },
    })

    chunkIndex++

    // Handle overlap: rewind by overlap amount
    if (sentenceIdx < sentences.length && overlap > 0) {
      let overlapLen = 0
      let rewind = 0
      for (let i = sentenceIdx - 1; i >= startSentenceIdx; i--) {
        overlapLen += sentences[i].length
        rewind++
        if (overlapLen >= overlap) break
      }
      sentenceIdx -= rewind
    }
  }

  return chunks
}

/**
 * Naive sentence splitter using regex.
 * Splits on .!? followed by space or end, preserving the delimiter.
 */
function splitSentences(text: string): string[] {
  // Split on sentence-ending punctuation followed by whitespace
  const parts = text.split(/(?<=[.!?])\s+/)
  return parts.filter((s) => s.length > 0)
}
