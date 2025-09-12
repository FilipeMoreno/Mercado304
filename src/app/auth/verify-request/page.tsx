"use client";

import { CheckCircle, Mail, Loader2, RefreshCw, ShoppingCart, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
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
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function VerifyRequestPage() {
	const { data: session, isLoading: sessionLoading } = useSession();
	const [isResending, setIsResending] = useState(false);
	const [cooldown, setCooldown] = useState(0);
	const router = useRouter();

	useEffect(() => {
		if (!sessionLoading) {
			// Se não está logado, redireciona para login
			if (!session?.user) {
				router.push('/auth/signin');
				return;
			}
			// Se email já está verificado, redireciona para dashboard
			if (session.user.emailVerified) {
				router.push('/');
				return;
			}
		}
	}, [session, sessionLoading, router]);

	// Cooldown timer
	useEffect(() => {
		let timer: NodeJS.Timeout;
		if (cooldown > 0) {
			timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
		}
		return () => clearTimeout(timer);
	}, [cooldown]);

	const handleResendEmail = async () => {
		if (cooldown > 0) return;
		
		setIsResending(true);
		try {
			const response = await fetch('/api/auth/resend-verification', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					email: session?.user?.email,
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Erro ao reenviar email');
			}

			toast.success('Email de verificação reenviado!');
			setCooldown(60); // 1 minuto de cooldown
		} catch (error: any) {
			toast.error(error.message || 'Erro ao reenviar email de verificação');
		} finally {
			setIsResending(false);
		}
	};

	const handleSignOut = async () => {
		try {
			await signOut();
			router.push('/auth/signin');
		} catch (error) {
			toast.error('Erro ao sair da conta');
		}
	};

	// Loading enquanto verifica sessão
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

	// Se não há sessão ou email já verificado, não mostra a página
	if (!session?.user || session.user.emailVerified) {
		return null;
	}

	return (
		<div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
			<div className="w-full max-w-[400px]">
				<div className="flex flex-col space-y-2 text-center mb-6">
					<div className="flex items-center justify-center mb-4">
						<ShoppingCart className="mr-2 h-8 w-8 text-blue-600" />
						<h1 className="text-2xl font-semibold text-blue-600">
							Mercado304
						</h1>
					</div>
				</div>

				<Card>
					<CardHeader className="text-center">
						<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
							<Mail className="h-6 w-6 text-blue-600" />
						</div>
						<CardTitle>Verifique seu email</CardTitle>
						<CardDescription>
							Enviamos um link de verificação para sua caixa de entrada
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<Alert>
							<CheckCircle className="h-4 w-4" />
							<AlertDescription>
								<strong>Email enviado para:</strong> {session.user.email}
							</AlertDescription>
						</Alert>

						<div className="space-y-3 text-sm text-muted-foreground">
							<p>Para completar sua conta, você precisa:</p>
							<ol className="list-decimal list-inside space-y-1 ml-4">
								<li>Verificar sua caixa de entrada</li>
								<li>Clicar no link de verificação</li>
								<li>Retornar aqui para continuar</li>
							</ol>
						</div>

						<div className="space-y-3">
							<p className="text-xs text-muted-foreground text-center">
								Não recebeu o email? Verifique sua pasta de spam ou clique abaixo para reenviar.
							</p>

							<Button
								variant="outline"
								className="w-full"
								onClick={handleResendEmail}
								disabled={isResending || cooldown > 0}
							>
								{isResending ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Reenviando...
									</>
								) : cooldown > 0 ? (
									<>
										<Clock className="mr-2 h-4 w-4" />
										Aguarde {cooldown}s para reenviar
									</>
								) : (
									<>
										<RefreshCw className="mr-2 h-4 w-4" />
										Reenviar email
									</>
								)}
							</Button>
						</div>
					</CardContent>
					<CardFooter className="flex flex-col space-y-2">
						<Button
							variant="ghost"
							onClick={handleSignOut}
							className="text-sm text-muted-foreground hover:text-foreground"
						>
							Sair e usar outra conta
						</Button>
						
						<p className="text-center text-xs text-muted-foreground">
							Problemas? Entre em contato com o{" "}
							<Link
								href="/support"
								className="underline underline-offset-4 hover:text-primary"
							>
								suporte
							</Link>
						</p>
					</CardFooter>
				</Card>
			</div>
		</div>
	);
}
