export interface PageText {
  page: number
  text: string
}

export interface PDFExtractResult {
  pages: PageText[]
  pageCount: number
  metadata: {
    title?: string
    author?: string
    fileSize: number
  }
}

/**
 * Extract text from a PDF File object.
 * Returns text per page and file metadata.
 * 
 * Uses dynamic import and legacy build for compatibility with Next.js evaluation.
 */
export async function extractTextFromPDF(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<PDFExtractResult> {
  const arrayBuffer = await file.arrayBuffer()
  
  // Dynamic import of the legacy build for better Next.js compatibility
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
  
  // Set worker locally
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/lib/pdfjs/pdf.worker.min.mjs'
  
  try {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise
    const metadata = await pdf.getMetadata().catch(() => null)
    const pages: PageText[] = []

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      const text = content.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()

      pages.push({ page: i, text })
      onProgress?.(i, pdf.numPages)
    }

    return {
      pages,
      pageCount: pdf.numPages,
      metadata: {
        title: (metadata?.info as any)?.Title ?? undefined,
        author: (metadata?.info as any)?.Author ?? undefined,
        fileSize: file.size,
      },
    }
  } catch (err) {
    console.error('Supreme PDF Engine failure:', err)
    if (err instanceof Error) {
        console.error('Stack:', err.stack)
        console.error('Message:', err.message)
    }
    throw new Error('Failed to process intelligence source. Check browser console for neural errors.')
  }
}

/**
 * Returns true if extraction yielded no meaningful text (scanned PDF).
 */
export function isScannedPDF(result: PDFExtractResult): boolean {
  const totalText = result.pages.map((p) => p.text).join('')
  return totalText.trim().length < 50
}
