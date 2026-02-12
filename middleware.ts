import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // updateSession handles refreshing the session
  // We need to modify updateSession or handle logic here.
  // Since updateSession returns a response, we should probably let it handle the session
  // and then we can check for session on the request if we want to guard routes,
  // BUT updateSession in the library just refreshes cookies.
  // The standard pattern with @supabase/ssr is to do the check inside updateSession or similar.
  // However, keeping logic simple: we can wrap the response.
  
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth/callback (auth callback route)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

