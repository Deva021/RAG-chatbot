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

declare global {
  interface Window {
    pdfjsLib: any
  }
}

/**
 * Extract text from a PDF File object.
 * Returns text per page and file metadata.
 * 
 * Note: This uses the GLOBAL window.pdfjsLib injected via layout.tsx
 * to bypass Turbopack/Next.js evaluation crashes.
 */
export async function extractTextFromPDF(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<PDFExtractResult> {
  const arrayBuffer = await file.arrayBuffer()
  
  // 1. Check for global library (Injected via next/script in AdminLayout)
  // We use a small delay if needed to ensure the module is initialized
  const getLib = async (retries = 10): Promise<any> => {
    if (typeof window !== 'undefined' && (window as any).pdfjsLib) {
      return (window as any).pdfjsLib
    }
    if (retries <= 0) return null
    await new Promise(r => setTimeout(r, 200))
    return getLib(retries - 1)
  }

  const pdfjsLib = await getLib()

  if (!pdfjsLib) {
    console.error('PDF Engine missing from global scope.')
    throw new Error('Neural engine failed to initialize. Please refresh the page or check your connection.')
  }

  try {
    // 2. Configure worker from the same reliable CDN
    const PDFJS_VERSION = '4.0.379'
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.mjs`

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
        title: metadata?.info?.Title ?? undefined,
        author: metadata?.info?.Author ?? undefined,
        fileSize: file.size,
      },
    }
  } catch (err) {
    console.error('Supreme PDF Engine failure:', err)
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
