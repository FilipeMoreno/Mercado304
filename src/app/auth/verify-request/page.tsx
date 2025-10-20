"use client"

import { CheckCircle, Clock, Loader2, Mail, RefreshCw, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { signOut, useSession } from "@/lib/auth-client"

export default function VerifyRequestPage() {
	const { data: session, isPending: sessionLoading } = useSession()
	const [isResending, setIsResending] = useState(false)
	const [cooldown, setCooldown] = useState(0)
	const router = useRouter()

	useEffect(() => {
		if (!sessionLoading) {
			// Se não está logado, redireciona para login
			if (!session?.user) {
				router.push("/auth/signin")
				return
			}
			// Se email já está verificado, redireciona para dashboard
			if (session.user.emailVerified) {
				router.push("/")
				return
			}
		}
	}, [session, sessionLoading, router])

	// Cooldown timer
	useEffect(() => {
		let timer: NodeJS.Timeout
		if (cooldown > 0) {
			timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
		}
		return () => clearTimeout(timer)
	}, [cooldown])

	const handleResendEmail = async () => {
		if (cooldown > 0) return

		setIsResending(true)
		try {
			const response = await fetch("/api/auth/resend-verification", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					email: session?.user?.email,
				}),
			})

			if (!response.ok) {
				const data = await response.json()
				throw new Error(data.error || "Erro ao reenviar email")
			}

			toast.success("Email de verificação reenviado!")
			setCooldown(60) // 1 minuto de cooldown
		} catch (error: any) {
			toast.error(error.message || "Erro ao reenviar email de verificação")
		} finally {
			setIsResending(false)
		}
	}

	const handleSignOut = async () => {
		try {
			await signOut()
			router.push("/auth/signin")
		} catch (_error) {
			toast.error("Erro ao sair da conta")
		}
	}

	// Loading enquanto verifica sessão
	if (sessionLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<Loader2 className="size-8 animate-spin mx-auto mb-4" />
					<p className="text-muted-foreground">Verificando autenticação...</p>
				</div>
			</div>
		)
	}

	// Se não há sessão ou email já verificado, não mostra a página
	if (!session?.user || session.user.emailVerified) {
		return null
	}

	return (
		<div className="flex items-center justify-center p-8 0">
			<div className="w-full">
				<div className="flex flex-col space-y-2 text-center mb-6">
					<div className="flex items-center justify-center mb-4">
						<ShoppingCart className="mr-2 size-8 text-blue-600" />
						<h1 className="text-2xl font-semibold text-blue-600">Mercado304</h1>
					</div>
				</div>

				<Card className="w-full">
					<CardHeader className="text-center">
						<div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
							<Mail className="size-6 text-orange-600 dark:text-orange-400" />
						</div>
						<CardTitle>⚠️ Verificação Obrigatória</CardTitle>
						<CardDescription>
							Você deve verificar seu email antes de acessar o sistema.
							Enviamos um link de verificação para sua caixa de entrada.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<Alert className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
							<Clock className="size-4 text-orange-600 dark:text-orange-400" />
							<AlertDescription className="text-orange-900 dark:text-orange-100">
								<strong>🔒 Acesso bloqueado</strong>
								<p className="mt-1 text-sm">
									Por segurança, você não pode acessar o sistema enquanto seu email não for verificado.
								</p>
							</AlertDescription>
						</Alert>

						<Alert className="flex items-center justify-center">
							<CheckCircle className="size-4" />
							<AlertDescription>
								<strong>Email enviado para:</strong> {session.user.email}
							</AlertDescription>
						</Alert>

						<div className="space-y-3 text-sm text-muted-foreground">
							<p>Para liberar o acesso, você precisa:</p>
							<ol className="list-decimal list-inside space-y-1 ml-4">
								<li>Verificar sua caixa de entrada (e spam)</li>
								<li>Clicar no link de verificação</li>
								<li>Seu acesso será liberado automaticamente</li>
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
										<Loader2 className="mr-2 size-4 animate-spin" />
										Reenviando...
									</>
								) : cooldown > 0 ? (
									<>
										<Clock className="mr-2 size-4" />
										Aguarde {cooldown}s para reenviar
									</>
								) : (
									<>
										<RefreshCw className="mr-2 size-4" />
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
							<Link href="/support" className="underline underline-offset-4 hover:text-primary">
								suporte
							</Link>
						</p>
					</CardFooter>
				</Card>
			</div>
		</div>
	)
}
