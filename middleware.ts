import { betterFetch } from "@better-fetch/fetch";
import type { Session } from "better-auth/types";
import { NextResponse, type NextRequest } from "next/server";

export default async function authMiddleware(request: NextRequest) {
	const { data: session } = await betterFetch<Session>(
		"/api/auth/get-session",
		{
			baseURL: request.nextUrl.origin,
			headers: {
				//get the cookie from the request
				cookie: request.headers.get("cookie") || "",
			},
		},
	);

	if (!session) {
		return NextResponse.redirect(new URL("/auth/signin", request.url));
	}
	return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (Better Auth API routes)
     * - auth (auth pages)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest)
     * - public files
     */
    '/((?!api/auth|auth|_next/static|_next/image|favicon.ico|manifest.json|.*\.png$|.*\.jpg$|.*\.jpeg$|.*\.gif$|.*\.svg$|.*\.ico$).*)',
  ],
}