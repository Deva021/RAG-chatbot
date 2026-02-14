/**
 * Simple sanitizer to prevent XSS in rendered markdown/HTML.
 * Strips <script>, <iframe>, <object>, <embed>, on* attributes, and javascript: URLs.
 */
export function sanitizeMarkdown(raw: string): string {
  if (!raw) return ''

  let clean = raw

  // Remove script tags and content
  clean = clean.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")

  // Remove other dangerous tags
  clean = clean.replace(/<\/?(iframe|object|embed|form|input|button)\b[^>]*>/gim, "")

  // Remove event handlers (on*)
  clean = clean.replace(/ on\w+="[^"]*"/gim, "")
  clean = clean.replace(/ on\w+='[^']*'/gim, "")

  // Remove javascript: links
  clean = clean.replace(/href=["']\s*javascript:[^"']*["']/gim, 'href="#"')

  // Remove explicit <style> tags (optional, but good for consistent UI)
  clean = clean.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")

  return clean
}
