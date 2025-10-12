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
import { lazy, Suspense, useState } from "react"
import { toast } from "sonner"
import {
	usePasskeys,
	useSessions,
	useLoginHistory,
	useDeletePasskey,
	useTerminateSession,
	useTerminateAllSessions,
	useDisableTwoFactor,
	useGenerateBackupCodes,
} from "@/hooks/use-security-data"
import {
	SecurityOverviewSkeleton,
	SessionsSkeleton,
	PasskeysListSkeleton,
	TwoFactorSkeleton,
} from "@/components/skeletons/security-skeleton"

// Lazy load heavy components
const BackupCodesDisplay = lazy(() =>
	import("@/components/auth/backup-codes-display").then((mod) => ({ default: mod.BackupCodesDisplay }))
)
const PasskeySetup = lazy(() =>
	import("@/components/auth/passkey-setup").then((mod) => ({ default: mod.PasskeySetup }))
)
const TwoFactorSetup = lazy(() =>
	import("@/components/auth/two-factor-setup").then((mod) => ({ default: mod.TwoFactorSetup }))
)
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { passkey, twoFactor, useSession } from "@/lib/auth-client"
import { SecurityNotifications } from "@/components/security-notifications"

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

	// 2FA Estados
	const [twoFactorTotpEnabled, setTwoFactorTotpEnabled] = useState(session?.user?.twoFactorEnabled || false)
	const [twoFactorEmailEnabled, setTwoFactorEmailEnabled] = useState(false)

	// Modal states
	const [showDisableModal, setShowDisableModal] = useState(false)
	const [showEnableModal, setShowEnableModal] = useState(false)
	const [showBackupCodesModal, setShowBackupCodesModal] = useState(false)
	const [operationPassword, setOperationPassword] = useState("")
	const [currentOperation, setCurrentOperation] = useState<"enable" | "disable" | "backup-codes" | null>(null)

	// Backup codes
	const [generatedBackupCodes, setGeneratedBackupCodes] = useState<string[]>([])
	const [showBackupCodesDisplay, setShowBackupCodesDisplay] = useState(false)

	// React Query hooks - lazy load data only when needed
	const { data: passkeys = [], isLoading: isLoadingPasskeys, refetch: refetchPasskeys } = usePasskeys()
	const {
		data: activeSessions = [],
		isLoading: isLoadingSessions,
	} = useSessions(activeTab === "sessions")
	const {
		data: loginHistory = [],
		isLoading: isLoadingHistory,
	} = useLoginHistory(activeTab === "sessions")

	// Mutations with optimistic updates
	const deletePasskeyMutation = useDeletePasskey()
	const terminateSessionMutation = useTerminateSession()
	const terminateAllSessionsMutation = useTerminateAllSessions()
	const disableTwoFactorMutation = useDisableTwoFactor()
	const generateBackupCodesMutation = useGenerateBackupCodes()

	const passkeyCount = passkeys.length

	const getDeviceIcon = (deviceType: string) => {
		const type = deviceType?.toLowerCase() || ""
		if (type.includes("mobile") || type.includes("phone")) {
			return <Phone className="h-4 w-4" />
		} else if (type.includes("desktop") || type.includes("laptop")) {
			return <Laptop className="h-4 w-4" />
		}
		return <Monitor className="h-4 w-4" />
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

	const handleToggleTotpEnabled = async (enabled: boolean) => {
		const isSocialAccount = !!session?.user?.image

		if (enabled) {
			// Para ativar 2FA, sempre pedir confirmação de senha (exceto contas sociais)
			if (!isSocialAccount) {
				setCurrentOperation("enable")
				setShowEnableModal(true)
			} else {
				// Para contas sociais, ativar diretamente
				setShowTwoFactorSetup(true)
			}
		} else {
			// Para desativar 2FA, sempre pedir confirmação
			if (!isSocialAccount) {
				setCurrentOperation("disable")
				setShowDisableModal(true)
			} else {
				// Para contas sociais, confirmar desativação
				setCurrentOperation("disable")
				setShowDisableModal(true)
			}
		}
	}

	const handleConfirmOperation = async () => {
		const isSocialAccount = !!session?.user?.image

		if (!isSocialAccount && !operationPassword.trim() && currentOperation !== "disable") {
			toast.error("Digite sua senha para continuar")
			return
		}

		try {
			if (currentOperation === "enable") {
				setShowEnableModal(false)
				setOperationPassword("")
				setShowTwoFactorSetup(true)
			} else if (currentOperation === "disable") {
				await disableTwoFactorMutation.mutateAsync(operationPassword || "")
				setTwoFactorTotpEnabled(false)
				setShowDisableModal(false)
				setOperationPassword("")
			} else if (currentOperation === "backup-codes") {
				const codes = await generateBackupCodesMutation.mutateAsync(operationPassword || "")
				setGeneratedBackupCodes(codes)
				setShowBackupCodesModal(false)
				setShowBackupCodesDisplay(true)
				setOperationPassword("")
			}
		} catch (error) {
			// Errors handled by mutations
		}
	}

	const handleCancelOperation = () => {
		setShowDisableModal(false)
		setShowEnableModal(false)
		setShowBackupCodesModal(false)
		setOperationPassword("")
		setCurrentOperation(null)
	}

	const handleToggleEmailEnabled = async (enabled: boolean) => {
		try {
			// This would call a custom API endpoint for email 2FA
			const response = await fetch("/api/auth/two-factor/email", {
				method: enabled ? "POST" : "DELETE",
				headers: { "Content-Type": "application/json" },
			})

			if (!response.ok) {
				throw new Error("Failed to toggle email 2FA")
			}

			setTwoFactorEmailEnabled(enabled)
			toast.success(`2FA via email ${enabled ? "ativado" : "desativado"}`)
		} catch (error) {
			toast.error(`Erro ao ${enabled ? "ativar" : "desativar"} 2FA via email`)
		}
	}

	const generateNewBackupCodes = async () => {
		const isSocialAccount = !!session?.user?.image

		if (!isSocialAccount) {
			setCurrentOperation("backup-codes")
			setShowBackupCodesModal(true)
		} else {
			try {
				const codes = await generateBackupCodesMutation.mutateAsync("")
				setGeneratedBackupCodes(codes)
				setShowBackupCodesDisplay(true)
			} catch (error) {
				// Error handled by mutation
			}
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

	if (showTwoFactorSetup) {
		return (
			<div className="flex items-center justify-center p-4">
				<Suspense fallback={<Loader2 className="h-8 w-8 animate-spin" />}>
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
				<Suspense fallback={<Loader2 className="h-8 w-8 animate-spin" />}>
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
				<Suspense fallback={<Loader2 className="h-8 w-8 animate-spin" />}>
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
					<div className="flex-shrink-0">
						<Shield className="h-5 w-5 text-primary" />
					</div>
					<p className="text-sm text-muted-foreground">
						Para maior segurança da sua conta, recomendamos habilitar tanto a autenticação de dois fatores quanto os
						passkeys. Essas medidas protegem sua conta contra acessos não autorizados.
					</p>
				</div>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
				<TabsList className="inline-flex h-11 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-auto">
					<TabsTrigger value="password" className="rounded-md px-4">Senha</TabsTrigger>
					<TabsTrigger value="overview" className="rounded-md px-4">Visão Geral</TabsTrigger>
					<TabsTrigger value="two-factor" className="rounded-md px-4">2FA</TabsTrigger>
					<TabsTrigger value="passkeys" className="rounded-md px-4">Passkeys</TabsTrigger>
					<TabsTrigger value="sessions" className="rounded-md px-4">Sessões</TabsTrigger>
					<TabsTrigger value="notifications" className="rounded-md px-4">
						<Bell className="h-4 w-4 mr-1" />
						Notificações
					</TabsTrigger>
				</TabsList>

				<TabsContent value="password">
					<Card className="shadow-sm">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Shield className="h-5 w-5" />
								Alterar Senha
							</CardTitle>
							<CardDescription>Altere sua senha e mantenha sua conta segura</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							{session.user?.image ? (
								<div className="p-6 bg-primary/5 rounded-lg">
									<div className="flex items-center gap-3">
										<div className="p-2 rounded-full bg-primary/10">
											<Mail className="h-5 w-5 text-primary" />
										</div>
										<div>
											<h3 className="font-semibold">Conta Google</h3>
											<p className="text-sm text-muted-foreground mt-1">
												Esta conta está conectada com o Google. Para alterar a senha, acesse as configurações da sua conta Google.
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
												{showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
												{showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
														<span className={req.regex.test(newPassword) ? "text-green-600 dark:text-green-400" : "text-gray-500"}>
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
												{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
											</Button>
										</div>
										{confirmPassword && newPassword !== confirmPassword && (
											<p className="text-xs text-red-500">As senhas não coincidem</p>
										)}
									</div>

									<Button type="submit" disabled={isChangingPassword}>
										{isChangingPassword ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Alterando...
											</>
										) : (
											<>
												<Key className="mr-2 h-4 w-4" />
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
					<div className="grid gap-6 md:grid-cols-2">
						{/* Two-Factor Authentication Card */}
						<Card className="shadow-sm">
							<CardHeader>
								<div className="flex items-center space-x-3">
									<div
										className={`p-2 rounded-full ${twoFactorTotpEnabled || twoFactorEmailEnabled ? "bg-green-500/10" : "bg-orange-100"}`}
									>
										{twoFactorTotpEnabled || twoFactorEmailEnabled ? (
											<ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
										) : (
											<Shield className="h-5 w-5 text-orange-600" />
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
									<Settings className="mr-2 h-4 w-4" />
									{twoFactorTotpEnabled || twoFactorEmailEnabled ? "Gerenciar 2FA" : "Configurar 2FA"}
								</Button>
							</CardFooter>
						</Card>

						{/* Passkeys Card */}
						<Card className="shadow-sm">
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
									<ShieldCheck className="h-4 w-4 text-green-500" />
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm">Autenticação de dois fatores</span>
									{twoFactorTotpEnabled || twoFactorEmailEnabled ? (
										<ShieldCheck className="h-4 w-4 text-green-500" />
									) : (
										<AlertTriangle className="h-4 w-4 text-orange-500" />
									)}
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm">Passkeys configurados</span>
									{passkeyCount > 0 ? (
										<ShieldCheck className="h-4 w-4 text-green-500" />
									) : (
										<AlertTriangle className="h-4 w-4 text-orange-500" />
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
						<Card className="shadow-sm">
							<CardHeader>
								<CardTitle>Autenticação de Dois Fatores (2FA)</CardTitle>
								<CardDescription>Configure e gerencie os métodos de autenticação de dois fatores</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								{/* TOTP/App Authenticator */}
								<div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border-0">
									<div className="flex items-center space-x-3">
										<div className={`p-2 rounded-full ${twoFactorTotpEnabled ? "bg-green-500/10" : "bg-gray-100"}`}>
											<Smartphone className={`h-5 w-5 ${twoFactorTotpEnabled ? "text-green-600 dark:text-green-400" : "text-gray-600"}`} />
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
									<Card className="shadow-sm">
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
													<RefreshCw className="mr-2 h-4 w-4" />
													Gerar Novos Códigos
												</Button>
											</div>
										</CardFooter>
									</Card>
								)}

								{/* Setup Instructions - Only show if no 2FA is enabled */}
								{!twoFactorTotpEnabled && !twoFactorEmailEnabled && (
									<Alert>
										<Shield className="h-4 w-4" />
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
						<Card className="shadow-sm">
							<CardHeader>
								<div className="flex items-center justify-between">
									<div>
										<CardTitle>Passkeys</CardTitle>
										<CardDescription>Gerencie seus passkeys para autenticação sem senha</CardDescription>
									</div>
									<Button onClick={() => setShowPasskeySetup(true)} size="sm">
										<Fingerprint className="h-4 w-4 mr-2" />
										Adicionar Passkey
									</Button>
								</div>
							</CardHeader>
							<CardContent>
								{passkeyCount === 0 ? (
									<div className="text-center py-8">
										<Fingerprint className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
										<h3 className="font-medium mb-2">Nenhum passkey configurado</h3>
										<p className="text-sm text-muted-foreground mb-4">
											Configure passkeys para fazer login usando biometria ou chaves de segurança
										</p>
										<Button onClick={() => setShowPasskeySetup(true)}>
											<Fingerprint className="h-4 w-4 mr-2" />
											Configurar Primeiro Passkey
										</Button>
									</div>
								) : (
									<div className="space-y-4">
										<div className="p-4 bg-primary/5 rounded-lg">
											<div className="flex items-center gap-3">
												<div className="p-2 rounded-full bg-primary/10">
													<Fingerprint className="h-5 w-5 text-primary" />
												</div>
												<div>
													<h4 className="font-semibold text-sm">
														Você tem {passkeyCount} {passkeyCount === 1 ? "passkey" : "passkeys"} configurado{passkeyCount === 1 ? "" : "s"}
													</h4>
													<p className="text-xs text-muted-foreground mt-1">
														Você pode usar biometria ou chaves de segurança para fazer login.
													</p>
												</div>
											</div>
										</div>

										<div className="space-y-3">
											{passkeys.map((passkey: any, index: number) => (
												<div key={passkey.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border-0">
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
															onClick={() => deletePasskeyMutation.mutate(passkey.id)}
															disabled={deletePasskeyMutation.isPending}
															className="text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
														>
															{deletePasskeyMutation.isPending ? (
																<>
																	<Loader2 className="h-4 w-4 animate-spin mr-1" />
																	Excluindo...
																</>
															) : (
																<>
																	<Trash2 className="h-4 w-4 mr-1" />
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
														<CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
													</div>
													<div>
														<h4 className="font-semibold text-sm">Múltiplos passkeys configurados</h4>
														<p className="text-xs text-muted-foreground mt-1">
															Você pode usar qualquer um desses passkeys para fazer login. Recomendamos manter pelo menos um passkey ativo.
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
						<Card className="shadow-sm">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Shield className="h-5 w-5" />
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
											<div key={session.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border-0">
												<div className="flex items-center space-x-3">
													<div className="p-2 rounded-full bg-primary/10">
														<Smartphone className="h-4 w-4 text-primary" />
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
														<LogOut className="h-4 w-4 mr-1" />
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
													<Loader2 className="h-4 w-4 mr-2 animate-spin" />
													Encerrando...
												</>
											) : (
												<>
													<LogOut className="h-4 w-4 mr-2" />
													Encerrar Todas as Outras
												</>
											)}
										</Button>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Login History */}
						<Card className="shadow-sm">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<History className="h-5 w-5" />
									Histórico de Login
								</CardTitle>
								<CardDescription>Últimas tentativas de acesso à sua conta</CardDescription>
							</CardHeader>
							<CardContent>
								{isLoadingHistory ? (
									<div className="space-y-3">
										{[1, 2, 3].map((i) => (
											<div key={i} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30">
												<div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
												<div className="flex-1 space-y-2">
													<div className="h-4 bg-muted rounded animate-pulse w-32" />
													<div className="h-3 bg-muted rounded animate-pulse w-48" />
													<div className="h-3 bg-muted rounded animate-pulse w-24" />
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
														<CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
													) : (
														<AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
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
					</div>
				</TabsContent>

				<TabsContent value="notifications">
					<SecurityNotifications />
				</TabsContent>
			</Tabs>

			{/* Modal for enabling 2FA */}
			<Dialog open={showEnableModal} onOpenChange={() => handleCancelOperation()}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Shield className="h-5 w-5 text-green-500" />
							Ativar 2FA via Aplicativo
						</DialogTitle>
						<DialogDescription>
							Para sua segurança, confirme sua senha antes de configurar a autenticação de dois fatores.
						</DialogDescription>
					</DialogHeader>

					{!session?.user?.image && (
						<div className="space-y-2">
							<Label htmlFor="enable-password">Digite sua senha atual</Label>
							<Input
								id="enable-password"
								type="password"
								placeholder="Sua senha atual"
								value={operationPassword}
								onChange={(e) => setOperationPassword(e.target.value)}
								disabled={disableTwoFactorMutation.isPending || generateBackupCodesMutation.isPending}
								onKeyPress={(e) => e.key === "Enter" && handleConfirmOperation()}
							/>
						</div>
					)}

					<DialogFooter className="flex space-x-2">
						<Button variant="outline" onClick={handleCancelOperation} disabled={disableTwoFactorMutation.isPending || generateBackupCodesMutation.isPending}>
							Cancelar
						</Button>
						<Button onClick={handleConfirmOperation} disabled={disableTwoFactorMutation.isPending || generateBackupCodesMutation.isPending}>
							{(disableTwoFactorMutation.isPending || generateBackupCodesMutation.isPending) ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Validando...
								</>
							) : (
								"Continuar"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Modal for disabling 2FA */}
			<Dialog open={showDisableModal} onOpenChange={() => handleCancelOperation()}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<AlertTriangle className="h-5 w-5 text-orange-500" />
							Desativar 2FA via Aplicativo
						</DialogTitle>
						<DialogDescription>
							Tem certeza que deseja desativar a autenticação de dois fatores via aplicativo? Isso tornará sua conta menos segura.
						</DialogDescription>
					</DialogHeader>

					{!session?.user?.image && (
						<div className="space-y-2">
							<Label htmlFor="disable-password">Digite sua senha para confirmar</Label>
							<Input
								id="disable-password"
								type="password"
								placeholder="Sua senha atual"
								value={operationPassword}
								onChange={(e) => setOperationPassword(e.target.value)}
								disabled={disableTwoFactorMutation.isPending || generateBackupCodesMutation.isPending}
								onKeyPress={(e) => e.key === "Enter" && handleConfirmOperation()}
							/>
						</div>
					)}

					<DialogFooter className="flex space-x-2">
						<Button variant="outline" onClick={handleCancelOperation} disabled={disableTwoFactorMutation.isPending || generateBackupCodesMutation.isPending}>
							Cancelar
						</Button>
						<Button variant="destructive" onClick={handleConfirmOperation} disabled={disableTwoFactorMutation.isPending || generateBackupCodesMutation.isPending}>
							{(disableTwoFactorMutation.isPending || generateBackupCodesMutation.isPending) ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Desativando...
								</>
							) : (
								"Desativar 2FA"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Modal for generating backup codes */}
			<Dialog open={showBackupCodesModal} onOpenChange={() => handleCancelOperation()}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<RefreshCw className="h-5 w-5 text-blue-500" />
							Gerar Novos Códigos de Backup
						</DialogTitle>
						<DialogDescription>
							Para gerar novos códigos de backup, confirme sua senha. Os códigos anteriores serão invalidados.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-2">
						<Label htmlFor="backup-password">Digite sua senha atual</Label>
						<Input
							id="backup-password"
							type="password"
							placeholder="Sua senha atual"
							value={operationPassword}
							onChange={(e) => setOperationPassword(e.target.value)}
							disabled={disableTwoFactorMutation.isPending || generateBackupCodesMutation.isPending}
							onKeyPress={(e) => e.key === "Enter" && handleConfirmOperation()}
						/>
					</div>

					<DialogFooter className="flex space-x-2">
						<Button variant="outline" onClick={handleCancelOperation} disabled={disableTwoFactorMutation.isPending || generateBackupCodesMutation.isPending}>
							Cancelar
						</Button>
						<Button onClick={handleConfirmOperation} disabled={disableTwoFactorMutation.isPending || generateBackupCodesMutation.isPending}>
							{(disableTwoFactorMutation.isPending || generateBackupCodesMutation.isPending) ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Gerando...
								</>
							) : (
								"Gerar Códigos"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
