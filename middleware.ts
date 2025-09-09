import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Middleware function runs when user is authenticated
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Check if user has a valid token
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - auth (auth pages)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest)
     * - public files
     */
    '/((?!api/auth|auth|_next/static|_next/image|favicon.ico|manifest.json|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|.*\\.ico$).*)',
  ],
}