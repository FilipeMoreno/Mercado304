"use client";

import { useEffect, useState } from "react";
import { TwoFactorSetup } from "@/components/auth/two-factor-setup";
import { PasskeySetup } from "@/components/auth/passkey-setup";
import { BackupCodesDisplay } from "@/components/auth/backup-codes-display";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { 
	Fingerprint, 
	Shield, 
	ShieldCheck, 
	AlertTriangle,
	Eye,
	EyeOff,
	Key,
	Loader2,
	Mail,
	CheckCircle,
	Smartphone,
	History,
	LogOut,
	Copy,
	Download,
	RefreshCw,
	Settings,
	Trash2,
	Calendar,
	Monitor,
	Laptop,
	Smartphone as Phone
} from "lucide-react";
import { toast } from "sonner";
import { twoFactor, passkey, useSession } from "@/lib/auth-client";
import { PasskeysSkeleton } from "@/components/skeletons/passkeys-skeleton";

interface SecurityTabProps {
	session: any;
	onUpdateSession: () => void;
}

interface LoginSession {
	id: string;
	device: string;
	location: string;
	lastAccess: Date;
	isCurrent: boolean;
	ip: string;
}

interface LoginHistory {
	id: string;
	device: string;
	location: string;
	timestamp: Date;
	success: boolean;
	ip: string;
}

export function SecurityTab({ session, onUpdateSession }: SecurityTabProps) {
	const { data: currentSession } = useSession();
	const [activeTab, setActiveTab] = useState("overview");
	const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
	const [showPasskeySetup, setShowPasskeySetup] = useState(false);
	
	// 2FA Estados
	const [twoFactorTotpEnabled, setTwoFactorTotpEnabled] = useState(false);
	const [twoFactorEmailEnabled, setTwoFactorEmailEnabled] = useState(false);
	const [isManaging2FA, setIsManaging2FA] = useState(false);
	
	// Modal states for 2FA operations
	const [showDisableModal, setShowDisableModal] = useState(false);
	const [showEnableModal, setShowEnableModal] = useState(false);
	const [showBackupCodesModal, setShowBackupCodesModal] = useState(false);
	const [operationPassword, setOperationPassword] = useState("");
	const [isProcessingOperation, setIsProcessingOperation] = useState(false);
	const [currentOperation, setCurrentOperation] = useState<'enable' | 'disable' | 'backup-codes' | null>(null);
	
	// Backup codes state
	const [generatedBackupCodes, setGeneratedBackupCodes] = useState<string[]>([]);
	const [showBackupCodesDisplay, setShowBackupCodesDisplay] = useState(false);
	
	// Passkey Estados
	const [passkeyCount, setPasskeyCount] = useState(0);
	const [passkeys, setPasskeys] = useState([]);
	const [isLoadingPasskeys, setIsLoadingPasskeys] = useState(false);
	const [isDeletingPasskey, setIsDeletingPasskey] = useState<string | null>(null);
	
	// Sessões e Histórico
	const [activeSessions, setActiveSessions] = useState<LoginSession[]>([]);
	const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
	const [isLoadingSessions, setIsLoadingSessions] = useState(false);
	const [isLoadingHistory, setIsLoadingHistory] = useState(false);

	useEffect(() => {
		// Update 2FA status from session
		setTwoFactorTotpEnabled(session?.user?.twoFactorEnabled || false);
		setTwoFactorEmailEnabled(false); // This would come from user preferences
		
		// Update passkey count
		fetchPasskeyCount();
		
		// Load sessions and history if on those tabs
		if (activeTab === "sessions") {
			fetchActiveSessions();
			fetchLoginHistory();
		}
	}, [session, activeTab]);

	const fetchPasskeyCount = async () => {
		setIsLoadingPasskeys(true);
		try {
			const result = await passkey.listUserPasskeys();
			if (result.data) {
				setPasskeyCount(result.data.length);
				setPasskeys(result.data);
			}
		} catch (error) {
			console.error("Error fetching passkeys:", error);
		} finally {
			setIsLoadingPasskeys(false);
		}
	};

	const deletePasskey = async (passkeyId: string) => {
		setIsDeletingPasskey(passkeyId);
		try {
			const result = await passkey.deletePasskey({ id: passkeyId });
			if (result.error) {
				toast.error("Erro ao excluir passkey");
				return;
			}
			
			// Atualizar lista local
			setPasskeys(prev => prev.filter((p: any) => p.id !== passkeyId));
			setPasskeyCount(prev => prev - 1);
			toast.success("Passkey excluído com sucesso");
			
			// Atualizar sessão
			onUpdateSession();
		} catch (error) {
			toast.error("Erro ao excluir passkey");
		} finally {
			setIsDeletingPasskey(null);
		}
	};

	const getDeviceIcon = (deviceType: string) => {
		const type = deviceType?.toLowerCase() || '';
		if (type.includes('mobile') || type.includes('phone')) {
			return <Phone className="h-4 w-4" />;
		} else if (type.includes('desktop') || type.includes('laptop')) {
			return <Laptop className="h-4 w-4" />;
		}
		return <Monitor className="h-4 w-4" />;
	};

	const formatDate = (dateString: string | Date) => {
		if (!dateString) return 'Data não disponível';
		const date = new Date(dateString);
		return date.toLocaleDateString('pt-BR', {
			day: '2-digit',
			month: '2-digit', 
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const fetchActiveSessions = async () => {
		setIsLoadingSessions(true);
		try {
			const response = await fetch('/api/auth/sessions');
			if (!response.ok) {
				throw new Error('Erro ao buscar sessões');
			}
			const sessions = await response.json();
			setActiveSessions(sessions);
		} catch (error) {
			console.error('Erro ao carregar sessões:', error);
			toast.error("Erro ao carregar sessões ativas");
		} finally {
			setIsLoadingSessions(false);
		}
	};

	const fetchLoginHistory = async () => {
		setIsLoadingHistory(true);
		try {
			const response = await fetch('/api/auth/login-history');
			if (!response.ok) {
				throw new Error('Erro ao buscar histórico');
			}
			const history = await response.json();
			setLoginHistory(history);
		} catch (error) {
			console.error('Erro ao carregar histórico:', error);
			toast.error("Erro ao carregar histórico de login");
		} finally {
			setIsLoadingHistory(false);
		}
	};

	const handleToggleTotpEnabled = async (enabled: boolean) => {
		const isSocialAccount = !!session?.user?.image;
		
		if (enabled) {
			// Para ativar 2FA, sempre pedir confirmação de senha (exceto contas sociais)
			if (!isSocialAccount) {
				setCurrentOperation('enable');
				setShowEnableModal(true);
			} else {
				// Para contas sociais, ativar diretamente
				setShowTwoFactorSetup(true);
			}
		} else {
			// Para desativar 2FA, sempre pedir confirmação
			if (!isSocialAccount) {
				setCurrentOperation('disable');
				setShowDisableModal(true);
			} else {
				// Para contas sociais, confirmar desativação
				setCurrentOperation('disable');
				setShowDisableModal(true);
			}
		}
	};

	const handleConfirmOperation = async () => {
		const isSocialAccount = !!session?.user?.image;
		
		// Validar senha se necessário
		if (!isSocialAccount && !operationPassword.trim() && currentOperation !== 'disable') {
			toast.error("Digite sua senha para continuar");
			return;
		}

		setIsProcessingOperation(true);
		
		try {
			if (currentOperation === 'enable') {
				// Fechar modal e abrir setup
				setShowEnableModal(false);
				setOperationPassword("");
				setShowTwoFactorSetup(true);
			} else if (currentOperation === 'disable') {
				const result = await twoFactor.disable(operationPassword ? { password: operationPassword } : {});
				if (result.error) {
					toast.error("Erro ao desativar 2FA. Verifique sua senha.");
					return;
				}
				setTwoFactorTotpEnabled(false);
				toast.success("2FA via aplicativo desativado com sucesso");
				onUpdateSession();
				setShowDisableModal(false);
				setOperationPassword("");
			} else if (currentOperation === 'backup-codes') {
				const result = await twoFactor.generateBackupCodes(operationPassword ? { password: operationPassword } : {});
				if (result.error) {
					toast.error("Erro ao gerar códigos de backup. Verifique sua senha.");
					return;
				}
				
				const codes = result.data?.codes || [];
				setGeneratedBackupCodes(codes);
				setShowBackupCodesModal(false);
				setShowBackupCodesDisplay(true);
				setOperationPassword("");
				toast.success("Novos códigos de backup gerados!");
			}
		} catch (error) {
			toast.error("Erro na operação. Tente novamente.");
		} finally {
			setIsProcessingOperation(false);
		}
	};

	const handleCancelOperation = () => {
		setShowDisableModal(false);
		setShowEnableModal(false);
		setShowBackupCodesModal(false);
		setOperationPassword("");
		setCurrentOperation(null);
		setIsProcessingOperation(false);
	};

	const handleToggleEmailEnabled = async (enabled: boolean) => {
		try {
			// This would call a custom API endpoint for email 2FA
			const response = await fetch('/api/auth/two-factor/email', {
				method: enabled ? 'POST' : 'DELETE',
				headers: { 'Content-Type': 'application/json' }
			});

			if (!response.ok) {
				throw new Error('Failed to toggle email 2FA');
			}

			setTwoFactorEmailEnabled(enabled);
			toast.success(`2FA via email ${enabled ? 'ativado' : 'desativado'}`);
		} catch (error) {
			toast.error(`Erro ao ${enabled ? 'ativar' : 'desativar'} 2FA via email`);
		}
	};

	const generateNewBackupCodes = async () => {
		const isSocialAccount = !!session?.user?.image;
		
		// Para contas locais, pedir confirmação de senha
		if (!isSocialAccount) {
			setCurrentOperation('backup-codes');
			setShowBackupCodesModal(true);
		} else {
			// Para contas sociais, gerar diretamente
			try {
				const result = await twoFactor.generateBackupCodes({password});
				if (result.error) {
					toast.error("Erro ao gerar novos códigos de backup");
					return;
				}
				
				const codes = result.data?.codes || [];
				setGeneratedBackupCodes(codes);
				setShowBackupCodesDisplay(true);
				toast.success("Novos códigos de backup gerados!");
			} catch (error) {
				toast.error("Erro ao gerar novos códigos de backup");
			}
		}
	};

	const terminateSession = async (sessionId: string) => {
		try {
			const response = await fetch('/api/auth/sessions', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ sessionId }),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Erro ao encerrar sessão');
			}

			// Atualizar lista local removendo a sessão
			setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
			toast.success("Sessão encerrada com sucesso");
		} catch (error: any) {
			console.error('Erro ao encerrar sessão:', error);
			toast.error(error.message || "Erro ao encerrar sessão");
		}
	};

	const terminateAllSessions = async () => {
		try {
			const response = await fetch('/api/auth/sessions', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ terminateAll: true }),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Erro ao encerrar sessões');
			}

			// Atualizar lista local mantendo apenas a sessão atual
			setActiveSessions(prev => prev.filter(s => s.isCurrent));
			toast.success("Todas as outras sessões foram encerradas");
		} catch (error: any) {
			console.error('Erro ao encerrar todas as sessões:', error);
			toast.error(error.message || "Erro ao encerrar todas as sessões");
		}
	};

	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showCurrentPassword, setShowCurrentPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isChangingPassword, setIsChangingPassword] = useState(false);

	const passwordRequirements = [
		{ regex: /.{8,}/, text: "Pelo menos 8 caracteres" },
		{ regex: /[A-Z]/, text: "Uma letra maiúscula" },
		{ regex: /[a-z]/, text: "Uma letra minúscula" },
		{ regex: /\d/, text: "Um número" },
		{ regex: /[^A-Za-z0-9]/, text: "Um caractere especial" },
	];

	const validatePassword = (pwd: string) => {
		return passwordRequirements.every((req) => req.regex.test(pwd));
	};

	const handleChangePassword = async (e: React.FormEvent) => {
		e.preventDefault();

		if (newPassword !== confirmPassword) {
			toast.error("As senhas não coincidem");
			return;
		}

		if (!validatePassword(newPassword)) {
			toast.error("A nova senha não atende aos requisitos de segurança");
			return;
		}

		setIsChangingPassword(true);

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
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Erro ao alterar senha");
			}

			toast.success("Senha alterada com sucesso!");
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
		} catch (error: any) {
			toast.error(error.message || "Erro ao alterar senha");
		} finally {
			setIsChangingPassword(false);
		}
	};

	if (showTwoFactorSetup) {
		return (
			<div className="flex items-center justify-center p-4">
				<TwoFactorSetup 
					onComplete={() => {
						setShowTwoFactorSetup(false);
						setTwoFactorTotpEnabled(true);
						onUpdateSession();
					}} 
				/>
			</div>
		);
	}

	if (showPasskeySetup) {
		return (
			<div className="min-h-screen flex items-center justify-center p-4">
				<PasskeySetup 
					onComplete={() => {
						setShowPasskeySetup(false);
						fetchPasskeyCount();
						onUpdateSession();
					}} 
				/>
			</div>
		);
	}

	if (showBackupCodesDisplay) {
		return (
			<div className="flex items-center justify-center p-4">
				<BackupCodesDisplay 
					codes={generatedBackupCodes}
					onComplete={() => {
						setShowBackupCodesDisplay(false);
						setGeneratedBackupCodes([]);
					}}
					title="Novos Códigos de Backup"
					description="Seus códigos de backup foram atualizados. Os códigos anteriores não funcionam mais."
				/>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<Alert>
				<Shield className="h-4 w-4" />
				<AlertDescription>
					Para maior segurança da sua conta, recomendamos habilitar tanto a autenticação de dois fatores 
					quanto os passkeys. Essas medidas protegem sua conta contra acessos não autorizados.
				</AlertDescription>
			</Alert>

			<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
				<TabsList className="grid w-full grid-cols-5">
					<TabsTrigger value="password">Senha</TabsTrigger>
					<TabsTrigger value="overview">Visão Geral</TabsTrigger>
					<TabsTrigger value="two-factor">2FA</TabsTrigger>
					<TabsTrigger value="passkeys">Passkeys</TabsTrigger>
					<TabsTrigger value="sessions">Sessões</TabsTrigger>
				</TabsList>

				<TabsContent value="password">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Shield className="h-5 w-5" />
								Alterar Senha
							</CardTitle>
							<CardDescription>
								Altere sua senha e mantenha sua conta segura
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							{session.user?.image ? (
								<div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
									<div className="flex items-center gap-2 text-blue-800 mb-2">
										<Mail className="h-4 w-4" />
										Conta Google
									</div>
									<p className="text-sm text-blue-700">
										Esta conta está conectada com o Google. Para alterar a
										senha, acesse as configurações da sua conta Google.
									</p>
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
												onClick={() =>
													setShowCurrentPassword(!showCurrentPassword)
												}
												disabled={isChangingPassword}
											>
												{showCurrentPassword ? (
													<EyeOff className="h-4 w-4" />
												) : (
													<Eye className="h-4 w-4" />
												)}
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
												{showNewPassword ? (
													<EyeOff className="h-4 w-4" />
												) : (
													<Eye className="h-4 w-4" />
												)}
											</Button>
										</div>
										{newPassword && (
											<div className="space-y-1 text-xs">
												{passwordRequirements.map((req, index) => (
													<div
														key={index}
														className="flex items-center space-x-2"
													>
														<div
															className={`w-4 h-4 rounded-full flex items-center justify-center ${
																req.regex.test(newPassword)
																	? "bg-green-500"
																	: "bg-gray-300"
															}`}
														>
															{req.regex.test(newPassword) && (
																<CheckCircle className="w-2 h-2 text-white" />
															)}
														</div>
														<span
															className={
																req.regex.test(newPassword)
																	? "text-green-600"
																	: "text-gray-500"
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
										<Label htmlFor="confirmPassword">
											Confirmar nova senha
										</Label>
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
												onClick={() =>
													setShowConfirmPassword(!showConfirmPassword)
												}
												disabled={isChangingPassword}
											>
												{showConfirmPassword ? (
													<EyeOff className="h-4 w-4" />
												) : (
													<Eye className="h-4 w-4" />
												)}
											</Button>
										</div>
										{confirmPassword && newPassword !== confirmPassword && (
											<p className="text-xs text-red-500">
												As senhas não coincidem
											</p>
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
						<Card>
							<CardHeader>
								<div className="flex items-center space-x-3">
									<div className={`p-2 rounded-full ${(twoFactorTotpEnabled || twoFactorEmailEnabled) ? 'bg-green-100' : 'bg-orange-100'}`}>
										{(twoFactorTotpEnabled || twoFactorEmailEnabled) ? (
											<ShieldCheck className="h-5 w-5 text-green-600" />
										) : (
											<Shield className="h-5 w-5 text-orange-600" />
										)}
									</div>
									<div className="flex-1">
										<CardTitle className="text-lg">Autenticação de Dois Fatores</CardTitle>
										<CardDescription>
											{(twoFactorTotpEnabled || twoFactorEmailEnabled) ? (
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
									{(twoFactorTotpEnabled || twoFactorEmailEnabled) 
										? `Sua conta está protegida com 2FA via ${twoFactorTotpEnabled ? 'aplicativo' : ''}${(twoFactorTotpEnabled && twoFactorEmailEnabled) ? ' e ' : ''}${twoFactorEmailEnabled ? 'email' : ''}.`
										: "Adicione uma camada extra de segurança à sua conta com códigos de verificação."
									}
								</p>
							</CardContent>
							<CardFooter>
								<Button
									onClick={() => setActiveTab("two-factor")}
									variant={(twoFactorTotpEnabled || twoFactorEmailEnabled) ? "outline" : "default"}
									className="w-full"
								>
									<Settings className="mr-2 h-4 w-4" />
									{(twoFactorTotpEnabled || twoFactorEmailEnabled) ? "Gerenciar 2FA" : "Configurar 2FA"}
								</Button>
							</CardFooter>
						</Card>

						{/* Passkeys Card */}
						<Card>
							<CardHeader>
								<div className="flex items-center space-x-3">
									<div className={`p-2 rounded-full ${passkeyCount > 0 ? 'bg-blue-100' : 'bg-gray-100'}`}>
										<Fingerprint className={`h-5 w-5 ${passkeyCount > 0 ? 'text-blue-600' : 'text-gray-600'}`} />
									</div>
									<div className="flex-1">
										<CardTitle className="text-lg">Passkeys</CardTitle>
										<CardDescription>
											{passkeyCount > 0 ? (
												<Badge variant="default" className="mt-1">
													{passkeyCount} {passkeyCount === 1 ? 'passkey' : 'passkeys'}
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
										: "Configure passkeys para fazer login de forma rápida e segura."
									}
								</p>
							</CardContent>
							<CardFooter>
								<Button
									onClick={() => setShowPasskeySetup(true)}
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
							<CardDescription>
								Baseado nas configurações de segurança da sua conta
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<span className="text-sm">Senha forte</span>
									<ShieldCheck className="h-4 w-4 text-green-500" />
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm">Autenticação de dois fatores</span>
									{(twoFactorTotpEnabled || twoFactorEmailEnabled) ? (
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
										const score = 1 + ((twoFactorTotpEnabled || twoFactorEmailEnabled) ? 1 : 0) + (passkeyCount > 0 ? 1 : 0);
										const percentage = (score / 3) * 100;
										
										return (
											<div>
												<div className="flex items-center justify-between mb-2">
													<span className="text-sm font-medium">Pontuação de Segurança</span>
													<span className="text-sm text-muted-foreground">{score}/3</span>
												</div>
												<div className="w-full bg-gray-200 rounded-full h-2">
													<div 
														className={`h-2 rounded-full ${
															percentage >= 100 ? 'bg-green-500' : 
															percentage >= 67 ? 'bg-yellow-500' : 
															'bg-red-500'
														}`}
														style={{ width: `${percentage}%` }}
													></div>
												</div>
												<p className="text-xs text-muted-foreground mt-2">
													{percentage >= 100 ? 'Excelente! Sua conta está muito bem protegida.' :
													 percentage >= 67 ? 'Boa! Considere adicionar mais métodos de segurança.' :
													 'Sua conta precisa de mais segurança. Configure 2FA e passkeys.'}
												</p>
											</div>
										);
									})()}
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="two-factor">
					<div className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle>Autenticação de Dois Fatores (2FA)</CardTitle>
								<CardDescription>
									Configure e gerencie os métodos de autenticação de dois fatores
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								{/* TOTP/App Authenticator */}
								<div className="flex items-center justify-between p-4 border rounded-lg">
									<div className="flex items-center space-x-3">
										<div className={`p-2 rounded-full ${twoFactorTotpEnabled ? 'bg-green-100' : 'bg-gray-100'}`}>
											<Smartphone className={`h-5 w-5 ${twoFactorTotpEnabled ? 'text-green-600' : 'text-gray-600'}`} />
										</div>
										<div className="flex-1">
											<h4 className="font-medium">Aplicativo Authenticator</h4>
											<p className="text-sm text-muted-foreground">
												Use Google Authenticator, Microsoft Authenticator ou similares
											</p>
										</div>
									</div>
									<div className="flex items-center space-x-3">
										{twoFactorTotpEnabled && (
											<Badge variant="default">Ativo</Badge>
										)}
										<Switch
											checked={twoFactorTotpEnabled}
											onCheckedChange={handleToggleTotpEnabled}
										/>
									</div>
								</div>

								{/* Email 2FA */}
								<div className="flex items-center justify-between p-4 border rounded-lg">
									<div className="flex items-center space-x-3">
										<div className={`p-2 rounded-full ${twoFactorEmailEnabled ? 'bg-blue-100' : 'bg-gray-100'}`}>
											<Mail className={`h-5 w-5 ${twoFactorEmailEnabled ? 'text-blue-600' : 'text-gray-600'}`} />
										</div>
										<div className="flex-1">
											<h4 className="font-medium">Email</h4>
											<p className="text-sm text-muted-foreground">
												Receba códigos por email
											</p>
										</div>
									</div>
									<div className="flex items-center space-x-3">
										{twoFactorEmailEnabled && (
											<Badge variant="default">Ativo</Badge>
										)}
										<Switch
											checked={twoFactorEmailEnabled}
											onCheckedChange={handleToggleEmailEnabled}
										/>
									</div>
								</div>

								<Separator />

								{/* Backup Codes - Only show if any 2FA is enabled */}
								{(twoFactorTotpEnabled || twoFactorEmailEnabled) && (
									<Card>
										<CardHeader>
											<CardTitle className="text-base">Códigos de Backup</CardTitle>
											<CardDescription>
												10 códigos de uso único para emergências
											</CardDescription>
										</CardHeader>
										<CardContent>
											<p className="text-sm text-muted-foreground mb-4">
												Use estes códigos se você não conseguir acessar seus outros métodos de 2FA.
											</p>
										</CardContent>
										<CardFooter>
											<div className="flex space-x-2">
												<Button 
													variant="outline" 
													size="sm"
													onClick={generateNewBackupCodes}
												>
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
											Para maior segurança, recomendamos ativar pelo menos um método de autenticação de dois fatores.
											O aplicativo authenticator é mais seguro que o email.
										</AlertDescription>
									</Alert>
								)}
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="passkeys">
					{isLoadingPasskeys ? (
						<PasskeysSkeleton />
					) : (
						<Card>
							<CardHeader>
								<div className="flex items-center justify-between">
									<div>
										<CardTitle>Passkeys</CardTitle>
										<CardDescription>
											Gerencie seus passkeys para autenticação sem senha
										</CardDescription>
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
									<Alert>
										<Fingerprint className="h-4 w-4" />
										<AlertDescription>
											Você tem {passkeyCount} {passkeyCount === 1 ? 'passkey' : 'passkeys'} configurado{passkeyCount === 1 ? '' : 's'}. 
											Você pode usar biometria ou chaves de segurança para fazer login.
										</AlertDescription>
									</Alert>

									<div className="space-y-3">
										{passkeys.map((passkey: any, index: number) => (
											<div key={passkey.id} className="flex items-center justify-between p-4 border rounded-lg">
												<div className="flex items-center space-x-3">
													<div className="p-2 rounded-full bg-blue-100">
														{getDeviceIcon(passkey.deviceType)}
													</div>
													<div className="flex-1">
														<div className="flex items-center space-x-2">
															<span className="font-medium">
																{passkey.name || `Passkey ${index + 1}`}
															</span>
															<Badge variant="outline" className="text-xs">
																{passkey.deviceType || 'Dispositivo'}
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
														onClick={() => deletePasskey(passkey.id)}
														disabled={isDeletingPasskey === passkey.id}
														className="text-red-600 hover:text-red-700 hover:bg-red-50"
													>
														{isDeletingPasskey === passkey.id ? (
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
										<div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
											<div className="flex items-center space-x-2 text-blue-800">
												<CheckCircle className="h-4 w-4" />
												<span className="text-sm font-medium">Múltiplos passkeys configurados</span>
											</div>
											<p className="text-xs text-blue-700 mt-1">
												Você pode usar qualquer um desses passkeys para fazer login. 
												Recomendamos manter pelo menos um passkey ativo.
											</p>
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
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Shield className="h-5 w-5" />
									Sessões Ativas
								</CardTitle>
								<CardDescription>
									Gerencie onde você está conectado
								</CardDescription>
							</CardHeader>
							<CardContent>
								{isLoadingSessions ? (
									<div className="flex items-center justify-center py-8">
										<Loader2 className="h-8 w-8 animate-spin" />
									</div>
								) : (
									<div className="space-y-3">
										{activeSessions.map((session) => (
											<div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
												<div className="flex items-center space-x-3">
													<div className="p-2 rounded-full bg-blue-100">
														<Smartphone className="h-4 w-4 text-blue-600" />
													</div>
													<div className="flex-1">
														<div className="flex items-center space-x-2">
															<span className="font-medium">{session.device}</span>
															{session.isCurrent && (
																<Badge variant="default" className="text-xs">Atual</Badge>
															)}
														</div>
														<p className="text-sm text-muted-foreground">
															{session.location} • IP: {session.ip}
														</p>
														<p className="text-xs text-muted-foreground">
															Último acesso: {session.lastAccess.toLocaleString('pt-BR')}
														</p>
													</div>
												</div>
												{!session.isCurrent && (
													<Button
														variant="outline"
														size="sm"
														onClick={() => terminateSession(session.id)}
													>
														<LogOut className="h-4 w-4 mr-1" />
														Encerrar
													</Button>
												)}
											</div>
										))}
									</div>
								)}
								
								{activeSessions.length > 1 && (
									<Separator className="my-4" />
								)}
								
								{activeSessions.some(s => !s.isCurrent) && (
									<div className="flex justify-between items-center">
										<p className="text-sm text-muted-foreground">
											{activeSessions.filter(s => !s.isCurrent).length} outras sessões ativas
										</p>
										<Button
											variant="destructive"
											size="sm"
											onClick={terminateAllSessions}
										>
											<LogOut className="h-4 w-4 mr-2" />
											Encerrar Todas as Outras
										</Button>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Login History */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<History className="h-5 w-5" />
									Histórico de Login
								</CardTitle>
								<CardDescription>
									Últimas tentativas de acesso à sua conta
								</CardDescription>
							</CardHeader>
							<CardContent>
								{isLoadingHistory ? (
									<div className="flex items-center justify-center py-8">
										<Loader2 className="h-8 w-8 animate-spin" />
									</div>
								) : (
									<div className="space-y-3">
										{loginHistory.map((entry) => (
											<div key={entry.id} className="flex items-center space-x-3 p-3 border rounded-lg">
												<div className={`p-2 rounded-full ${entry.success ? 'bg-green-100' : 'bg-red-100'}`}>
													{entry.success ? (
														<CheckCircle className="h-4 w-4 text-green-600" />
													) : (
														<AlertTriangle className="h-4 w-4 text-red-600" />
													)}
												</div>
												<div className="flex-1">
													<div className="flex items-center space-x-2">
														<span className="font-medium">{entry.device}</span>
														<Badge variant={entry.success ? "default" : "destructive"} className="text-xs">
															{entry.success ? "Sucesso" : "Falha"}
														</Badge>
													</div>
													<p className="text-sm text-muted-foreground">
														{entry.location} • IP: {entry.ip}
													</p>
													<p className="text-xs text-muted-foreground">
														{entry.timestamp.toLocaleString('pt-BR')}
													</p>
												</div>
											</div>
										))}
									</div>
								)}
							</CardContent>
						</Card>
					</div>
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
								disabled={isProcessingOperation}
								onKeyPress={(e) => e.key === 'Enter' && handleConfirmOperation()}
							/>
						</div>
					)}

					<DialogFooter className="flex space-x-2">
						<Button
							variant="outline"
							onClick={handleCancelOperation}
							disabled={isProcessingOperation}
						>
							Cancelar
						</Button>
						<Button
							onClick={handleConfirmOperation}
							disabled={isProcessingOperation}
						>
							{isProcessingOperation ? (
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
							Tem certeza que deseja desativar a autenticação de dois fatores via aplicativo? 
							Isso tornará sua conta menos segura.
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
								disabled={isProcessingOperation}
								onKeyPress={(e) => e.key === 'Enter' && handleConfirmOperation()}
							/>
						</div>
					)}

					<DialogFooter className="flex space-x-2">
						<Button
							variant="outline"
							onClick={handleCancelOperation}
							disabled={isProcessingOperation}
						>
							Cancelar
						</Button>
						<Button
							variant="destructive"
							onClick={handleConfirmOperation}
							disabled={isProcessingOperation}
						>
							{isProcessingOperation ? (
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
							Para gerar novos códigos de backup, confirme sua senha. 
							Os códigos anteriores serão invalidados.
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
							disabled={isProcessingOperation}
							onKeyPress={(e) => e.key === 'Enter' && handleConfirmOperation()}
						/>
					</div>

					<DialogFooter className="flex space-x-2">
						<Button
							variant="outline"
							onClick={handleCancelOperation}
							disabled={isProcessingOperation}
						>
							Cancelar
						</Button>
						<Button
							onClick={handleConfirmOperation}
							disabled={isProcessingOperation}
						>
							{isProcessingOperation ? (
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
	);
}