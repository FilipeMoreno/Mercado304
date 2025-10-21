"use client"

import {
	AlertTriangle,
	Bell,
	CheckCircle,
	Eye,
	EyeOff,
	Fingerprint,
	History,
	Key,
	Laptop,
	Loader2,
	LogOut,
	Mail,
	Monitor,
	Smartphone as Phone,
	RefreshCw,
	Settings,
	Shield,
	ShieldCheck,
	Smartphone,
	Trash2,
} from "lucide-react"
import { lazy, Suspense, useEffect, useState } from "react"
import { toast } from "sonner"
import { BiometricLockSettings } from "@/components/auth/biometric-lock-settings"
import { SecurityNotifications } from "@/components/security-notifications"
import { PasskeysListSkeleton, SessionsSkeleton } from "@/components/skeletons/security-skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useReauth } from "@/hooks/use-reauth"
import {
	useDeletePasskey,
	useDisableTwoFactor,
	useGenerateBackupCodes,
	useLoginHistory,
	usePasskeys,
	useSessions,
	useTerminateAllSessions,
	useTerminateSession,
} from "@/hooks/use-security-data"
import { useSession } from "@/lib/auth-client"

// Lazy load heavy components
const BackupCodesDisplay = lazy(() =>
	import("@/components/auth/backup-codes-display").then((mod) => ({ default: mod.BackupCodesDisplay })),
)
const PasskeySetup = lazy(() =>
	import("@/components/auth/passkey-setup").then((mod) => ({ default: mod.PasskeySetup })),
)
const TwoFactorSetup = lazy(() =>
	import("@/components/auth/two-factor-setup").then((mod) => ({ default: mod.TwoFactorSetup })),
)
const ReauthDialog = lazy(() =>
	import("@/components/auth/reauth-dialog").then((mod) => ({ default: mod.ReauthDialog })),
)
const TrustedDevices = lazy(() =>
	import("@/components/auth/trusted-devices").then((mod) => ({ default: mod.TrustedDevices })),
)

interface SecurityTabProps {
	session: any
}

interface LoginSession {
	id: string
	device: string
	location: string
	lastAccess: Date
	isCurrent: boolean
	ip: string
}

interface LoginHistory {
	id: string
	device: string
	location: string
	timestamp: Date
	success: boolean
	ip: string
}

export function SecurityTab({ session }: SecurityTabProps) {
	const { data: currentSession } = useSession()
	const [activeTab, setActiveTab] = useState("overview")
	const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false)
	const [showPasskeySetup, setShowPasskeySetup] = useState(false)

	// 2FA Estados - Inicializa da sessão para evitar flash
	const [twoFactorTotpEnabled, setTwoFactorTotpEnabled] = useState(() => session?.user?.twoFactorEnabled || false)
	const [twoFactorEmailEnabled, setTwoFactorEmailEnabled] = useState(
		() => (session?.user as any)?.twoFactorEmailEnabled || false,
	)

	// Modal states
	const [showReauthDialog, setShowReauthDialog] = useState(false)
	const [reauthOperation, setReauthOperation] = useState<{
		type:
			| "enable-2fa"
			| "disable-2fa"
			| "disable-email-2fa"
			| "generate-backup-codes"
			| "delete-passkey"
			| "change-password"
		title: string
		description: string
		passkeyId?: string
		callback: (password?: string, authToken?: string) => void
	} | null>(null)
	const [_operationPassword, _setOperationPasswordd] = useState("")
	const [_currentOperation, _setCurrentOperationn] = useState<"enable" | "disable" | "backup-codes" | null>(null)

	// Backup codes
	const [generatedBackupCodes, setGeneratedBackupCodes] = useState<string[]>([])
	const [showBackupCodesDisplay, setShowBackupCodesDisplay] = useState(false)

	// Verificação de senha e reautenticação
	const [hasPassword, setHasPassword] = useState<boolean | null>(null)
	const [_authToken, setAuthToken] = useState<string | null>(null)
	const [isProcessingReauth, setIsProcessingReauth] = useState(false)
	const [_hasProcessedReauth, setHasProcessedReauth] = useState(false)

	// React Query hooks - com placeholderData para evitar flash
	const {
		data: passkeys = [],
		isLoading: isLoadingPasskeys,
		refetch: refetchPasskeys,
		isFetching: isFetchingPasskeys,
	} = usePasskeys()
	const { data: activeSessions = [], isLoading: isLoadingSessions } = useSessions(activeTab === "sessions")
	const { data: loginHistory = [], isLoading: isLoadingHistory } = useLoginHistory(activeTab === "sessions")

	// Atualiza estados quando a sessão muda
	useEffect(() => {
		if (session?.user) {
			setTwoFactorTotpEnabled(session.user.twoFactorEnabled || false)
			setTwoFactorEmailEnabled((session.user as any)?.twoFactorEmailEnabled || false)
		}
	}, [session])

	// Mutations with optimistic updates
	const deletePasskeyMutation = useDeletePasskey()
	const terminateSessionMutation = useTerminateSession()
	const terminateAllSessionsMutation = useTerminateAllSessions()
	const disableTwoFactorMutation = useDisableTwoFactor()
	const generateBackupCodesMutation = useGenerateBackupCodes()

	// Usa loading apenas para mostrar skeleton, mantém o último valor conhecido
	const passkeyCount = passkeys.length
	const showPasskeyLoading = isLoadingPasskeys && passkeys.length === 0

	// Hook de reautenticação
	const { initiateReauth, validateReauthToken, isReauthenticating } = useReauth({
		onSuccess: async (token, operation) => {
			console.log("SecurityTab onSuccess called", { operation, hasToken: !!token, isProcessing: isProcessingReauth })

			// Previne execução duplicada (React Strict Mode em dev)
			if (isProcessingReauth) {
				console.log("Already processing reauth, skipping duplicate execution")
				return
			}

			setIsProcessingReauth(true)
			setAuthToken(token)

			// Recupera a operação pendente do sessionStorage
			const pendingOp = sessionStorage.getItem("pendingReauthOperation")
			console.log("Pending operation from storage:", pendingOp)

			if (pendingOp) {
				try {
					const { type, timestamp } = JSON.parse(pendingOp)

					// Verifica se a operação não expirou (5 minutos)
					if (Date.now() - timestamp > 5 * 60 * 1000) {
						toast.error("Operação expirou. Por favor, tente novamente.")
						sessionStorage.removeItem("pendingReauthOperation")
						setIsProcessingReauth(false)
						return
					}

					console.log("Executing operation:", type)

					// Mostra loading toast
					const loadingToast = toast.loading("Processando operação de segurança...")

					// Executa a operação baseada no tipo
					if (type === "disable-2fa") {
						console.log("Disabling 2FA (authenticator app) with token...")
						await disableTwoFactorMutation.mutateAsync(token)
						setTwoFactorTotpEnabled(false)
						toast.dismiss(loadingToast)
						toast.success("2FA via aplicativo desativado com sucesso")
						console.log("2FA (app) disabled successfully")
					} else if (type === "disable-email-2fa") {
						console.log("Disabling email 2FA with token...")
						const response = await fetch("/api/auth/two-factor/email", {
							method: "DELETE",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ authToken: token }),
						})

						if (response.ok) {
							setTwoFactorEmailEnabled(false)
							toast.dismiss(loadingToast)
							toast.success("2FA via email desativado com sucesso")
							console.log("Email 2FA disabled successfully")
						} else {
							toast.dismiss(loadingToast)
							toast.error("Erro ao desativar 2FA via email")
							console.error("Failed to disable email 2FA")
						}
					} else if (type === "enable-2fa") {
						console.log("Enabling 2FA - redirecting to setup...")
						toast.dismiss(loadingToast)
						setShowTwoFactorSetup(true)
						toast.success("Continue o setup do 2FA")
						console.log("Redirected to 2FA setup")
					} else if (type === "generate-backup-codes") {
						console.log("Generating backup codes with token...")
						const codes = await generateBackupCodesMutation.mutateAsync(token)
						setGeneratedBackupCodes(codes)
						setShowBackupCodesDisplay(true)
						toast.dismiss(loadingToast)
						toast.success("Códigos de backup gerados com sucesso")
						console.log("Backup codes generated successfully")
					} else if (type === "delete-passkey") {
						console.log("Delete passkey operation detected, executing...")

						// Recupera o passkeyId do pendingOp
						const passkeyId = JSON.parse(pendingOp).passkeyId

						if (!passkeyId) {
							console.error("No passkeyId found in pending operation")
							toast.dismiss(loadingToast)
							toast.error("Erro: ID do passkey não encontrado")
						} else {
							console.log("Deleting passkey with ID:", passkeyId)

							// Valida o token
							const validateResponse = await fetch("/api/auth/reauth/validate", {
								method: "POST",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({
									authToken: token,
									operation: "manage-passkey",
								}),
							})

							if (!validateResponse.ok) {
								toast.dismiss(loadingToast)
								toast.error("Token de reautenticação inválido")
							} else {
								await deletePasskeyMutation.mutateAsync(passkeyId)
								toast.dismiss(loadingToast)
								toast.success("Passkey excluído com sucesso")
								console.log("Passkey deleted successfully")
							}
						}
					} else {
						toast.dismiss(loadingToast)
						console.warn("Unknown operation type:", type)
						toast.error("Operação desconhecida")
					}

					// Limpa o sessionStorage
					sessionStorage.removeItem("pendingReauthOperation")
					sessionStorage.removeItem("currentReauthOperation")
					console.log("Cleared pending operation from storage")
				} catch (error) {
					console.error("Error executing pending operation:", error)
					toast.error("Erro ao executar operação. Por favor, tente novamente.")
				} finally {
					setIsProcessingReauth(false)
					// Reset após 2 segundos para permitir novas operações
					setTimeout(() => setHasProcessedReauth(false), 2000)
				}
			} else {
				console.log("No pending operation found in storage")
				setIsProcessingReauth(false)
			}
		},
		onError: (error) => {
			console.log("SecurityTab onError called", error)
			setShowReauthDialog(false)
			setReauthOperation(null)
			sessionStorage.removeItem("pendingReauthOperation")
			sessionStorage.removeItem("currentReauthOperation")
			setIsProcessingReauth(false)
			setHasProcessedReauth(false)
		},
	})

	// Estados para vincular conta Google
	const [hasGoogleAccount, setHasGoogleAccount] = useState(false)
	const [isLinkingGoogle, setIsLinkingGoogle] = useState(false)
	const [isLoadingAccountInfo, setIsLoadingAccountInfo] = useState(true)

	// Carrega todas as informações da conta em paralelo (otimizado)
	useEffect(() => {
		const loadAccountInfo = async () => {
			try {
				// Faz todas as requisições em paralelo
				const [passwordRes, googleRes] = await Promise.all([
					fetch("/api/user/has-password"),
					fetch("/api/user/has-google-account"),
				])

				const [passwordData, googleData] = await Promise.all([
					passwordRes.ok ? passwordRes.json() : { hasPassword: true },
					googleRes.ok ? googleRes.json() : { hasGoogleAccount: false },
				])

				setHasPassword(passwordData.hasPassword)
				setHasGoogleAccount(googleData.hasGoogleAccount)
			} catch (error) {
				console.error("Error loading account info:", error)
				setHasPassword(true) // Por segurança, assume que tem senha
			} finally {
				setIsLoadingAccountInfo(false)
			}
		}

		loadAccountInfo()
	}, [])

	// Processa callback de vinculação de conta Google
	useEffect(() => {
		const searchParams = new URLSearchParams(window.location.search)
		const linkSuccess = searchParams.get("link_success")
		const linkError = searchParams.get("error")
		const message = searchParams.get("message")

		if (linkSuccess) {
			toast.success(message || "Conta Google vinculada com sucesso!")
			setHasGoogleAccount(true)
			// Remove parâmetros da URL
			window.history.replaceState({}, "", "/conta/seguranca")
		} else if (linkError === "link_failed" || linkError === "link_expired") {
			toast.error(message || "Erro ao vincular conta Google")
			// Remove parâmetros da URL
			window.history.replaceState({}, "", "/conta/seguranca")
		}
	}, [])

	const getDeviceIcon = (deviceType: string) => {
		const type = deviceType?.toLowerCase() || ""
		if (type.includes("mobile") || type.includes("phone")) {
			return <Phone className="size-4" />
		} else if (type.includes("desktop") || type.includes("laptop")) {
			return <Laptop className="size-4" />
		}
		return <Monitor className="size-4" />
	}

	const formatDate = (dateString: string | Date) => {
		if (!dateString) return "Data não disponível"
		const date = new Date(dateString)
		return date.toLocaleDateString("pt-BR", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		})
	}

	// Função auxiliar para mostrar dialog de reautenticação
	const showReauthenticationDialog = (operation: typeof reauthOperation) => {
		setReauthOperation(operation)
		setShowReauthDialog(true)

		// Salva informações adicionais no sessionStorage se necessário
		if (operation?.type === "delete-passkey" && operation.passkeyId) {
			sessionStorage.setItem(
				"currentReauthOperation",
				JSON.stringify({
					type: operation.type,
					passkeyId: operation.passkeyId,
				}),
			)
		}
	}

	const handleToggleTotpEnabled = async (enabled: boolean) => {
		if (enabled) {
			// Para ativar 2FA, vai para o setup
			setShowTwoFactorSetup(true)
		} else {
			// Para desativar 2FA, pede reautenticação
			showReauthenticationDialog({
				type: "disable-2fa",
				title: "Desativar Autenticação de Dois Fatores",
				description: "Digite sua senha para desativar o 2FA e remover a camada extra de segurança.",
				callback: async (password, authToken) => {
					try {
						await disableTwoFactorMutation.mutateAsync(password || authToken || "")
						setTwoFactorTotpEnabled(false)
						setShowReauthDialog(false)
						setReauthOperation(null)
					} catch (_error) {
						// Error handled by mutation
					}
				},
			})
		}
	}

	// Removidas funções antigas handleConfirmOperation e handleCancelOperation
	// Agora usamos o ReauthDialog para todas as operações sensíveis

	const handleToggleEmailEnabled = async (enabled: boolean) => {
		if (enabled) {
			// Para ativar, pode ir direto (menos sensível)
			try {
				const response = await fetch("/api/auth/two-factor/email", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
				})

				if (!response.ok) {
					throw new Error("Failed to enable email 2FA")
				}

				setTwoFactorEmailEnabled(true)
				toast.success("2FA via email ativado")
			} catch (_error) {
				toast.error("Erro ao ativar 2FA via email")
			}
		} else {
			// Para desativar, pede reautenticação (operação sensível)
			showReauthenticationDialog({
				type: "disable-email-2fa",
				title: "Desativar 2FA via Email",
				description: "Digite sua senha para desativar a autenticação de dois fatores via email.",
				callback: async (password, authToken) => {
					try {
						const loadingToast = toast.loading("Desativando 2FA via email...")

						const response = await fetch("/api/auth/two-factor/email", {
							method: "DELETE",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								password: password || undefined,
								authToken: authToken || undefined,
							}),
						})

						toast.dismiss(loadingToast)

						if (!response.ok) {
							throw new Error("Failed to disable email 2FA")
						}

						setTwoFactorEmailEnabled(false)
						setShowReauthDialog(false)
						setReauthOperation(null)
						toast.success("2FA via email desativado")
					} catch (_error) {
						toast.error("Erro ao desativar 2FA via email")
					}
				},
			})
		}
	}

	const generateNewBackupCodes = async () => {
		showReauthenticationDialog({
			type: "generate-backup-codes",
			title: "Gerar Novos Códigos de Backup",
			description: "Digite sua senha para gerar novos códigos de backup. Os códigos antigos serão invalidados.",
			callback: async (password, authToken) => {
				try {
					const codes = await generateBackupCodesMutation.mutateAsync(password || authToken || "")
					setGeneratedBackupCodes(codes)
					setShowReauthDialog(false)
					setReauthOperation(null)
					setShowBackupCodesDisplay(true)
				} catch (_error) {
					// Error handled by mutation
				}
			},
		})
	}

	const handleDeletePasskey = (passkeyId: string, passkeyName: string) => {
		showReauthenticationDialog({
			type: "delete-passkey",
			title: "Excluir Passkey",
			description: `Digite sua senha para confirmar a exclusão do passkey "${passkeyName}". Esta ação não pode ser desfeita.`,
			passkeyId: passkeyId,
			callback: async (password, authToken) => {
				try {
					console.log("handleDeletePasskey callback called", {
						hasPassword: !!password,
						hasAuthToken: !!authToken,
						passkeyId,
					})
					const loadingToast = toast.loading("Excluindo passkey...")

					// Se tem token de reautenticação, valida primeiro
					if (authToken) {
						const validateResponse = await fetch("/api/auth/reauth/validate", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								authToken,
								operation: "manage-passkey",
							}),
						})

						if (!validateResponse.ok) {
							toast.dismiss(loadingToast)
							toast.error("Token de reautenticação inválido")
							return
						}
						console.log("handleDeletePasskey: token validated")
					}

					console.log("handleDeletePasskey: deleting passkey", passkeyId)
					await deletePasskeyMutation.mutateAsync(passkeyId)
					toast.dismiss(loadingToast)
					setShowReauthDialog(false)
					setReauthOperation(null)
					console.log("handleDeletePasskey: passkey deleted successfully")
				} catch (error) {
					console.error("handleDeletePasskey error:", error)
					toast.error("Erro ao excluir passkey")
				}
			},
		})
	}

	const handleLinkGoogleAccount = async () => {
		if (isLinkingGoogle) return

		setIsLinkingGoogle(true)
		try {
			const response = await fetch("/api/auth/link-google", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.error || "Erro ao iniciar vinculação")
			}

			const data = await response.json()

			// Redireciona para o Google OAuth
			window.location.href = data.url
		} catch (error: any) {
			console.error("Error linking Google account:", error)
			toast.error(error.message || "Erro ao vincular conta Google")
			setIsLinkingGoogle(false)
		}
	}

	const [currentPassword, setCurrentPassword] = useState("")
	const [newPassword, setNewPassword] = useState("")
	const [confirmPassword, setConfirmPassword] = useState("")
	const [showCurrentPassword, setShowCurrentPassword] = useState(false)
	const [showNewPassword, setShowNewPassword] = useState(false)
	const [showConfirmPassword, setShowConfirmPassword] = useState(false)
	const [isChangingPassword, setIsChangingPassword] = useState(false)

	const passwordRequirements = [
		{ regex: /.{8,}/, text: "Pelo menos 8 caracteres" },
		{ regex: /[A-Z]/, text: "Uma letra maiúscula" },
		{ regex: /[a-z]/, text: "Uma letra minúscula" },
		{ regex: /\d/, text: "Um número" },
		{ regex: /[^A-Za-z0-9]/, text: "Um caractere especial" },
	]

	const validatePassword = (pwd: string) => {
		return passwordRequirements.every((req) => req.regex.test(pwd))
	}

	const handleChangePassword = async (e: React.FormEvent) => {
		e.preventDefault()

		if (newPassword !== confirmPassword) {
			toast.error("As senhas não coincidem")
			return
		}

		if (!validatePassword(newPassword)) {
			toast.error("A nova senha não atende aos requisitos de segurança")
			return
		}

		setIsChangingPassword(true)

		try {
			const response = await fetch("/api/user/change-password", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					currentPassword,
					newPassword,
				}),
			})

			if (!response.ok) {
				const data = await response.json()
				throw new Error(data.error || "Erro ao alterar senha")
			}

			toast.success("Senha alterada com sucesso!")
			setCurrentPassword("")
			setNewPassword("")
			setConfirmPassword("")
		} catch (error: any) {
			toast.error(error.message || "Erro ao alterar senha")
		} finally {
			setIsChangingPassword(false)
		}
	}

	// Mostra loading enquanto processa reautenticação
	if (isProcessingReauth) {
		return (
			<div className="flex items-center justify-center p-8">
				<Card className="w-full">
					<CardContent className="pt-6">
						<div className="text-center space-y-4">
							<div className="flex justify-center">
								<div className="relative">
									<Shield className="size-16 text-blue-600 animate-pulse" />
									<Loader2 className="size-8 animate-spin text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
								</div>
							</div>
							<div>
								<h3 className="font-semibold text-lg">Processando operação de segurança</h3>
								<p className="text-sm text-muted-foreground mt-2">
									Por favor, aguarde enquanto validamos sua reautenticação e executamos a operação solicitada.
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	if (showTwoFactorSetup) {
		return (
			<div className="flex items-center justify-center p-4">
				<Suspense fallback={<Loader2 className="size-8 animate-spin" />}>
					<TwoFactorSetup
						onComplete={() => {
							setShowTwoFactorSetup(false)
							setTwoFactorTotpEnabled(true)
						}}
					/>
				</Suspense>
			</div>
		)
	}

	if (showPasskeySetup) {
		return (
			<div className="min-h-screen flex items-center justify-center p-4">
				<Suspense fallback={<Loader2 className="size-8 animate-spin" />}>
					<PasskeySetup
						onComplete={() => {
							setShowPasskeySetup(false)
							refetchPasskeys()
						}}
					/>
				</Suspense>
			</div>
		)
	}

	if (showBackupCodesDisplay) {
		return (
			<div className="flex items-center justify-center p-4">
				<Suspense fallback={<Loader2 className="size-8 animate-spin" />}>
					<BackupCodesDisplay
						codes={generatedBackupCodes}
						onComplete={() => {
							setShowBackupCodesDisplay(false)
							setGeneratedBackupCodes([])
						}}
						title="Novos Códigos de Backup"
						description="Seus códigos de backup foram atualizados. Os códigos anteriores não funcionam mais."
					/>
				</Suspense>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			{/* Alert Minimalista */}
			<div className="rounded-lg border-0 bg-primary/5 p-4">
				<div className="flex gap-3">
					<div className="shrink-0">
						<Shield className="size-5 text-primary" />
					</div>
					<p className="text-sm text-muted-foreground">
						Para maior segurança da sua conta, recomendamos habilitar tanto a autenticação de dois fatores quanto os
						passkeys. Essas medidas protegem sua conta contra acessos não autorizados.
					</p>
				</div>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
				<TabsList className="inline-flex h-11 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-auto">
					<TabsTrigger value="password" className="rounded-md px-4">
						Senha
					</TabsTrigger>
					<TabsTrigger value="overview" className="rounded-md px-4">
						Visão Geral
					</TabsTrigger>
					<TabsTrigger value="two-factor" className="rounded-md px-4">
						2FA
					</TabsTrigger>
					<TabsTrigger value="passkeys" className="rounded-md px-4">
						Passkeys
					</TabsTrigger>
					<TabsTrigger value="sessions" className="rounded-md px-4">
						Sessões
					</TabsTrigger>
					<TabsTrigger value="notifications" className="rounded-md px-4">
						<Bell className="size-4 mr-1" />
						Notificações
					</TabsTrigger>
				</TabsList>

				<TabsContent value="password">
					<Card className="shadow-xs">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Shield className="size-5" />
								Alterar Senha
							</CardTitle>
							<CardDescription>Altere sua senha e mantenha sua conta segura</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							{session.user?.image ? (
								<div className="p-6 bg-primary/5 rounded-lg">
									<div className="flex items-center gap-3">
										<div className="p-2 rounded-full bg-primary/10">
											<Mail className="size-5 text-primary" />
										</div>
										<div>
											<h3 className="font-semibold">Conta Google</h3>
											<p className="text-sm text-muted-foreground mt-1">
												Esta conta está conectada com o Google. Para alterar a senha, acesse as configurações da sua
												conta Google.
											</p>
										</div>
									</div>
								</div>
							) : (
								<form onSubmit={handleChangePassword} className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="currentPassword">Senha atual</Label>
										<div className="relative">
											<Input
												id="currentPassword"
												type={showCurrentPassword ? "text" : "password"}
												value={currentPassword}
												onChange={(e) => setCurrentPassword(e.target.value)}
												placeholder="Digite sua senha atual"
												required
												disabled={isChangingPassword}
											/>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												className="absolute right-0 top-0 h-full px-3"
												onClick={() => setShowCurrentPassword(!showCurrentPassword)}
												disabled={isChangingPassword}
											>
												{showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
											</Button>
										</div>
									</div>

									<div className="space-y-2">
										<Label htmlFor="newPassword">Nova senha</Label>
										<div className="relative">
											<Input
												id="newPassword"
												type={showNewPassword ? "text" : "password"}
												value={newPassword}
												onChange={(e) => setNewPassword(e.target.value)}
												placeholder="Digite sua nova senha"
												required
												disabled={isChangingPassword}
											/>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												className="absolute right-0 top-0 h-full px-3"
												onClick={() => setShowNewPassword(!showNewPassword)}
												disabled={isChangingPassword}
											>
												{showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
											</Button>
										</div>
										{newPassword && (
											<div className="space-y-1 text-xs">
												{passwordRequirements.map((req, index) => (
													<div key={index} className="flex items-center space-x-2">
														<div
															className={`w-4 h-4 rounded-full flex items-center justify-center ${
																req.regex.test(newPassword) ? "bg-green-500" : "bg-gray-300"
															}`}
														>
															{req.regex.test(newPassword) && <CheckCircle className="w-2 h-2 text-white" />}
														</div>
														<span
															className={
																req.regex.test(newPassword) ? "text-green-600 dark:text-green-400" : "text-gray-500"
															}
														>
															{req.text}
														</span>
													</div>
												))}
											</div>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="confirmPassword">Confirmar nova senha</Label>
										<div className="relative">
											<Input
												id="confirmPassword"
												type={showConfirmPassword ? "text" : "password"}
												value={confirmPassword}
												onChange={(e) => setConfirmPassword(e.target.value)}
												placeholder="Confirme sua nova senha"
												required
												disabled={isChangingPassword}
											/>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												className="absolute right-0 top-0 h-full px-3"
												onClick={() => setShowConfirmPassword(!showConfirmPassword)}
												disabled={isChangingPassword}
											>
												{showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
											</Button>
										</div>
										{confirmPassword && newPassword !== confirmPassword && (
											<p className="text-xs text-red-500">As senhas não coincidem</p>
										)}
									</div>

									<Button type="submit" disabled={isChangingPassword}>
										{isChangingPassword ? (
											<>
												<Loader2 className="mr-2 size-4 animate-spin" />
												Alterando...
											</>
										) : (
											<>
												<Key className="mr-2 size-4" />
												Alterar Senha
											</>
										)}
									</Button>
								</form>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="overview">
					{isLoadingAccountInfo || showPasskeyLoading ? (
						<div className="grid gap-6 md:grid-cols-2">
							{/* Skeleton Cards */}
							{[1, 2, 3].map((i) => (
								<Card key={i} className="shadow-xs">
									<CardHeader>
										<div className="flex items-center space-x-3">
											<div className="h-9 w-9 bg-muted rounded-full animate-pulse"></div>
											<div className="flex-1 space-y-2">
												<div className="h-5 bg-muted rounded-sm w-2/3 animate-pulse"></div>
												<div className="h-4 bg-muted rounded-sm w-1/3 animate-pulse"></div>
											</div>
										</div>
									</CardHeader>
									<CardContent>
										<div className="h-4 bg-muted rounded-sm w-full animate-pulse"></div>
									</CardContent>
									<CardFooter>
										<div className="h-10 bg-muted rounded-sm w-full animate-pulse"></div>
									</CardFooter>
								</Card>
							))}
						</div>
					) : (
						<div className="grid gap-6 md:grid-cols-2">
							{/* Two-Factor Authentication Card */}
							<Card className="shadow-xs">
								<CardHeader>
									<div className="flex items-center space-x-3">
										<div
											className={`p-2 rounded-full ${twoFactorTotpEnabled || twoFactorEmailEnabled ? "bg-green-500/10" : "bg-orange-100"}`}
										>
											{twoFactorTotpEnabled || twoFactorEmailEnabled ? (
												<ShieldCheck className="size-5 text-green-600 dark:text-green-400" />
											) : (
												<Shield className="size-5 text-orange-600" />
											)}
										</div>
										<div className="flex-1">
											<CardTitle className="text-lg">Autenticação de Dois Fatores</CardTitle>
											<CardDescription>
												{twoFactorTotpEnabled || twoFactorEmailEnabled ? (
													<div className="flex flex-wrap gap-1 mt-1">
														{twoFactorTotpEnabled && <Badge variant="default">App</Badge>}
														{twoFactorEmailEnabled && <Badge variant="default">Email</Badge>}
													</div>
												) : (
													<Badge variant="secondary" className="mt-1">
														Inativo
													</Badge>
												)}
											</CardDescription>
										</div>
									</div>
								</CardHeader>
								<CardContent>
									<p className="text-sm text-muted-foreground">
										{twoFactorTotpEnabled || twoFactorEmailEnabled
											? `Sua conta está protegida com 2FA via ${twoFactorTotpEnabled ? "aplicativo" : ""}${twoFactorTotpEnabled && twoFactorEmailEnabled ? " e " : ""}${twoFactorEmailEnabled ? "email" : ""}.`
											: "Adicione uma camada extra de segurança à sua conta com códigos de verificação."}
									</p>
								</CardContent>
								<CardFooter>
									<Button
										onClick={() => setActiveTab("two-factor")}
										variant={twoFactorTotpEnabled || twoFactorEmailEnabled ? "outline" : "default"}
										className="w-full"
									>
										<Settings className="mr-2 size-4" />
										{twoFactorTotpEnabled || twoFactorEmailEnabled ? "Gerenciar 2FA" : "Configurar 2FA"}
									</Button>
								</CardFooter>
							</Card>

							{/* Vincular Conta Google Card - só aparece se o usuário tem senha e não tem Google */}
							{!isLoadingAccountInfo && hasPassword && !hasGoogleAccount && (
								<Card className="shadow-xs border-dashed">
									<CardHeader>
										<div className="flex items-center space-x-3">
											<div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20">
												<svg className="size-5" viewBox="0 0 24 24">
													<path
														fill="#4285F4"
														d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
													/>
													<path
														fill="#34A853"
														d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
													/>
													<path
														fill="#FBBC05"
														d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
													/>
													<path
														fill="#EA4335"
														d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
													/>
												</svg>
											</div>
											<div className="flex-1">
												<CardTitle className="text-lg">Vincular com Google</CardTitle>
												<CardDescription>
													<Badge variant="secondary" className="mt-1">
														Não vinculado
													</Badge>
												</CardDescription>
											</div>
										</div>
									</CardHeader>
									<CardContent>
										<p className="text-sm text-muted-foreground">
											Conecte sua conta Google para fazer login mais facilmente e ter uma camada extra de recuperação.
										</p>
									</CardContent>
									<CardFooter>
										<Button
											onClick={handleLinkGoogleAccount}
											disabled={isLinkingGoogle}
											variant="default"
											className="w-full"
										>
											{isLinkingGoogle ? (
												<>
													<Loader2 className="mr-2 size-4 animate-spin" />
													Conectando...
												</>
											) : (
												<>
													<svg className="mr-2 size-4" viewBox="0 0 24 24">
														<path
															fill="currentColor"
															d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
														/>
														<path
															fill="currentColor"
															d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
														/>
														<path
															fill="currentColor"
															d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
														/>
														<path
															fill="currentColor"
															d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
														/>
													</svg>
													Vincular com Google
												</>
											)}
										</Button>
									</CardFooter>
								</Card>
							)}

							{/* Passkeys Card */}
							<Card className="shadow-xs">
								<CardHeader>
									<div className="flex items-center space-x-3">
										<div className={`p-2 rounded-full ${passkeyCount > 0 ? "bg-primary/10" : "bg-gray-100"}`}>
											<Fingerprint className={`h-5 w-5 ${passkeyCount > 0 ? "text-primary" : "text-gray-600"}`} />
										</div>
										<div className="flex-1">
											<CardTitle className="text-lg">Passkeys</CardTitle>
											<CardDescription>
												{passkeyCount > 0 ? (
													<Badge variant="default" className="mt-1">
														{passkeyCount} {passkeyCount === 1 ? "passkey" : "passkeys"}
													</Badge>
												) : (
													<Badge variant="secondary" className="mt-1">
														Nenhum passkey
													</Badge>
												)}
											</CardDescription>
										</div>
									</div>
								</CardHeader>
								<CardContent>
									<p className="text-sm text-muted-foreground">
										{passkeyCount > 0
											? "Você pode fazer login usando biometria ou chaves de segurança."
											: "Configure passkeys para fazer login de forma rápida e segura."}
									</p>
								</CardContent>
								<CardFooter>
									<Button
										onClick={() => {
											if (passkeyCount > 0) {
												setActiveTab("passkeys")
											} else {
												setShowPasskeySetup(true)
											}
										}}
										variant={passkeyCount > 0 ? "outline" : "default"}
										className="w-full"
									>
										{passkeyCount > 0 ? "Gerenciar Passkeys" : "Configurar Passkeys"}
									</Button>
								</CardFooter>
							</Card>
						</div>
					)}

					{/* Biometric Lock Settings */}
					<BiometricLockSettings />

					{/* Security Score */}
					<Card className="mt-6">
						<CardHeader>
							<CardTitle>Nível de Segurança</CardTitle>
							<CardDescription>Baseado nas configurações de segurança da sua conta</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<span className="text-sm">Senha forte</span>
									<ShieldCheck className="size-4 text-green-500" />
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm">Autenticação de dois fatores</span>
									{twoFactorTotpEnabled || twoFactorEmailEnabled ? (
										<ShieldCheck className="size-4 text-green-500" />
									) : (
										<AlertTriangle className="size-4 text-orange-500" />
									)}
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm">Passkeys configurados</span>
									{passkeyCount > 0 ? (
										<ShieldCheck className="size-4 text-green-500" />
									) : (
										<AlertTriangle className="size-4 text-orange-500" />
									)}
								</div>

								<div className="pt-4 border-t">
									{(() => {
										const score =
											1 + (twoFactorTotpEnabled || twoFactorEmailEnabled ? 1 : 0) + (passkeyCount > 0 ? 1 : 0)
										const percentage = (score / 3) * 100

										return (
											<div>
												<div className="flex items-center justify-between mb-2">
													<span className="text-sm font-medium">Pontuação de Segurança</span>
													<span className="text-sm text-muted-foreground">{score}/3</span>
												</div>
												<div className="w-full bg-gray-200 rounded-full h-2">
													<div
														className={`h-2 rounded-full ${
															percentage >= 100 ? "bg-green-500" : percentage >= 67 ? "bg-yellow-500" : "bg-red-500"
														}`}
														style={{ width: `${percentage}%` }}
													></div>
												</div>
												<p className="text-xs text-muted-foreground mt-2">
													{percentage >= 100
														? "Excelente! Sua conta está muito bem protegida."
														: percentage >= 67
															? "Boa! Considere adicionar mais métodos de segurança."
															: "Sua conta precisa de mais segurança. Configure 2FA e passkeys."}
												</p>
											</div>
										)
									})()}
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="two-factor">
					<div className="space-y-6">
						<Card className="shadow-xs">
							<CardHeader>
								<CardTitle>Autenticação de Dois Fatores (2FA)</CardTitle>
								<CardDescription>Configure e gerencie os métodos de autenticação de dois fatores</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								{/* TOTP/App Authenticator */}
								<div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border-0">
									<div className="flex items-center space-x-3">
										<div className={`p-2 rounded-full ${twoFactorTotpEnabled ? "bg-green-500/10" : "bg-gray-100"}`}>
											<Smartphone
												className={`h-5 w-5 ${twoFactorTotpEnabled ? "text-green-600 dark:text-green-400" : "text-gray-600"}`}
											/>
										</div>
										<div className="flex-1">
											<h4 className="font-medium">Aplicativo Authenticator</h4>
											<p className="text-sm text-muted-foreground">
												Use Google Authenticator, Microsoft Authenticator ou similares
											</p>
										</div>
									</div>
									<div className="flex items-center space-x-3">
										{twoFactorTotpEnabled && <Badge variant="default">Ativo</Badge>}
										<Switch checked={twoFactorTotpEnabled} onCheckedChange={handleToggleTotpEnabled} />
									</div>
								</div>

								{/* Email 2FA */}
								<div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border-0">
									<div className="flex items-center space-x-3">
										<div className={`p-2 rounded-full ${twoFactorEmailEnabled ? "bg-primary/10" : "bg-gray-100"}`}>
											<Mail className={`h-5 w-5 ${twoFactorEmailEnabled ? "text-primary" : "text-gray-600"}`} />
										</div>
										<div className="flex-1">
											<h4 className="font-medium">Email</h4>
											<p className="text-sm text-muted-foreground">Receba códigos por email</p>
										</div>
									</div>
									<div className="flex items-center space-x-3">
										{twoFactorEmailEnabled && <Badge variant="default">Ativo</Badge>}
										<Switch checked={twoFactorEmailEnabled} onCheckedChange={handleToggleEmailEnabled} />
									</div>
								</div>

								<Separator />

								{/* Backup Codes - Only show if any 2FA is enabled */}
								{(twoFactorTotpEnabled || twoFactorEmailEnabled) && (
									<Card className="shadow-xs">
										<CardHeader>
											<CardTitle className="text-base">Códigos de Backup</CardTitle>
											<CardDescription>10 códigos de uso único para emergências</CardDescription>
										</CardHeader>
										<CardContent>
											<p className="text-sm text-muted-foreground mb-4">
												Use estes códigos se você não conseguir acessar seus outros métodos de 2FA.
											</p>
										</CardContent>
										<CardFooter>
											<div className="flex space-x-2">
												<Button variant="outline" size="sm" onClick={generateNewBackupCodes}>
													<RefreshCw className="mr-2 size-4" />
													Gerar Novos Códigos
												</Button>
											</div>
										</CardFooter>
									</Card>
								)}

								{/* Setup Instructions - Only show if no 2FA is enabled */}
								{!twoFactorTotpEnabled && !twoFactorEmailEnabled && (
									<Alert>
										<Shield className="size-4" />
										<AlertDescription>
											Para maior segurança, recomendamos ativar pelo menos um método de autenticação de dois fatores. O
											aplicativo authenticator é mais seguro que o email.
										</AlertDescription>
									</Alert>
								)}
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="passkeys">
					{isLoadingPasskeys ? (
						<PasskeysListSkeleton />
					) : (
						<Card className="shadow-xs">
							<CardHeader>
								<div className="flex items-center justify-between">
									<div>
										<CardTitle>Passkeys</CardTitle>
										<CardDescription>Gerencie seus passkeys para autenticação sem senha</CardDescription>
									</div>
									<Button onClick={() => setShowPasskeySetup(true)} size="sm">
										<Fingerprint className="size-4 mr-2" />
										Adicionar Passkey
									</Button>
								</div>
							</CardHeader>
							<CardContent>
								{passkeyCount === 0 ? (
									<div className="text-center py-8">
										<Fingerprint className="size-12 text-muted-foreground mx-auto mb-4" />
										<h3 className="font-medium mb-2">Nenhum passkey configurado</h3>
										<p className="text-sm text-muted-foreground mb-4">
											Configure passkeys para fazer login usando biometria ou chaves de segurança
										</p>
										<Button onClick={() => setShowPasskeySetup(true)}>
											<Fingerprint className="size-4 mr-2" />
											Configurar Primeiro Passkey
										</Button>
									</div>
								) : (
									<div className="space-y-4">
										<div className="p-4 bg-primary/5 rounded-lg">
											<div className="flex items-center gap-3">
												<div className="p-2 rounded-full bg-primary/10">
													<Fingerprint className="size-5 text-primary" />
												</div>
												<div>
													<h4 className="font-semibold text-sm">
														Você tem {passkeyCount} {passkeyCount === 1 ? "passkey" : "passkeys"} configurado
														{passkeyCount === 1 ? "" : "s"}
													</h4>
													<p className="text-xs text-muted-foreground mt-1">
														Você pode usar biometria ou chaves de segurança para fazer login.
													</p>
												</div>
											</div>
										</div>

										<div className="space-y-3">
											{passkeys.map((passkey: any, index: number) => (
												<div
													key={passkey.id}
													className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border-0"
												>
													<div className="flex items-center space-x-3">
														<div className="p-2 rounded-full bg-primary/10">{getDeviceIcon(passkey.deviceType)}</div>
														<div className="flex-1">
															<div className="flex items-center space-x-2">
																<span className="font-medium">{passkey.name || `Passkey ${index + 1}`}</span>
																<Badge variant="outline" className="text-xs">
																	{passkey.deviceType || "Dispositivo"}
																</Badge>
															</div>
															<p className="text-sm text-muted-foreground">
																Criado em: {formatDate(passkey.createdAt)}
															</p>
															<div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
																<span>Contador: {passkey.counter || 0}</span>
																{passkey.backedUp && (
																	<Badge variant="secondary" className="text-xs">
																		<CheckCircle className="h-3 w-3 mr-1" />
																		Backup
																	</Badge>
																)}
															</div>
														</div>
													</div>
													<div className="flex items-center space-x-2">
														<Button
															variant="outline"
															size="sm"
															onClick={() => handleDeletePasskey(passkey.id, passkey.name || "Passkey")}
															disabled={deletePasskeyMutation.isPending}
															className="text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
														>
															{deletePasskeyMutation.isPending ? (
																<>
																	<Loader2 className="size-4 animate-spin mr-1" />
																	Excluindo...
																</>
															) : (
																<>
																	<Trash2 className="size-4 mr-1" />
																	Excluir
																</>
															)}
														</Button>
													</div>
												</div>
											))}
										</div>

										{passkeyCount > 1 && (
											<div className="mt-4 p-4 bg-green-500/5 rounded-lg">
												<div className="flex items-center gap-3">
													<div className="p-2 rounded-full bg-green-500/10">
														<CheckCircle className="size-5 text-green-600 dark:text-green-400" />
													</div>
													<div>
														<h4 className="font-semibold text-sm">Múltiplos passkeys configurados</h4>
														<p className="text-xs text-muted-foreground mt-1">
															Você pode usar qualquer um desses passkeys para fazer login. Recomendamos manter pelo
															menos um passkey ativo.
														</p>
													</div>
												</div>
											</div>
										)}
									</div>
								)}
							</CardContent>
						</Card>
					)}
				</TabsContent>

				<TabsContent value="sessions">
					<div className="space-y-6">
						{/* Active Sessions */}
						<Card className="shadow-xs">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Shield className="size-5" />
									Sessões Ativas
								</CardTitle>
								<CardDescription>Gerencie onde você está conectado</CardDescription>
							</CardHeader>
							<CardContent>
								{isLoadingSessions ? (
									<SessionsSkeleton />
								) : (
									<div className="space-y-3">
										{activeSessions.map((session) => (
											<div
												key={session.id}
												className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border-0"
											>
												<div className="flex items-center space-x-3">
													<div className="p-2 rounded-full bg-primary/10">
														<Smartphone className="size-4 text-primary" />
													</div>
													<div className="flex-1">
														<div className="flex items-center space-x-2">
															<span className="font-medium">{session.device}</span>
															{session.isCurrent && (
																<Badge variant="default" className="text-xs">
																	Atual
																</Badge>
															)}
														</div>
														<p className="text-sm text-muted-foreground">
															{session.location} • IP: {session.ip}
														</p>
														<p className="text-xs text-muted-foreground">
															Último acesso: {session.lastAccess.toLocaleString("pt-BR")}
														</p>
													</div>
												</div>
												{!session.isCurrent && (
													<Button
														variant="outline"
														size="sm"
														onClick={() => terminateSessionMutation.mutate(session.id)}
														disabled={terminateSessionMutation.isPending}
													>
														<LogOut className="size-4 mr-1" />
														Encerrar
													</Button>
												)}
											</div>
										))}
									</div>
								)}

								{activeSessions.length > 1 && <Separator className="my-4" />}

								{activeSessions.some((s) => !s.isCurrent) && (
									<div className="flex justify-between items-center">
										<p className="text-sm text-muted-foreground">
											{activeSessions.filter((s) => !s.isCurrent).length} outras sessões ativas
										</p>
										<Button
											variant="destructive"
											size="sm"
											onClick={() => terminateAllSessionsMutation.mutate()}
											disabled={terminateAllSessionsMutation.isPending}
										>
											{terminateAllSessionsMutation.isPending ? (
												<>
													<Loader2 className="size-4 mr-2 animate-spin" />
													Encerrando...
												</>
											) : (
												<>
													<LogOut className="size-4 mr-2" />
													Encerrar Todas as Outras
												</>
											)}
										</Button>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Login History */}
						<Card className="shadow-xs">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<History className="size-5" />
									Histórico de Login
								</CardTitle>
								<CardDescription>Últimas tentativas de acesso à sua conta</CardDescription>
							</CardHeader>
							<CardContent>
								{isLoadingHistory ? (
									<div className="space-y-3">
										{[1, 2, 3].map((i) => (
											<div key={i} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30">
												<div className="size-10 rounded-full bg-muted animate-pulse" />
												<div className="flex-1 space-y-2">
													<div className="h-4 bg-muted rounded-sm animate-pulse w-32" />
													<div className="h-3 bg-muted rounded-sm animate-pulse w-48" />
													<div className="h-3 bg-muted rounded-sm animate-pulse w-24" />
												</div>
											</div>
										))}
									</div>
								) : (
									<div className="space-y-3">
										{loginHistory.map((entry) => (
											<div key={entry.id} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30 border-0">
												<div className={`p-2 rounded-full ${entry.success ? "bg-green-500/10" : "bg-red-500/10"}`}>
													{entry.success ? (
														<CheckCircle className="size-4 text-green-600 dark:text-green-400" />
													) : (
														<AlertTriangle className="size-4 text-red-600 dark:text-red-400" />
													)}
												</div>
												<div className="flex-1">
													<div className="flex items-center space-x-2">
														<span className="font-medium">{entry.device}</span>
														<Badge variant={entry.success ? "default" : "destructive"} className="text-xs">
															{entry.success ? "Sucesso" : "Falha"}
														</Badge>
														<Badge variant="outline" className="text-xs">
															{entry.loginMethod}
														</Badge>
													</div>
													<p className="text-sm text-muted-foreground">
														{entry.location} • IP: {entry.ip}
													</p>
													<p className="text-xs text-muted-foreground">{entry.timestamp.toLocaleString("pt-BR")}</p>
												</div>
											</div>
										))}
									</div>
								)}
							</CardContent>
						</Card>

						{/* Trusted Devices */}
						<Suspense
							fallback={
								<div className="space-y-4">
									{[1, 2, 3].map((i) => (
										<div key={i} className="flex items-start justify-between p-4 border rounded-lg">
											<div className="flex items-start gap-3 flex-1">
												<div className="size-5 mt-1 rounded-sm bg-muted animate-pulse" />
												<div className="flex-1 space-y-2">
													<div className="h-4 bg-muted rounded-sm animate-pulse w-48" />
													<div className="h-3 bg-muted rounded-sm animate-pulse w-32" />
													<div className="h-3 bg-muted rounded-sm animate-pulse w-40" />
													<div className="h-3 bg-muted rounded-sm animate-pulse w-36" />
												</div>
											</div>
											<div className="size-8 rounded-sm bg-muted animate-pulse" />
										</div>
									))}
								</div>
							}
						>
							<TrustedDevices />
						</Suspense>
					</div>
				</TabsContent>

				<TabsContent value="notifications">
					<SecurityNotifications />
				</TabsContent>
			</Tabs>

			{/* Dialog de Reautenticação para Operações Sensíveis */}
			{reauthOperation && (
				<Suspense fallback={null}>
					<ReauthDialog
						open={showReauthDialog}
						onOpenChange={setShowReauthDialog}
						onConfirm={(password, authToken) => {
							if (reauthOperation) {
								reauthOperation.callback(password, authToken)
							}
						}}
						title={reauthOperation.title}
						description={reauthOperation.description}
						hasPassword={hasPassword ?? true}
						isLoading={disableTwoFactorMutation.isPending || generateBackupCodesMutation.isPending}
					/>
				</Suspense>
			)}
		</div>
	)
}
