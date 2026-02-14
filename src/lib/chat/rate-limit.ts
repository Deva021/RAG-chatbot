const WINDOW_SIZE_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS = 20

interface UserRateLimit {
  count: number
  expiresAt: number
}

// In-memory store (per serverless instance)
const rateLimitMap = new Map<string, UserRateLimit>()

export function checkRateLimit(userId: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now()
  const record = rateLimitMap.get(userId)

  // Clean up if expired
  if (record && now > record.expiresAt) {
    rateLimitMap.delete(userId)
  }

  if (!rateLimitMap.has(userId)) {
    rateLimitMap.set(userId, { count: 1, expiresAt: now + WINDOW_SIZE_MS })
    return { allowed: true }
  }

  const current = rateLimitMap.get(userId)!

  if (current.count >= MAX_REQUESTS) {
    return { 
      allowed: false, 
      retryAfterMs: current.expiresAt - now 
    }
  }

  current.count++
  return { allowed: true }
}
