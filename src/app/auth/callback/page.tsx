"use client"

import { Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useSession } from "@/lib/auth-client"
import { showAuthSuccess } from "@/lib/auth-errors"

export default function AuthCallbackPage() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const { data: session, isPending: sessionLoading } = useSession()
	const [hasProcessed, setHasProcessed] = useState(false)

	useEffect(() => {
		if (sessionLoading || hasProcessed) return

		if (session?.user) {
			// Login bem-sucedido via OAuth
			const provider = searchParams.get("provider") || "google"

			// Salva o método de login usado
			localStorage.setItem("lastLoginMethod", provider)

			// Registra no histórico de auditoria
			fetch("/api/auth/log-auth-event", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					eventType: "login",
					method: provider,
				}),
			}).catch((err) => console.error("Failed to log auth event:", err))

			// Para OAuth, verifica email automaticamente (Google já validou)
			if (!session.user.emailVerified && provider === "google") {
				fetch("/api/auth/verify-oauth-email", {
					method: "POST",
				})
					.then(() => {
						// Mostra toast de sucesso
						showAuthSuccess("signin")
						setHasProcessed(true)
						// Redireciona para home
						router.push("/")
					})
					.catch((err) => {
						console.error("Failed to verify OAuth email:", err)
						// Mesmo com erro, mostra toast e redireciona
						showAuthSuccess("signin")
						setHasProcessed(true)
						router.push("/")
					})
			} else {
				// Mostra toast de sucesso
				showAuthSuccess("signin")
				setHasProcessed(true)

				// Verifica se email está verificado antes de redirecionar
				if (!session.user.emailVerified) {
					router.push("/auth/verify-request")
				} else {
					router.push("/")
				}
			}
		} else if (!sessionLoading) {
			// Se não há sessão após o callback, houve algum erro
			router.push("/auth/signin")
		}
	}, [session, sessionLoading, hasProcessed, router, searchParams])

	return (
		<div className="min-h-screen flex items-center justify-center">
			<div className="text-center space-y-4">
				<Loader2 className="size-8 animate-spin mx-auto" />
				<p className="text-muted-foreground">Finalizando autenticação...</p>
			</div>
		</div>
	)
}
