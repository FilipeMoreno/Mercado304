"use client";

import { Eye, EyeOff, Fingerprint, Loader2, Lock, Mail, Shield, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, twoFactor, passkey, oneTap, useSession } from "@/lib/auth-client";
import { handleAuthError, showAuthSuccess } from "@/lib/auth-errors";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function SignInPage() {
	const { data: session, isPending: sessionLoading } = useSession();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [twoFactorCode, setTwoFactorCode] = useState("");
	const [showTwoFactor, setShowTwoFactor] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isGoogleLoading, setIsGoogleLoading] = useState(false);
	const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
	const [lastLoginMethod, setLastLoginMethod] = useState<string | null>(null);
	const [showEmailForm, setShowEmailForm] = useState(false);
	const router = useRouter();

	useEffect(() => {
		if (!sessionLoading && session?.user) {
			// Se usuário está logado mas email não verificado, redireciona para verificação
			if (!session.user.emailVerified) {
				router.push('/auth/verify-request');
				return;
			}
			// Se usuário está logado e email verificado, redireciona para dashboard
			router.push('/');
		}
	}, [session, sessionLoading, router]);

	// Recupera o último método de login do localStorage
	useEffect(() => {
		const storedLastLoginMethod = localStorage.getItem('lastLoginMethod');
		if (storedLastLoginMethod) {
			setLastLoginMethod(storedLastLoginMethod);
			// Se o último método foi email, mostra o formulário automaticamente
			if (storedLastLoginMethod === 'email') {
				setShowEmailForm(true);
			}
		}
	}, []);


	oneTap({
		fetchOptions: {
			onSuccess: () => {
				showAuthSuccess('signin');
				router.push("/");
			},
			onError: (error: any) => {
				handleAuthError({ message: "Erro no login com Google One Tap" }, 'signin');
			}
		}
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			const result = await signIn.email({
				email,
				password,
			});

			if (result.error) {
				// Check if two-factor is required
				if (result.error.message?.includes('two factor') || result.error.code === 'TWO_FACTOR_REQUIRED') {
					setShowTwoFactor(true);
					toast.error("Digite o código de dois fatores para continuar");
					return;
				}
				handleAuthError(result.error, 'signin');
				return;
			}

			// Salva o método de login usado
			localStorage.setItem('lastLoginMethod', 'email');
			setLastLoginMethod('email');

			showAuthSuccess('signin');
			// Verificar se email está verificado antes de redirecionar
			if (result.data?.user && !result.data.user.emailVerified) {
				router.push('/auth/verify-request');
			} else {
				router.push("/");
			}
		} catch (error: any) {
			handleAuthError({ message: error.message || "Erro ao fazer login" }, 'signin');
		} finally {
			setIsLoading(false);
		}
	};

	const handleGoogleSignIn = async () => {
		setIsGoogleLoading(true);
		try {
			const result = await signIn.social({
				provider: "google",
				callbackURL: "/",
			});
			
			if (result?.error) {
				handleAuthError(result.error, 'signin');
			} else {
				// Salva o método de login usado
				localStorage.setItem('lastLoginMethod', 'google');
				setLastLoginMethod('google');
			}
		} catch (error: any) {
			handleAuthError({ message: error.message || "Erro ao fazer login com Google" }, 'signin');
		} finally {
			setIsGoogleLoading(false);
		}
	};

	const handlePasskeySignIn = async () => {
		setIsPasskeyLoading(true);
		try {
			// Tenta login com passkey usando autoFill para detecção automática
			const result = await signIn.passkey({
				autoFill: true,
			});
			
			if (result?.error) {
				// Se falhar sem email, pode tentar com fallback para email se necessário
				if (result.error.message?.includes('email') && email) {
					const fallbackResult = await signIn.passkey({ email });
					if (fallbackResult?.error) {
						handleAuthError(fallbackResult.error, 'signin');
						return;
					}
				} else {
					handleAuthError(result.error, 'signin');
					return;
				}
			}

			// Salva o método de login usado
			localStorage.setItem('lastLoginMethod', 'passkey');
			setLastLoginMethod('passkey');

			showAuthSuccess('signin');
			// Verificar se email está verificado antes de redirecionar
			if (result.data?.user && !result.data.user.emailVerified) {
				router.push('/auth/verify-request');
			} else {
				router.push("/");
			}
		} catch (error: any) {
			handleAuthError({ message: error.message || "Erro ao fazer login com passkey" }, 'signin');
		} finally {
			setIsPasskeyLoading(false);
		}
	};

	const handleTwoFactorVerification = async () => {
		if (!twoFactorCode.trim()) {
			toast.error("Digite o código de dois fatores");
			return;
		}

		setIsLoading(true);
		try {
			const result = await twoFactor.verifyTotp({
				code: twoFactorCode,
			});

			if (result.error) {
				handleAuthError(result.error, 'signin');
				return;
			}

			showAuthSuccess('signin');
			// Verificar se email está verificado antes de redirecionar
			if (result.data?.user && !result.data.user.emailVerified) {
				router.push('/auth/verify-request');
			} else {
				router.push("/");
			}
		} catch (error: any) {
			handleAuthError({ message: error.message || "Erro ao verificar código 2FA" }, 'signin');
		} finally {
			setIsLoading(false);
		}
	};

	// Mostra loading enquanto verifica a sessão
	if (sessionLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
					<p className="text-muted-foreground">Verificando autenticação...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col space-y-2 text-center mb-6">
			<div className="flex items-center justify-center mb-4">
				<ShoppingCart className="mr-2 h-8 w-8 text-blue-600" />
				<h1 className="text-2xl font-semibold text-blue-600">
					Mercado304
				</h1>
			</div>
					<Card>
						<CardHeader>
							<CardTitle>Acesse sua conta</CardTitle>
							<CardDescription>
								Digite suas credenciais abaixo para acessar o sistema
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* Mostra métodos de login apenas quando o formulário não está visível */}
							{!showEmailForm && (
								<>
									{/* Mostra o último método de login usado primeiro */}
									{lastLoginMethod && (
										<div className="space-y-2">
											{lastLoginMethod === 'passkey' && (
												<div className="relative">
													<Button
														className="w-full bg-blue-600 hover:bg-blue-700"
														onClick={handlePasskeySignIn}
														disabled={isPasskeyLoading || isLoading}
													>
														{isPasskeyLoading ? (
															<Loader2 className="mr-2 h-4 w-4 animate-spin" />
														) : (
															<Fingerprint className="mr-2 h-4 w-4" />
														)}
														Login com Passkey
													</Button>
													<Badge 
														variant="secondary" 
														className="absolute -top-2 -right-1 text-[10px] px-1.5 py-0.5 bg-blue-500 text-white border-0 shadow-sm"
													>
														Usado por último
													</Badge>
												</div>
											)}
											{lastLoginMethod === 'google' && (
												<div className="relative">
													<Button
														variant="outline"
														className="w-full"
														onClick={handleGoogleSignIn}
														disabled={isGoogleLoading || isLoading}
													>
														{isGoogleLoading ? (
															<Loader2 className="mr-2 h-4 w-4 animate-spin" />
														) : (
															<svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
																<path
																	d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
																	fill="#4285F4"
																/>
																<path
																	d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
																	fill="#34A853"
																/>
																<path
																	d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
																	fill="#FBBC05"
																/>
																<path
																	d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
																	fill="#EA4335"
																/>
															</svg>
														)}
														Continuar com Google
													</Button>
													<Badge 
														variant="secondary" 
														className="absolute -top-2 -right-1 text-[10px] px-1.5 py-0.5 bg-blue-500 text-white border-0 shadow-sm"
													>
														Usado por último
													</Badge>
												</div>
											)}
											{lastLoginMethod === 'email' && (
												<div className="relative">
													<Button
														variant="outline"
														className="w-full"
														onClick={() => setShowEmailForm(true)}
													>
														<Mail className="mr-2 h-4 w-4" />
														Email e Senha
													</Button>
													<Badge 
														variant="secondary" 
														className="absolute -top-2 -right-1 text-[10px] px-1.5 py-0.5 bg-blue-500 text-white border-0 shadow-sm"
													>
														Usado por último
													</Badge>
												</div>
											)}
										</div>
									)}

									{/* Botões para outros métodos de login */}
									{(!lastLoginMethod || lastLoginMethod !== 'passkey') && (
										<Button
											className="w-full bg-blue-600 hover:bg-blue-700"
											onClick={handlePasskeySignIn}
											disabled={isPasskeyLoading || isLoading}
										>
											{isPasskeyLoading ? (
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											) : (
												<Fingerprint className="mr-2 h-4 w-4" />
											)}
											Login com Passkey
										</Button>
									)}

									{(!lastLoginMethod || lastLoginMethod !== 'google') && (
										<Button
											variant="outline"
											className="w-full"
											onClick={handleGoogleSignIn}
											disabled={isGoogleLoading || isLoading}
										>
											{isGoogleLoading ? (
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											) : (
												<svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
													<path
														d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
														fill="#4285F4"
													/>
													<path
														d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
														fill="#34A853"
													/>
													<path
														d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
														fill="#FBBC05"
													/>
													<path
														d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
														fill="#EA4335"
													/>
												</svg>
											)}
											Continuar com Google
										</Button>
									)}

									{/* Botão Email e Senha quando não é o último método */}
									{(!lastLoginMethod || lastLoginMethod !== 'email') && (
										<Button
											variant="outline"
											className="w-full"
											onClick={() => setShowEmailForm(true)}
										>
											<Mail className="mr-2 h-4 w-4" />
											Email e Senha
										</Button>
									)}
								</>
							)}

							{/* Formulário de Email e Senha - aparece apenas quando necessário */}
							{showEmailForm && (
								<>
									<form onSubmit={handleSubmit} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="email">Email</Label>
									<div className="relative">
										<Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
										<Input
											id="email"
											type="email"
											placeholder="seu@email.com"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											className="pl-9"
											required
											disabled={isLoading}
											autoComplete="webauthn"
										/>
									</div>
								</div>

								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<Label htmlFor="password">Senha</Label>
										<Link
											href="/auth/forgot-password"
											className="text-sm font-medium text-primary hover:underline"
										>
											Esqueceu a senha?
										</Link>
									</div>
									<div className="relative">
										<Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
										<Input
											id="password"
											type={showPassword ? "text" : "password"}
											placeholder="Sua senha"
											value={password}
											onChange={(e) => setPassword(e.target.value)}
											className="pl-9 pr-9"
											required
											disabled={isLoading}
										/>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
											onClick={() => setShowPassword(!showPassword)}
											disabled={isLoading}
										>
											{showPassword ? (
												<EyeOff className="h-4 w-4" />
											) : (
												<Eye className="h-4 w-4" />
											)}
										</Button>
									</div>
								</div>

								{showTwoFactor && (
									<div className="space-y-2">
										<div className="flex items-center space-x-2">
											<Shield className="h-4 w-4 text-blue-600" />
											<Label htmlFor="twoFactorCode">Código de dois fatores</Label>
										</div>
										<Input
											id="twoFactorCode"
											type="text"
											placeholder="Digite o código de 6 dígitos"
											value={twoFactorCode}
											onChange={(e) => setTwoFactorCode(e.target.value)}
											maxLength={6}
											className="text-center font-mono"
											required
											disabled={isLoading}
										/>
									</div>
								)}

								<Button 
									type="submit" 
									className="w-full" 
									disabled={isLoading}
									onClick={showTwoFactor ? handleTwoFactorVerification : undefined}
								>
									{isLoading ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											{showTwoFactor ? "Verificando..." : "Entrando..."}
										</>
									) : (
										showTwoFactor ? "Verificar Código" : "Entrar"
									)}
								</Button>
									</form>

									{/* Botão para voltar */}
									<Button
										type="button"
										variant="ghost"
										className="w-full text-sm text-muted-foreground"
										onClick={() => setShowEmailForm(false)}
									>
										← Voltar aos métodos de login
									</Button>
								</>
							)}
						</CardContent>
						<CardFooter>
							<p className="text-center text-sm text-muted-foreground w-full">
								Não tem uma conta?{" "}
								<Link
									href="/auth/signup"
									className="underline underline-offset-4 hover:text-primary"
								>
									Criar conta
								</Link>
							</p>
						</CardFooter>
					</Card>
		</div>
	);
}
