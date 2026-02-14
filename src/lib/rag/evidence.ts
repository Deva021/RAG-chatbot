import { RetrievedChunk, ChatRequest, SSERefusal } from './types'

const EVIDENCE_THRESHOLD = process.env.CHAT_EVIDENCE_THRESHOLD 
  ? parseFloat(process.env.CHAT_EVIDENCE_THRESHOLD) 
  : 0.2

export interface EvidenceResult {
  pass: boolean
  chunks?: RetrievedChunk[]
  refusal?: SSERefusal
}

export function checkEvidence(chunks: RetrievedChunk[]): EvidenceResult {
  // Case 1: No chunks returned
  if (!chunks || chunks.length === 0) {
    return {
      pass: false,
      refusal: {
        message: "I couldn't find any relevant information in the knowledge base to answer your question.",
        suggestions: [
          "Try rephrasing your question with different keywords.",
          "Check if the topic is covered in the documentation.",
          "Contact support for further assistance."
        ]
      }
    }
  }

  // Case 2: Best chunk is below threshold
  const maxSimilarity = Math.max(...chunks.map(c => c.similarity))
  
  if (maxSimilarity < EVIDENCE_THRESHOLD) {
    return {
      pass: false,
      refusal: {
        message: "I found some documents, but they don't seem closely related enough to confidently answer your question.",
        suggestions: [
          "Could you be more specific?",
          "Try asking about a different topic.",
          "The knowledge base might not have this information yet."
        ]
      }
    }
  }

  // Pass
  return {
    pass: true,
    chunks
  }
}
