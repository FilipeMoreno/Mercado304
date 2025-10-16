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
	const { data: session } = await betterFetch<SessionWithUser>(
		"/api/auth/get-session",
		{
			baseURL: request.nextUrl.origin,
			headers: {
				//get the cookie from the request
				cookie: request.headers.get("cookie") || "",
			},
		},
	);

	// Se não está autenticado, redireciona para login
	if (!session?.user) {
		return NextResponse.redirect(new URL("/auth/signin", request.url));
	}

	// Se está autenticado mas email não está verificado
	// Permite acesso APENAS a /auth/verify-request e /api/*
	if (!session.user.emailVerified) {
		const pathname = request.nextUrl.pathname;

		console.log(`[Middleware] User ${session.user.id} email NOT verified, accessing: ${pathname}`);

		// Permite acesso a página de verificação e APIs
		if (pathname.startsWith("/auth/verify-request") ||
			pathname.startsWith("/api/") ||
			pathname.startsWith("/auth/verify-email")) {
			return NextResponse.next();
		}

		// Bloqueia acesso a qualquer outra página
		console.log(`[Middleware] Blocking access to ${pathname}, redirecting to /auth/verify-request`);
		return NextResponse.redirect(new URL("/auth/verify-request", request.url));
	}

	console.log(`[Middleware] User ${session.user.id} email IS verified (${session.user.emailVerified}), allowing access`);
	return NextResponse.next();
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