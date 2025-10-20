"use client"

import { Eye, EyeOff, Fingerprint, Loader2, Shield, Smartphone, Trash2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { passkey, useSession } from "@/lib/auth-client"
import { handleAuthError, showAuthSuccess } from "@/lib/auth-errors"

interface PasskeySetupProps {
	onComplete?: () => void
}

interface PasskeyCredential {
	id: string
	name: string
	createdAt: Date
}

export function PasskeySetup({ onComplete }: PasskeySetupProps) {
	const { data: session } = useSession()
	const [step, setStep] = useState<"setup" | "password" | "register" | "manage">("setup")
	const [password, setPassword] = useState("")
	const [showPassword, setShowPassword] = useState(false)
	const [credentialName, setCredentialName] = useState("")
	const [credentials, setCredentials] = useState<PasskeyCredential[]>([])
	const [isLoading, setIsLoading] = useState(false)

	const isSocialAccount = !!session?.user?.image

	// Função para buscar os passkeys existentes
	const fetchExistingPasskeys = useCallback(async () => {
		setIsLoading(true)
		try {
			const result = await passkey.listUserPasskeys()
			if (result.data) {
				// Converte a string de data para um objeto Date
				setCredentials(
					result.data.map((p: any) => ({
						id: p.id || '',
						name: p.name || 'Passkey',
						createdAt: new Date(p.createdAt || Date.now()),
					})),
				)
			}
		} catch (error: unknown) {
			handleAuthError({ message: (error as Error).message || "Erro ao buscar passkeys existentes" }, "general")
		} finally {
			setIsLoading(false)
		}
	}, [])

	// Carrega os passkeys existentes ao entrar na tela de gerenciamento
	useEffect(() => {
		if (step === "manage") {
			fetchExistingPasskeys()
		}
	}, [step, fetchExistingPasskeys])

	const handleInitialSetup = () => {
		if (isSocialAccount) {
			setStep("register")
		} else {
			setStep("password")
		}
	}

	const registerPasskey = async () => {
		if (!credentialName.trim()) {
			toast.error("Digite um nome para identificar este dispositivo")
			return
		}

		setIsLoading(true)
		try {
			const result = await passkey.addPasskey({
				name: credentialName,
				...(!isSocialAccount && { password: password }),
			})

			// CORREÇÃO: Verifica se existe um objeto de resultado e se ele contém um erro.
			if (result?.error) {
				// Verifica se é um erro de cancelamento
				if (
					result.error.message?.toLowerCase().includes("cancelled") ||
					result.error.message?.toLowerCase().includes("canceled") ||
					result.error.message?.toLowerCase().includes("abort")
				) {
					// Não mostra erro para cancelamento pelo usuário
					setIsLoading(false)
					return
				}

				handleAuthError(result.error, "general")
				return
			}

			// Registra evento de criação no histórico E envia email
			fetch("/api/auth/log-security-event", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					eventType: "passkey_added",
					metadata: { name: credentialName },
					sendEmail: true, // Flag para enviar email
				}),
			}).catch(err => console.error("Failed to log passkey creation:", err))

			toast.success("Passkey registrado com sucesso!")

			// Atualiza a lista de credenciais para exibir a nova
			await fetchExistingPasskeys()
			setCredentialName("")
			setStep("manage")
		} catch (error: unknown) {
			const errorMessage = (error as Error).message || "Erro ao registrar passkey"

			// Verifica se é um erro de cancelamento
			if (
				errorMessage.toLowerCase().includes("cancelled") ||
				errorMessage.toLowerCase().includes("canceled") ||
				errorMessage.toLowerCase().includes("abort")
			) {
				// Não mostra erro para cancelamento pelo usuário
				setIsLoading(false)
				return
			}

			handleAuthError({ message: errorMessage }, "general")
		} finally {
			setIsLoading(false)
		}
	}

	const deletePasskey = async (credentialId: string) => {
		setIsLoading(true)
		try {
			const result = await passkey.deletePasskey({
				id: credentialId,
			})

			if (result.error) {
				handleAuthError(result.error, "general")
				return
			}

			toast.success("Passkey removido com sucesso!")
			setCredentials((prev) => prev.filter((cred) => cred.id !== credentialId))
		} catch (error: unknown) {
			handleAuthError({ message: (error as Error).message || "Erro ao remover passkey" }, "general")
		} finally {
			setIsLoading(false)
		}
	}

	const handlePasswordSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (!password.trim()) {
			toast.error("Por favor, digite sua senha.")
			return
		}
		setStep("register")
	}

	if (step === "setup") {
		return (
			<Card className="w-full">
				<CardHeader className="text-center">
					<div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-blue-100">
						<Fingerprint className="size-6 text-blue-600" />
					</div>
					<CardTitle>Configurar Passkeys</CardTitle>
					<CardDescription>Use sua impressão digital, Face ID ou chave de segurança para fazer login</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="rounded-lg bg-muted p-4">
						<h4 className="font-medium mb-2">O que são Passkeys?</h4>
						<ul className="space-y-1 text-sm text-muted-foreground">
							<li>• Método de login mais seguro que senhas</li>
							<li>• Use biometria ou PIN do seu dispositivo</li>
							<li>• Funciona offline e é resistente a phishing</li>
							<li>• Suportado por navegadores modernos</li>
						</ul>
					</div>

					<div className="rounded-lg border bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
						<div className="flex items-center space-x-3">
							<Shield className="size-5 text-blue-600" />
							<div>
								<h4 className="font-medium text-blue-900">Maior Segurança</h4>
								<p className="text-sm text-blue-700">Passkeys são mais seguros que senhas e códigos SMS</p>
							</div>
						</div>
					</div>
				</CardContent>
				<CardFooter className="flex space-x-2">
					<Button variant="outline" onClick={() => onComplete?.()} className="flex-1">
						Cancelar
					</Button>
					<Button onClick={handleInitialSetup} className="flex-1">
						Configurar
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
					<CardDescription>Por favor, digite sua senha atual para adicionar uma nova passkey.</CardDescription>
				</CardHeader>
				<form onSubmit={handlePasswordSubmit}>
					<CardContent>
						<div className="space-y-2">
							<Label htmlFor="password-passkey">Senha Atual</Label>
							<div className="relative">
								<Input
									id="password-passkey"
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

	if (step === "register") {
		return (
			<Card className="w-full">
				<CardHeader className="text-center">
					<CardTitle>Registrar Passkey</CardTitle>
					<CardDescription>Dê um nome para identificar este dispositivo</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="credential-name">Nome do dispositivo</Label>
						<Input
							id="credential-name"
							type="text"
							placeholder="Ex: iPhone do João, Notebook pessoal"
							value={credentialName}
							onChange={(e) => setCredentialName(e.target.value)}
							maxLength={50}
						/>
						<p className="text-xs text-muted-foreground">
							Este nome ajuda você a identificar onde o passkey está registrado
						</p>
					</div>

					<div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
						<div className="flex items-start space-x-3">
							<Smartphone className="size-5 text-amber-600 mt-0.5" />
							<div>
								<h4 className="font-medium text-amber-900">Atenção</h4>
								<p className="text-sm text-amber-800">
									Ao clicar em "Registrar", você será solicitado a usar sua biometria, PIN ou chave de segurança.
								</p>
							</div>
						</div>
					</div>
				</CardContent>
				<CardFooter className="flex space-x-2">
					<Button variant="outline" onClick={() => setStep(isSocialAccount ? "setup" : "password")} className="flex-1">
						Voltar
					</Button>
					<Button onClick={registerPasskey} disabled={isLoading || !credentialName.trim()} className="flex-1">
						{isLoading ? (
							<>
								<Loader2 className="mr-2 size-4 animate-spin" />
								Registrando...
							</>
						) : (
							"Registrar"
						)}
					</Button>
				</CardFooter>
			</Card>
		)
	}

	if (step === "manage") {
		return (
			<Card className="w-full">
				<CardHeader className="text-center">
					<div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-green-100">
						<Fingerprint className="size-6 text-green-600" />
					</div>
					<CardTitle>Passkeys Configurados</CardTitle>
					<CardDescription>Gerencie seus passkeys registrados</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{isLoading && credentials.length === 0 ? (
						<div className="text-center py-6">
							<Loader2 className="size-8 text-muted-foreground mx-auto mb-2 animate-spin" />
						</div>
					) : credentials.length === 0 ? (
						<div className="text-center py-6">
							<Fingerprint className="size-8 text-muted-foreground mx-auto mb-2" />
							<p className="text-sm text-muted-foreground">Nenhum passkey registrado ainda</p>
						</div>
					) : (
						<div className="space-y-2">
							{credentials.map((credential) => (
								<div key={credential.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
									<div className="flex-1">
										<div className="font-medium text-sm">{credential.name}</div>
										<div className="text-xs text-muted-foreground">
											Criado em {credential.createdAt.toLocaleDateString("pt-BR")}
										</div>
									</div>
									<Button size="sm" variant="outline" onClick={() => deletePasskey(credential.id)} disabled={isLoading}>
										<Trash2 className="size-4" />
									</Button>
								</div>
							))}
						</div>
					)}

					<div className="space-y-2">
						<Button variant="outline" onClick={() => setStep("register")} className="w-full" disabled={isLoading}>
							Adicionar Novo Passkey
						</Button>
					</div>
				</CardContent>
				<CardFooter>
					<Button onClick={() => onComplete?.()} className="w-full">
						Concluir
					</Button>
				</CardFooter>
			</Card>
		)
	}

	return null
}
