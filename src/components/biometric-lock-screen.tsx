"use client"

import { Fingerprint, Lock, ShieldAlert } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { passkey, signIn, signOut, useSession } from "@/lib/auth-client"
import { handleAuthError } from "@/lib/auth-errors"

interface BiometricLockScreenProps {
	onUnlock: () => void
	autoPrompt?: boolean
}

export function BiometricLockScreen({ onUnlock, autoPrompt = true }: BiometricLockScreenProps) {
	const { data: session } = useSession()
	const [isAuthenticating, setIsAuthenticating] = useState(false)
	const [hasPrompted, setHasPrompted] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// Função para autenticar com biometria
	const authenticate = useCallback(async () => {
		if (isAuthenticating) return

		setIsAuthenticating(true)
		setError(null)

		try {
			// Usa o passkey do better-auth para autenticação biométrica
			const result = await passkey.signIn()

			if (result?.error) {
				throw result.error
			}

			// Se autenticou com sucesso, desbloqueia
			toast.success("Desbloqueado com sucesso!")
			onUnlock()
		} catch (err) {
			console.error("Erro ao autenticar com biometria:", err)
			const error = err as Error & { name?: string; message?: string }

			// Trata erros específicos
			if (error.name === "NotAllowedError") {
				setError("Autenticação cancelada ou não permitida")
			} else if (error.name === "NotSupportedError") {
				setError("Biometria não suportada neste dispositivo")
			} else if (error.name === "InvalidStateError") {
				setError("Estado inválido. Tente novamente.")
			} else if (error.message?.includes("No credential available")) {
				setError("Nenhuma credencial biométrica encontrada. Configure nas configurações.")
			} else {
				handleAuthError(error, "signin")
				setError("Falha na autenticação. Tente novamente.")
			}
		} finally {
			setIsAuthenticating(false)
		}
	}, [isAuthenticating, onUnlock])

	// Auto-prompt ao carregar (se habilitado)
	useEffect(() => {
		if (autoPrompt && !hasPrompted && !isAuthenticating) {
			setHasPrompted(true)
			// Pequeno delay para melhor UX
			const timer = setTimeout(() => {
				authenticate()
			}, 500)

			return () => clearTimeout(timer)
		}
	}, [autoPrompt, hasPrompted, isAuthenticating, authenticate])

	// Logout do usuário
	const handleLogout = async () => {
		try {
			await signOut()
			toast.success("Logout realizado com sucesso")
			window.location.href = "/auth/signin"
		} catch (err) {
			console.error("Erro ao fazer logout:", err)
			toast.error("Erro ao fazer logout")
		}
	}

	return (
		<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
			{/* Background pattern */}
			<div className="absolute inset-0 opacity-5">
				<div
					className="absolute inset-0"
					style={{
						backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
						backgroundSize: "40px 40px",
					}}
				/>
			</div>

			{/* Content */}
			<div className="relative z-10 flex flex-col items-center justify-center px-6 text-center">
				{/* Logo/Icon */}
				<div className="mb-8">
					<div className="relative">
						<div className="absolute inset-0 animate-pulse rounded-full bg-blue-500/20 blur-2xl" />
						<div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/50">
							{error ? <ShieldAlert className="size-12 text-white" /> : <Fingerprint className="size-12 text-white" />}
						</div>
					</div>
				</div>

				{/* Title */}
				<h1 className="mb-2 text-3xl font-bold text-white">{error ? "Erro na Autenticação" : "App Bloqueado"}</h1>

				{/* Subtitle */}
				<p className="mb-8 max-w-sm text-gray-400">
					{error ? (
						error
					) : (
						<>
							Use sua biometria para desbloquear
							{session?.user?.name && (
								<>
									<br />
									<span className="mt-2 inline-block text-sm text-gray-500">Bem-vindo(a), {session.user.name}</span>
								</>
							)}
						</>
					)}
				</p>

				{/* Action Buttons */}
				<div className="flex flex-col gap-3 w-full max-w-xs">
					<Button
						onClick={authenticate}
						disabled={isAuthenticating}
						size="lg"
						className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
					>
						{isAuthenticating ? (
							<>
								<div className="mr-2 size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
								Autenticando...
							</>
						) : (
							<>
								<Fingerprint className="mr-2 size-5" />
								{error ? "Tentar Novamente" : "Desbloquear"}
							</>
						)}
					</Button>

					<Button
						onClick={handleLogout}
						variant="ghost"
						size="lg"
						className="w-full text-gray-400 hover:text-white hover:bg-white/10"
					>
						<Lock className="mr-2 size-4" />
						Fazer Logout
					</Button>
				</div>

				{/* Help text */}
				<p className="mt-8 text-xs text-gray-500">Configure o bloqueio biométrico nas configurações da conta</p>
			</div>

			{/* Decorative elements */}
			<div className="absolute top-20 left-10 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" />
			<div className="absolute bottom-20 right-10 h-32 w-32 rounded-full bg-purple-500/10 blur-3xl" />
		</div>
	)
}
