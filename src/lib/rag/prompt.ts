import { RetrievedChunk } from './types'

/**
 * Constructs a system prompt for Gemini based on retrieved chunks.
 */
export function getGenerativePrompt(chunks: RetrievedChunk[], userQuestion: string): string {
  const context = chunks
    .map((c, i) => `[Source ${i + 1}] (Document: ${c.document_title}, Page: ${c.page})\n${c.content}`)
    .join('\n\n---\n\n')

  return `
You are the CSEC (Computer Science and Engineering Club) AI Assistant. 
Your goal is to provide accurate, helpful, and concise answers based ONLY on the provided context.

CONTEXT FROM KNOWLEDGE BASE:
${context}

USER QUESTION:
${userQuestion}

INSTRUCTIONS:
1. Use ONLY the information in the CONTEXT above. 
2. If the answer is not in the context, say: "I'm sorry, I don't have enough information in my current documentation to answer that."
3. Use markdown formatting (bolding, lists) for readability.
4. Do NOT use inline citations like [Source 1], [1], or (Source 1) in your response text. The user interface will automatically display the sources for you.
5. Keep your tone professional, encouraging, and club-centric.

STRICT RULE: Do not use any outside knowledge. If the context is missing specific details, state that you don't know based on the documents.
`.trim()
}
