import { betterFetch } from "@better-fetch/fetch";
import { NextResponse, type NextRequest } from "next/server";

interface SessionWithUser {
	user: {
		id: string;
		email: string;
		emailVerified: boolean;
	};
	session: any;
}

export default async function authMiddleware(request: NextRequest) {
	// Next.js 15 performance optimization: early return for static assets
	const pathname = request.nextUrl.pathname;
	
	// Skip auth for static assets and API routes that don't need auth
	if (
		pathname.startsWith('/_next/') ||
		pathname.startsWith('/api/auth/') ||
		pathname === '/favicon.ico' ||
		pathname === '/manifest.json' ||
		/\.(png|jpg|jpeg|gif|svg|ico|webp)$/.test(pathname)
	) {
		return NextResponse.next();
	}

	try {
		const { data: session } = await betterFetch<SessionWithUser>(
			"/api/auth/get-session",
			{
				baseURL: request.nextUrl.origin,
				headers: {
					cookie: request.headers.get("cookie") || "",
				},
				// Next.js 15 optimization: shorter timeout for middleware
				signal: AbortSignal.timeout(5000),
			},
		);

		// Se não está autenticado, redireciona para login
		if (!session?.user) {
			// Don't redirect if already on auth pages
			if (pathname.startsWith('/auth/')) {
				return NextResponse.next();
			}
			return NextResponse.redirect(new URL("/auth/signin", request.url));
		}

		// Se está autenticado mas email não está verificado
		if (!session.user.emailVerified) {
			console.log(`[Middleware] User ${session.user.id} email NOT verified, accessing: ${pathname}`);

			// Permite acesso a página de verificação e APIs
			if (
				pathname.startsWith("/auth/verify-request") ||
				pathname.startsWith("/api/") ||
				pathname.startsWith("/auth/verify-email")
			) {
				return NextResponse.next();
			}

			// Bloqueia acesso a qualquer outra página
			console.log(`[Middleware] Blocking access to ${pathname}, redirecting to /auth/verify-request`);
			return NextResponse.redirect(new URL("/auth/verify-request", request.url));
		}

		console.log(`[Middleware] User ${session.user.id} email IS verified, allowing access`);
		
		// Next.js 15: Add cache headers for authenticated requests
		const response = NextResponse.next();
		response.headers.set('x-user-id', session.user.id);
		response.headers.set('x-user-verified', 'true');
		
		return response;
		
	} catch (error) {
		console.error('[Middleware] Error fetching session:', error);
		
		// On error, allow access to auth pages but redirect others to login
		if (pathname.startsWith('/auth/')) {
			return NextResponse.next();
		}
		
		return NextResponse.redirect(new URL("/auth/signin", request.url));
	}
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api/auth (Better Auth API routes)
		 * - auth/signin, auth/signup (páginas públicas de login)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - manifest.json (PWA manifest)
		 * - public files
		 * 
		 * Mas INCLUI /auth/verify-request e /auth/verify-email que precisam da verificação
		 */
		'/((?!api/auth|auth/signin|auth/signup|_next/static|_next/image|favicon.ico|manifest.json|.*\.png$|.*\.jpg$|.*\.jpeg$|.*\.gif$|.*\.svg$|.*\.ico$).*)',
	],
}