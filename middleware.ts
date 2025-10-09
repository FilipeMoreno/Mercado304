import { betterFetch } from "@better-fetch/fetch";
import type { Session } from "better-auth/types";
import { NextResponse, type NextRequest } from "next/server";

export default async function authMiddleware(request: NextRequest) {
	// Allow preflight and HEAD without auth checks
	if (request.method === "OPTIONS" || request.method === "HEAD") {
		return NextResponse.next();
	}

	const { pathname } = request.nextUrl;
	// Bypass auth for public and static paths
	if (
		pathname === "/offline" ||
		pathname === "/favicon.ico" ||
		pathname === "/manifest.json" ||
		pathname.startsWith("/auth") ||
		pathname.startsWith("/_next/") ||
		pathname.startsWith("/api/auth") ||
		/\.(png|jpg|jpeg|gif|svg|ico|webp|avif)$/.test(pathname)
	) {
		return NextResponse.next();
	}

	// If there are no cookies, skip round-trip and redirect
	const cookieHeader = request.headers.get("cookie") || "";
	if (!cookieHeader) {
		return NextResponse.redirect(new URL("/auth/signin", request.url));
	}

	const { data: session } = await betterFetch<Session>(
		"/api/auth/get-session",
		{
			baseURL: request.nextUrl.origin,
			headers: {
				//get the cookie from the request
				cookie: cookieHeader,
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
    '/((?!api/auth|auth|offline|_next/static|_next/image|favicon.ico|manifest.json|.*\.png$|.*\.jpg$|.*\.jpeg$|.*\.gif$|.*\.svg$|.*\.ico$).*)',
  ],
}