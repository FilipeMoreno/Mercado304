"use client"

import { Copy, Download, Eye, EyeOff, Loader2, Shield, ShieldCheck } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { twoFactor, useSession } from "@/lib/auth-client"
import { handleAuthError } from "@/lib/auth-errors"

interface TwoFactorSetupProps {
	onComplete?: () => void
}

export function TwoFactorSetup({ onComplete }: TwoFactorSetupProps) {
	const { data: session } = useSession()
	const [step, setStep] = useState<"setup" | "password" | "verify" | "backup-codes">("setup")
	const [password, setPassword] = useState("")
	const [showPassword, setShowPassword] = useState(false)
	const [totpSecret, setTotpSecret] = useState<string>("")
	const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
	const [verificationCode, setVerificationCode] = useState("")
	const [backupCodes, setBackupCodes] = useState<string[]>([])
	const [showBackupCodes, setShowBackupCodes] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [hasPassword, setHasPassword] = useState<boolean | null>(null)

	// Verifica se o usuário tem senha ao montar o componente
	useEffect(() => {
		checkHasPassword()
	}, [checkHasPassword])

	const checkHasPassword = async () => {
		try {
			const response = await fetch("/api/user/has-password")
			if (response.ok) {
				const data = await response.json()
				setHasPassword(data.hasPassword)
			}
		} catch (error) {
			console.error("Erro ao verificar senha:", error)
			// Em caso de erro, assume que tem senha por segurança
			setHasPassword(true)
		}
	}

	const handleInitialSetup = async () => {
		// Se ainda não verificou se tem senha, verifica agora
		if (hasPassword === null) {
			await checkHasPassword()
			// Aguarda um pouco para garantir que o estado foi atualizado
			setTimeout(() => {
				if (hasPassword === false) {
					generateAndEnable2FA()
				} else {
					setStep("password")
				}
			}, 100)
		} else {
			// Já sabe se tem senha ou não
			if (!hasPassword) {
				generateAndEnable2FA()
			} else {
				setStep("password")
			}
		}
	}

	const generateAndEnable2FA = async () => {
		setIsLoading(true)
		try {
			let totpUriFromApi = ""
			let backupCodesFromApi: string[] = []

			if (!hasPassword) {
				// Para contas OAuth, usa endpoint customizado
				console.log("TwoFactorSetup: Using OAuth endpoint (no password)")
				const response = await fetch("/api/auth/two-factor/enable-oauth", {
					method: "POST",
				})

				if (!response.ok) {
					const data = await response.json()
					throw new Error(data.error || "Erro ao habilitar 2FA")
				}

				const data = await response.json()
				totpUriFromApi = data.totpURI || ""
				backupCodesFromApi = data.backupCodes || []
				console.log("TwoFactorSetup: OAuth endpoint success")
			} else {
				// Para contas com senha, usa o método normal do Better Auth
				console.log("TwoFactorSetup: Using standard Better Auth method")
				const result = await twoFactor.enable({
					password: password,
				})

				if (result.error) {
					handleAuthError(result.error, "general")
					setIsLoading(false)
					return
				}

				totpUriFromApi = result.data?.totpURI || ""
				backupCodesFromApi = result.data?.backupCodes || []
				console.log("TwoFactorSetup: Better Auth success")
			}

			const secretMatch = totpUriFromApi.match(/secret=([^&]+)/)
			const secret = secretMatch ? secretMatch[1] : ""

			setQrCodeUrl(totpUriFromApi)
			setTotpSecret(secret)
			setBackupCodes(backupCodesFromApi)

			if (totpUriFromApi) {
				setStep("verify")
			} else {
				toast.error("Não foi possível gerar o código QR. Tente novamente.")
			}
		} catch (error: any) {
			handleAuthError({ message: error.message || "Erro ao iniciar a configuração 2FA" }, "general")
		} finally {
			setIsLoading(false)
		}
	}

	const handlePasswordSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (!password.trim()) {
			toast.error("Por favor, digite sua senha atual.")
			return
		}
		generateAndEnable2FA()
	}

	const verifyAndCompleteSetup = async () => {
		if (!verificationCode.trim()) {
			toast.error("Digite o código de verificação")
			return
		}

		setIsLoading(true)
		try {
			if (!hasPassword) {
				// Para contas OAuth, usa endpoint customizado
				console.log("TwoFactorSetup: Verifying TOTP with OAuth endpoint")
				const response = await fetch("/api/auth/two-factor/verify-totp-oauth", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ code: verificationCode }),
				})

				if (!response.ok) {
					const data = await response.json()
					toast.error(data.error || "Código inválido")
					setIsLoading(false)
					return
				}

				console.log("TwoFactorSetup: TOTP verified successfully via OAuth endpoint")
			} else {
				// Para contas com senha, usa método normal do Better Auth
				console.log("TwoFactorSetup: Verifying TOTP with Better Auth")
				const verifyResult = await twoFactor.verifyTotp({
					code: verificationCode,
				})

				if (verifyResult.error) {
					handleAuthError(verifyResult.error, "general")
					setIsLoading(false)
					return
				}

				console.log("TwoFactorSetup: TOTP verified successfully via Better Auth")
			}

			setStep("backup-codes")
			toast.success("Autenticação de dois fatores ativada!")
		} catch (error: any) {
			handleAuthError({ message: error.message || "Erro ao verificar código" }, "general")
		} finally {
			setIsLoading(false)
		}
	}

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text)
		toast.success("Copiado para a área de transferência")
	}

	const copyAllBackupCodes = () => {
		const allCodes = backupCodes.join("; ")
		navigator.clipboard.writeText(allCodes)
		toast.success("Todos os códigos foram copiados")
	}

	const downloadBackupCodes = () => {
		const codesText = backupCodes.join("\n")
		const blob = new Blob([codesText], { type: "text/plain;charset=utf-8" })
		const url = URL.createObjectURL(blob)
		const link = document.createElement("a")
		link.href = url
		link.download = "mercado304-backup-codes.txt"
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
		URL.revokeObjectURL(url)
		toast.success("Códigos de backup baixados!")
	}

	const finishSetup = () => {
		toast.success("Configuração concluída!")
		onComplete?.()
	}

	if (step === "setup") {
		return (
			<Card className="w-full">
				<CardHeader className="text-center">
					<div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-blue-100">
						<Shield className="size-6 text-blue-600" />
					</div>
					<CardTitle>Configurar Autenticação de Dois Fatores</CardTitle>
					<CardDescription>Adicione uma camada extra de segurança à sua conta com TOTP</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{hasPassword === false && (
						<div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 p-4">
							<p className="text-sm text-blue-800 dark:text-blue-200">
								<strong>Conta OAuth detectada:</strong> Como você está usando login do Google, não será necessário
								confirmar senha para ativar o 2FA.
							</p>
						</div>
					)}
					<div className="rounded-lg bg-muted p-4">
						<h4 className="font-medium">Como funciona:</h4>
						<ul className="mt-2 space-y-1 text-sm text-muted-foreground">
							<li>• Configure um aplicativo authenticator (Google Authenticator, Authy, etc.)</li>
							<li>• Escaneie o QR Code ou digite o código manualmente</li>
							<li>• Digite o código de 6 dígitos para verificar</li>
							<li>• Salve os códigos de backup em local seguro</li>
						</ul>
					</div>
				</CardContent>
				<CardFooter>
					<Button onClick={handleInitialSetup} disabled={isLoading || hasPassword === null} className="w-full">
						{isLoading || hasPassword === null ? (
							<>
								<Loader2 className="mr-2 size-4 animate-spin" />
								{hasPassword === null ? "Verificando..." : "Aguarde..."}
							</>
						) : (
							"Iniciar Configuração"
						)}
					</Button>
				</CardFooter>
			</Card>
		)
	}

	if (step === "password") {
		return (
			<Card className="w-full">
				<CardHeader className="text-center">
					<CardTitle>Confirmar Identidade</CardTitle>
					<CardDescription>Para sua segurança, por favor, confirme sua senha para continuar.</CardDescription>
				</CardHeader>
				<form onSubmit={handlePasswordSubmit}>
					<CardContent>
						<div className="space-y-2">
							<Label htmlFor="password">Senha Atual</Label>
							<div className="relative">
								<Input
									id="password"
									type={showPassword ? "text" : "password"}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="Digite sua senha"
									required
									disabled={isLoading}
								/>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="absolute right-0 top-0 h-full px-3"
									onClick={() => setShowPassword(!showPassword)}
									disabled={isLoading}
								>
									{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
								</Button>
							</div>
						</div>
					</CardContent>
					<CardFooter className="flex flex-col gap-2">
						<Button type="submit" disabled={isLoading} className="w-full">
							{isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : "Continuar"}
						</Button>
						<Button variant="outline" onClick={() => setStep("setup")} className="w-full">
							Voltar
						</Button>
					</CardFooter>
				</form>
			</Card>
		)
	}

	if (step === "verify") {
		return (
			<Card className="w-full">
				<CardHeader className="text-center">
					<CardTitle>Escaneie o QR Code</CardTitle>
					<CardDescription>Use seu aplicativo authenticator para escanear o código</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex justify-center">
						<div className="rounded-lg bg-white p-4">
							{qrCodeUrl ? <QRCodeSVG value={qrCodeUrl} size={200} /> : <Loader2 className="size-12 animate-spin" />}
						</div>
					</div>

					<div className="space-y-2">
						<Label className="text-sm font-medium">Código manual (se não conseguir escanear):</Label>
						<div className="flex items-center space-x-2">
							<Input value={totpSecret} readOnly className="text-xs font-mono" />
							<Button size="sm" variant="outline" onClick={() => copyToClipboard(totpSecret)}>
								<Copy className="size-4" />
							</Button>
						</div>
					</div>

					<Separator />

					<div className="space-y-2">
						<Label htmlFor="verification-code">Código de verificação</Label>
						<Input
							id="verification-code"
							type="text"
							placeholder="Digite o código de 6 dígitos"
							value={verificationCode}
							onChange={(e) => setVerificationCode(e.target.value)}
							maxLength={6}
							className="text-center text-lg font-mono"
						/>
					</div>
				</CardContent>
				<CardFooter className="flex space-x-2">
					<Button variant="outline" onClick={() => setStep(hasPassword ? "password" : "setup")} className="flex-1">
						Voltar
					</Button>
					<Button
						onClick={verifyAndCompleteSetup}
						disabled={isLoading || verificationCode.length < 6}
						className="flex-1"
					>
						{isLoading ? (
							<>
								<Loader2 className="mr-2 size-4 animate-spin" />
								Verificando...
							</>
						) : (
							"Verificar e Ativar"
						)}
					</Button>
				</CardFooter>
			</Card>
		)
	}

	if (step === "backup-codes") {
		return (
			<Card className="w-full">
				<CardHeader className="text-center">
					<div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-green-100">
						<ShieldCheck className="size-6 text-green-600" />
					</div>
					<CardTitle>Códigos de Backup</CardTitle>
					<CardDescription>
						Salve estes códigos em local seguro. Eles podem ser usados para acessar sua conta se você perder acesso ao
						seu authenticator.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="rounded-lg bg-red-50 border border-red-200 p-4">
						<div className="flex items-center space-x-2 mb-2">
							<Shield className="size-4 text-red-600" />
							<span className="font-medium text-red-800">Importante:</span>
						</div>
						<ul className="text-sm text-red-700 space-y-1">
							<li>• Cada código só pode ser usado uma vez</li>
							<li>• Armazene em local seguro (gerenciador de senhas)</li>
							<li>• Não compartilhe estes códigos com ninguém</li>
						</ul>
					</div>

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label>Códigos de backup</Label>
							<div className="flex space-x-2">
								<Button size="sm" variant="outline" onClick={() => setShowBackupCodes(!showBackupCodes)}>
									{showBackupCodes ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
								</Button>
								<Button size="sm" variant="outline" onClick={copyAllBackupCodes}>
									<Copy className="size-4" />
								</Button>
								<Button size="sm" variant="outline" onClick={downloadBackupCodes}>
									<Download className="size-4" />
								</Button>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-2">
							{backupCodes.map((code, index) => (
								<Badge
									key={index}
									variant="secondary"
									className="justify-center p-2 font-mono text-xs cursor-pointer hover:bg-secondary/80"
									onClick={() => copyToClipboard(code)}
								>
									{showBackupCodes ? code : "••••••••"}
								</Badge>
							))}
						</div>
					</div>
				</CardContent>
				<CardFooter>
					<Button onClick={finishSetup} className="w-full">
						Concluir Configuração
					</Button>
				</CardFooter>
			</Card>
		)
	}

	return null
}
