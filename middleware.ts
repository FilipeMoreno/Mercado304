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

/**
 * Middleware de autenticação com suporte offline
 *
 * Fluxo:
 * 1. Tenta validar sessão online (requisição ao servidor)
 * 2. Se falhar (offline), verifica se há sessão em cache válida
 * 3. Permite acesso offline para usuários com sessão cacheada
 */
export default async function authMiddleware(request: NextRequest) {
	const pathname = request.nextUrl.pathname;

	// Permitir acesso direto a rotas públicas
	const publicPaths = ["/auth/signin", "/auth/signup", "/auth/callback"];
	if (publicPaths.some(path => pathname.startsWith(path))) {
		return NextResponse.next();
	}

	let session: SessionWithUser | null = null;
	let isOffline = false;

	// Verificar cookies ANTES de tentar validar online
	const cookies = request.headers.get("cookie") || "";
	console.log(`[Middleware] 🍪 Cookies completos:`, cookies);

	// Better Auth usa cookies HTTP-only com nome "better-auth.session_token"
	// Este cookie é HTTP-only então não aparece no document.cookie do JavaScript
	const hasSessionCookie = cookies.includes("better-auth.session_token");

	console.log(`[Middleware] 🔑 Tem cookie de sessão? ${hasSessionCookie}`);

	// Tentar validar sessão online COM TIMEOUT MUITO CURTO
	try {
		console.log(`[Middleware] 🔍 Tentando validar sessão online para ${pathname}...`);

		// Promise.race com timeout MUITO curto para detectar offline rapidamente
		const fetchPromise = betterFetch<SessionWithUser>(
			"/api/auth/get-session",
			{
				baseURL: request.nextUrl.origin,
				headers: {
					cookie: cookies,
				},
			},
		);

		const timeoutPromise = new Promise<never>((_, reject) => {
			setTimeout(() => {
				console.log(`[Middleware] ⏱️ Timeout atingido - assumindo offline`);
				reject(new Error("Timeout - modo offline"));
			}, 1000); // 1 segundo apenas
		});

		const response = await Promise.race([fetchPromise, timeoutPromise]);
		session = response.data;
		console.log(`[Middleware] ✅ Sessão validada online para user ${session.user?.id}`);
	} catch (error) {
		// Erro ao validar sessão (possivelmente offline ou timeout)
		const errorMsg = error instanceof Error ? error.message : String(error);
		console.log(`[Middleware] ⚠️ Erro ao validar sessão:`, errorMsg.substring(0, 150));
		isOffline = true;
	}

	// Se não conseguiu validar online, verificar cache de sessão
	if (isOffline) {
		if (hasSessionCookie) {
			// Usuário tem cookie de sessão, permitir acesso offline
			console.log(`[Middleware] ✅ MODO OFFLINE ATIVADO - Permitindo acesso com sessão em cache para ${pathname}`);

			// Adicionar header indicando modo offline
			const response = NextResponse.next();
			response.headers.set("X-Offline-Mode", "true");
			return response;
		} else {
			// Sem sessão e sem cookie, redirecionar para login
			console.log(`[Middleware] ❌ Offline sem sessão - redirecionando para login`);
			return NextResponse.redirect(new URL("/auth/signin", request.url));
		}
	}

	// Se não está autenticado (nem online nem offline), redireciona para login
	if (!session?.user) {
		console.log(`[Middleware] Sem sessão válida - redirecionando para login`);
		return NextResponse.redirect(new URL("/auth/signin", request.url));
	}

	// Se está autenticado mas email não está verificado
	// Permite acesso APENAS a /auth/verify-request e /api/*
	if (!session.user.emailVerified) {
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