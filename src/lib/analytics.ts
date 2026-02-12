'use client'

export function useAnalytics() {
  const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] ${eventName}`, properties)
    }
    // In production, send to PostHog/Google Analytics/etc.
  }

  return { trackEvent }
}
