export interface RetrievedChunk {
  chunk_id: string
  content: string
  document_id: string
  document_title: string
  document_url: string | null
  // Metadata from chunk/doc
  page?: number
  section?: string
  similarity: number
}

export interface Citation {
  chunk_id: string
  document_title: string
  url: string | null
  page?: number
  section?: string
}

export interface ChatRequest {
  embedding: number[]
  message: string
  message_id: string
  session_id?: string
}

export type ChatRole = 'user' | 'assistant'

// SSE Events
export interface SSEAnswerStart {
  session_id: string
}

export interface SSEAnswerDelta {
  text: string
}

export interface SSESources {
  citations: Citation[]
}

export interface SSEAnswerEnd {
  message_id: string
}

export interface SSEError {
  code: string
  message: string
}

export interface SSERefusal {
  message: string
  suggestions: string[]
}

export type ChatEvent = 
  | { type: 'answer_start'; data: SSEAnswerStart }
  | { type: 'answer_delta'; data: SSEAnswerDelta }
  | { type: 'sources'; data: SSESources }
  | { type: 'answer_end'; data: SSEAnswerEnd }
  | { type: 'error'; data: SSEError }
  | { type: 'refusal'; data: SSERefusal }
