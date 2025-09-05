// middleware.ts

export { default } from "next-auth/middleware"

export const config = {
  // O matcher define quais rotas serão protegidas pelo middleware
  // Todas as rotas, exceto as da API, de assets e a página de login,
  // exigirão autenticação.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|login|manifest.json).*)",
  ],
}