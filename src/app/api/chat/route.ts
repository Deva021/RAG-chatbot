import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { matchChunks } from '@/lib/rag/retriever'
import { checkEvidence } from '@/lib/rag/evidence'
import { getGeminiFlashModel } from '@/lib/rag/gemini'
import { getGenerativePrompt } from '@/lib/rag/prompt'
import { checkRateLimit } from '@/lib/chat/rate-limit'
import { getOrCreateSession } from '@/lib/chat/session'
import { saveMessage, getMessageById } from '@/lib/chat/messages'
import { ChatRequest, ChatEvent, RetrievedChunk, Citation } from '@/lib/rag/types'

export async function POST(req: NextRequest) {
  try {
    // 1. Parse and Validate Input
    const body = await req.json() as ChatRequest
    const { embedding, message, message_id, session_id } = body

    if (!embedding || !Array.isArray(embedding) || embedding.length !== 384) {
      return NextResponse.json(
        { code: 'INVALID_INPUT', message: 'Invalid embedding format' },
        { status: 400 }
      )
    }
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { code: 'INVALID_INPUT', message: 'Message is required' },
        { status: 400 }
      )
    }
    if (!message_id) {
      return NextResponse.json(
        { code: 'INVALID_INPUT', message: 'message_id is required' },
        { status: 400 }
      )
    }

    // 2. Auth Check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { code: 'UNAUTHORIZED', message: 'Please log in to use the chat.' },
        { status: 401 }
      )
    }

    // 3. Rate Limit Check
    const rateLimit = checkRateLimit(user.id)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          code: 'RATE_LIMITED', 
          message: `You're sending messages too fast. Please wait ${Math.ceil(rateLimit.retryAfterMs! / 1000)} seconds.` 
        },
        { status: 429, headers: { 'Retry-After': Math.ceil(rateLimit.retryAfterMs! / 1000).toString() } }
      )
    }

    // 4. Deduplication
    const existingMessage = await getMessageById(message_id)
    if (existingMessage) {
      // Idempotency: If message already processed, we could return the previous response,
      // but for simplicity in this MVP, we just return a 200 OK with a "processed" status 
      // or similar. Or better, just return the existing answer if we had it.
      // Since we don't easily have the full previous stream response to replay,
      // we'll explicitly error to tell the client "already received".
      // Client should ideally handle this by not retrying if it has the answer.
      // Or we can just ignore and proceed if we want to allow regeneration (but spec says dedup).
      return NextResponse.json(
        { code: 'DUPLICATE_MESSAGE', message: 'This message has already been processed.' },
        { status: 200 } // Soft error that client can ignore
      )
    }

    // 5. Session Management
    const actualSessionId = await getOrCreateSession(user.id, session_id, message)

    // 6. Persist User Message
    // Fire and forget persistence to not block the stream start? 
    // Better to await to ensure consistency before answering.
    await saveMessage({
      id: message_id,
      session_id: actualSessionId,
      role: 'user',
      content: message
    })

    // 7. Greeting Check (Small Talk Fallback)
    const lowerMessage = message.toLowerCase().trim()
    const greetings = ['hello', 'hi', 'hey', 'greetings', 'yo', 'good morning', 'good afternoon', 'good evening']
    const isGreeting = greetings.some(g => lowerMessage === g || lowerMessage.startsWith(g + ' ') || lowerMessage.startsWith(g + '?') || lowerMessage.startsWith(g + '!'))

    if (isGreeting) {
       const greetingAnswer = "Hello! I'm your CSEC AI assistant. I can help you find information about the club, events, or technical documentation in our knowledge base. What would you like to know?"
       const assistantMessageId = crypto.randomUUID()
       
       await saveMessage({
         id: assistantMessageId,
         session_id: actualSessionId,
         role: 'assistant',
         content: greetingAnswer
       })

       return NextResponse.json({
         type: 'answer',
         text: greetingAnswer,
         session_id: actualSessionId,
         message_id: assistantMessageId
       })
    }

    // 8. Retrieval & Evidence
    const chunks = await matchChunks(embedding, { matchCount: 6 })
    const evidence = checkEvidence(chunks)

    if (!evidence.pass) {
      return NextResponse.json({
        type: 'refusal',
        ...evidence.refusal
      })
    }

    // 9. Gemini Generative Answer
    const assistantMessageId = crypto.randomUUID()
    const model = getGeminiFlashModel()
    const prompt = getGenerativePrompt(evidence.chunks!, message)

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: any) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
        }

        try {
          // 1. answer_start
          console.log(`[Chat API] Starting stream for session: ${actualSessionId}`)
          sendEvent('answer_start', { session_id: actualSessionId })

          // 2. Stream from Gemini
          const model = getGeminiFlashModel()
          const prompt = getGenerativePrompt(evidence.chunks!, message)
          
          console.log(`[Chat API] Prompt payload size: ${prompt.length} characters (~${Math.ceil(prompt.length / 4)} tokens)`)
          console.log('[Chat API] Requesting Gemini stream...')
          const result = await model.generateContentStream(prompt)
          let fullText = ''

          for await (const chunk of result.stream) {
            const chunkText = chunk.text()
            fullText += chunkText
            sendEvent('answer_delta', { text: chunkText })
          }
          console.log(`[Chat API] Gemini stream completed. Response length: ${fullText.length}`)

          // 3. sources (Citations from RAG chunks)
          const citations: Citation[] = evidence.chunks!.map(c => ({
            chunk_id: c.chunk_id,
            document_title: c.document_title,
            url: c.document_url,
            page: c.page,
            section: c.section
          }))
          
          sendEvent('sources', { citations })

          // 4. Persistence & Cleanup
          console.log('[Chat API] Saving assistant message to database...')
          await saveMessage({
            id: assistantMessageId,
            session_id: actualSessionId,
            role: 'assistant',
            content: fullText,
            citations: citations
          })

          // 5. answer_end
          sendEvent('answer_end', { message_id: assistantMessageId })

        } catch (streamError: any) {
          console.error('[Chat API] Gemini Stream Error:', streamError)
          
          let userMessage = 'Intelligence link interrupted.'
          if (streamError.status === 404) {
            userMessage = 'Intelligence model not found (404). Check API key and model name.'
          } else if (streamError.status === 429) {
            userMessage = 'Gemini API quota exceeded (429). Please check your Google AI Studio limits.'
          } else if (streamError.message) {
            // Include a bit of context if it's a known error but not 404/429
            userMessage = `Intelligence error: ${streamError.message.slice(0, 100)}...`
          }
          
          sendEvent('error', { message: userMessage })
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error: any) {
    console.error('Chat API Error:', error)
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
      { status: 500 }
    )
  }
}
