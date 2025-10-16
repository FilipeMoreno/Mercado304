"use client"

import { Key, Loader2, Mail, ShieldCheck, ShoppingCart } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { emailOtp, signIn, twoFactor, useSession } from "@/lib/auth-client"
import { handleAuthError, showAuthSuccess } from "@/lib/auth-errors"

type VerificationMode = "totp" | "backup" | "email"

export default function TwoFactorPage() {
	const [code, setCode] = useState("")
	const [isLoading, setIsLoading] = useState(false)
	const [mode, setMode] = useState<VerificationMode>("totp")
	const [trustDevice, setTrustDevice] = useState(false)
	const [emailCodeSent, setEmailCodeSent] = useState(false)
	const [isSendingEmail, setIsSendingEmail] = useState(false)
	const [cooldown, setCooldown] = useState(0)

	// Inicializa como true OPTIMISTIC se encontrar email no storage
	// Isso evita flash - assume que se está fazendo 2FA e tem email salvo, provavelmente tem 2FA email ativo
	const [hasEmailEnabled, setHasEmailEnabled] = useState(() => {
		if (typeof window !== 'undefined') {
			const hasStoredEmail =
				sessionStorage.getItem("2fa_user_email") ||
				localStorage.getItem("2fa_user_email_temp") ||
				localStorage.getItem("lastUserEmail")
			return !!hasStoredEmail // Se tem email salvo, assume que pode ter 2FA email
		}
		return false
	})

	const router = useRouter()
	const { data: session } = useSession()

	// Cooldown timer
	useEffect(() => {
		let timer: NodeJS.Timeout
		if (cooldown > 0) {
			timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
		}
		return () => clearTimeout(timer)
	}, [cooldown])

	// Verifica REAL status em background (não bloqueia renderização)
	useEffect(() => {
		const checkEmail2FA = async () => {
			try {
				// Tenta múltiplas fontes de email primeiro
				let userEmail = sessionStorage.getItem("2fa_user_email") ||
					localStorage.getItem("2fa_user_email_temp") ||
					localStorage.getItem("lastUserEmail")

				if (!userEmail) {
					const response = await fetch("/api/auth/two-factor/check-email-enabled")
					const data = await response.json()
					setHasEmailEnabled(data.enabled || false)
					return
				}

				// Busca diretamente por email (mais rápido)
				const response = await fetch("/api/auth/two-factor/check-email-by-email", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ email: userEmail }),
				})

				if (response.ok) {
					const data = await response.json()
					// Só atualiza se for diferente do estado otimista
					setHasEmailEnabled(data.enabled || false)
				}
			} catch (error) {
				console.error("[2FA-Page] Error checking email 2FA:", error)
				// Em caso de erro, mantém o estado otimista
			}
		}

		// Executa em background sem bloquear
		checkEmail2FA()
	}, [])

	const handleSendEmailCode = async () => {
		if (cooldown > 0) return

		setIsSendingEmail(true)
		try {
			// Pega o email salvo no storage
			const userEmail = sessionStorage.getItem("2fa_user_email") ||
				localStorage.getItem("2fa_user_email_temp") ||
				localStorage.getItem("lastUserEmail")

			// Usa o plugin nativo emailOTP do Better Auth
			const result = await emailOtp.sendVerificationOtp({
				email: userEmail!,
				type: "sign-in",
			})

			if (result.error) {
				throw new Error(result.error.message || "Erro ao enviar código")
			}

			toast.success("Código enviado para seu email!")
			setEmailCodeSent(true)
			setMode("email")
			setCooldown(60) // 60 segundos de cooldown
		} catch (error: any) {
			console.error("[2FA-Page] Error sending email code:", error)
			toast.error(error.message || "Erro ao enviar código por email")
		} finally {
			setIsSendingEmail(false)
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsLoading(true)

		try {
			let result

			if (mode === "backup") {
				// Verificar código de backup
				if (!code.trim()) {
					toast.error("Por favor, insira um código de backup.")
					setIsLoading(false)
					return
				}
				result = await twoFactor.verifyBackupCode({
					code,
					trustDevice
				})
			} else if (mode === "email") {
				// Verificar código recebido por email usando Better Auth emailOTP
				if (code.length !== 6) {
					toast.error("O código deve ter 6 dígitos.")
					setIsLoading(false)
					return
				}

				// Pega o email do storage
				const userEmail = sessionStorage.getItem("2fa_user_email") ||
					localStorage.getItem("2fa_user_email_temp") ||
					localStorage.getItem("lastUserEmail")

				// Usa o plugin nativo emailOTP do Better Auth para fazer login
				const emailOtpResult = await signIn.emailOtp({
					email: userEmail!,
					otp: code,
				})

				if (emailOtpResult.error) {
					console.error("[2FA-Page] Email OTP sign in failed:", emailOtpResult.error)
					handleAuthError(emailOtpResult.error, "signin")
					return
				}

				// Define result para continuar o fluxo
				result = emailOtpResult

				// Limpa os emails temporários
				sessionStorage.removeItem("2fa_user_email")
				localStorage.removeItem("2fa_user_email_temp")

				// Registra método de login
				localStorage.setItem("lastLoginMethod", "email")

				// Mostra sucesso e redireciona (Better Auth já criou a sessão)
				showAuthSuccess("signin")
				window.location.href = "/"
				return
			} else {
				// Verificar código TOTP do app
				if (code.length !== 6) {
					toast.error("O código do autenticador deve ter 6 dígitos.")
					setIsLoading(false)
					return
				}
				result = await twoFactor.verifyTotp({
					code,
					trustDevice
				})
			}

			if (result.error) {
				handleAuthError(result.error, "general")
				return
			}

			showAuthSuccess("signin")
			router.push("/")
		} catch (error: any) {
			handleAuthError({ message: error.message || "Erro ao verificar o código" }, "general")
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="flex flex-col space-y-2 text-center mb-6">
			<div className="flex items-center justify-center mb-4">
				<ShoppingCart className="mr-2 h-8 w-8 text-blue-600" />
				<h1 className="text-2xl font-semibold text-blue-600">Mercado304</h1>
			</div>
			<Card>
				<CardHeader className="text-center">
					<CardTitle>Verificação de Dois Fatores</CardTitle>
					<CardDescription>
						{mode === "backup" && "Digite um dos seus códigos de backup para continuar."}
						{mode === "email" && "Digite o código de 6 dígitos enviado para seu email."}
						{mode === "totp" && "Digite o código de 6 dígitos do seu aplicativo autenticador."}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="2fa-code">
								{mode === "backup" && "Código de Backup"}
								{mode === "email" && "Código do Email"}
								{mode === "totp" && "Código de 6 dígitos"}
							</Label>
							<div className="relative">
								{mode === "backup" && <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />}
								{mode === "email" && <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />}
								{mode === "totp" && <ShieldCheck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />}
								<Input
									id="2fa-code"
									type="text"
									inputMode={mode === "backup" ? "text" : "numeric"}
									pattern={mode === "backup" ? undefined : "[0-9]{6}"}
									maxLength={mode === "backup" ? undefined : 6}
									placeholder={mode === "backup" ? "xxxx-xxxx" : "_ _ _ _ _ _"}
									value={code}
									onChange={(e) => setCode(e.target.value)}
									className={`pl-9 ${mode !== "backup" && "text-center tracking-[0.5em]"}`}
									required
									disabled={isLoading}
								/>
							</div>
						</div>

						{/* Checkbox para confiar no dispositivo */}
						<div className="flex items-center space-x-2">
							<input
								type="checkbox"
								id="trustDevice"
								checked={trustDevice}
								onChange={(e) => setTrustDevice(e.target.checked)}
								disabled={isLoading}
								className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
							/>
							<label htmlFor="trustDevice" className="text-sm text-muted-foreground cursor-pointer">
								Confiar neste dispositivo por 60 dias
							</label>
						</div>

						<Button type="submit" className="w-full" disabled={isLoading || code.length < 6}>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Verificando...
								</>
							) : (
								"Verificar Código"
							)}
						</Button>
					</form>
				</CardContent>
				<CardFooter className="flex flex-col gap-2">
					{/* Debug info - remover depois */}
					{process.env.NODE_ENV === "development" && (
						<div className="text-xs text-muted-foreground mb-2">
							Debug: mode={mode}, hasEmailEnabled={hasEmailEnabled.toString()}, emailCodeSent={emailCodeSent.toString()}, cooldown={cooldown}
						</div>
					)}

					{mode === "email" && emailCodeSent && (
						<Button
							variant="outline"
							className="w-full"
							onClick={handleSendEmailCode}
							disabled={isSendingEmail || cooldown > 0}
						>
							{isSendingEmail ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Reenviando...
								</>
							) : cooldown > 0 ? (
								<>
									<Mail className="mr-2 h-4 w-4" />
									Reenviar código em {cooldown}s
								</>
							) : (
								<>
									<Mail className="mr-2 h-4 w-4" />
									Reenviar código
								</>
							)}
						</Button>
					)}

					{mode !== "email" && hasEmailEnabled && (
						<Button
							variant="outline"
							className="w-full"
							onClick={handleSendEmailCode}
							disabled={isSendingEmail || cooldown > 0}
						>
							{isSendingEmail ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Enviando...
								</>
							) : cooldown > 0 ? (
								<>
									<Mail className="mr-2 h-4 w-4" />
									Aguarde {cooldown}s para enviar
								</>
							) : (
								<>
									<Mail className="mr-2 h-4 w-4" />
									Receber código por email
								</>
							)}
						</Button>
					)}
					<Button
						variant="link"
						className="w-full text-sm"
						onClick={() => {
							if (mode === "email") {
								setMode("totp")
								setEmailCodeSent(false)
							} else if (mode === "backup") {
								setMode("totp")
							} else {
								setMode("backup")
							}
							setCode("")
						}}
					>
						{mode === "email" && "Voltar para código do aplicativo"}
						{mode === "backup" && "Usar código do aplicativo"}
						{mode === "totp" && "Usar um código de backup"}
					</Button>
				</CardFooter>
			</Card>
		</div>
	)
}
