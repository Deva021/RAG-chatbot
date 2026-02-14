import { GoogleGenerativeAI } from '@google/generative-ai'

/**
 * Lightweight wrapper for Gemini Flash model.
 */
export const getGeminiFlashModel = () => {
  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY is missing from environment variables.')
  }

  const modelName = 'gemini-2.5-flash'
  console.log(`[Gemini] Initializing model: ${modelName}`)

  const genAI = new GoogleGenerativeAI(apiKey)

  try {
    return genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        topK: 40,
      },
    })
  } catch (err) {
    console.error('[Gemini] Model initialization failed:', err)
    throw err
  }
}
