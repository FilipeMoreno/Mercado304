import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useSession } from "@/lib/auth-client"

interface UseAuthRedirectOptions {
	redirectTo?: string
	requireEmailVerification?: boolean
	onRedirect?: () => void
}

export function useAuthRedirect(options: UseAuthRedirectOptions = {}) {
	const { data: session, isPending: sessionLoading } = useSession()
	const router = useRouter()
	const [hasRedirected, setHasRedirected] = useState(false)

	const { redirectTo = "/", requireEmailVerification = true, onRedirect } = options

	useEffect(() => {
		if (sessionLoading || hasRedirected) return

		if (session?.user) {
			// Se email não está verificado e é obrigatório, redireciona para verificação
			if (requireEmailVerification && !session.user.emailVerified) {
				router.push("/auth/verify-request")
				setHasRedirected(true)
				onRedirect?.()
				return
			}

			// Redireciona para o destino
			router.push(redirectTo)
			setHasRedirected(true)
			onRedirect?.()
		}
	}, [session, sessionLoading, hasRedirected, redirectTo, requireEmailVerification, router, onRedirect])

	return {
		session,
		sessionLoading,
		hasRedirected,
	}
}
