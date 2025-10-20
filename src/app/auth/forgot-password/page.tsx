"use client"

import { Loader2, Mail, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { forgetPassword, emailOtp } from "@/lib/auth-client"

export default function ForgotPasswordPage() {
	const [email, setEmail] = useState("")
	const [isLoading, setIsLoading] = useState(false)
	const [codeSent, setCodeSent] = useState(false)
	const [otp, setOtp] = useState("")
	const [newPassword, setNewPassword] = useState("")
	const [cooldown, setCooldown] = useState(0)
	const router = useRouter()

	// Cooldown timer
	useEffect(() => {
		let timer: NodeJS.Timeout
		if (cooldown > 0) {
			timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
		}
		return () => clearTimeout(timer)
	}, [cooldown])

	const handleSendOTP = async (e?: React.FormEvent) => {
		if (e) e.preventDefault()
		if (cooldown > 0) return

		setIsLoading(true)

		try {

			// Usa o plugin emailOTP do Better Auth
			const result = await forgetPassword.emailOtp({
				email,
			})

			if (result.error) {
				throw new Error(result.error.message || "Erro ao enviar código")
			}

			toast.success("Código enviado para seu email!")
			setCodeSent(true)
			setCooldown(60) // 60 segundos de cooldown
		} catch (error: any) {
			console.error("[ForgotPassword] Error:", error)
			toast.error(error.message || "Erro ao enviar email de recuperação")
		} finally {
			setIsLoading(false)
		}
	}

	const handleResetPassword = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsLoading(true)

		try {

			// Usa a API diretamente para resetar senha com OTP
			const response = await fetch("/api/auth/reset-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email,
					otp,
					newPassword,
				}),
			})

			if (!response.ok) {
				const data = await response.json()
				throw new Error(data.error || "Código inválido ou expirado")
			}

			toast.success("Senha alterada com sucesso!")

			// Aguarda e redireciona
			await new Promise(resolve => setTimeout(resolve, 1000))
			router.push("/auth/signin")
		} catch (error: any) {
			console.error("[ForgotPassword] Error:", error)
			toast.error(error.message || "Erro ao alterar senha")
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="flex flex-col space-y-2 text-center mb-6">
			<div className="flex items-center justify-center mb-4">
				<ShoppingCart className="mr-2 size-8 text-blue-600" />
				<h1 className="text-2xl font-semibold text-blue-600">Mercado304</h1>
			</div>
			<Card>
				<CardHeader className="text-center">
					<CardTitle>Esqueceu sua senha?</CardTitle>
					<CardDescription>
						{codeSent ? "Digite o código enviado para seu email e sua nova senha." : "Digite seu email para receber um código de recuperação."}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{!codeSent ? (
						<form onSubmit={handleSendOTP} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<div className="relative">
									<Mail className="absolute left-3 top-3 size-4 text-muted-foreground" />
									<Input
										id="email"
										type="email"
										placeholder="seu@email.com"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										className="pl-9"
										required
										disabled={isLoading}
									/>
								</div>
							</div>
							<Button type="submit" className="w-full" disabled={isLoading}>
								{isLoading ? (
									<>
										<Loader2 className="mr-2 size-4 animate-spin" />
										Enviando...
									</>
								) : (
									"Enviar código de recuperação"
								)}
							</Button>
						</form>
					) : (
						<form onSubmit={handleResetPassword} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="otp">Código de 6 dígitos</Label>
								<Input
									id="otp"
									type="text"
									inputMode="numeric"
									pattern="[0-9]{6}"
									maxLength={6}
									placeholder="_ _ _ _ _ _"
									value={otp}
									onChange={(e) => setOtp(e.target.value)}
									className="text-center tracking-[0.5em]"
									required
									disabled={isLoading}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="newPassword">Nova Senha</Label>
								<Input
									id="newPassword"
									type="password"
									placeholder="Sua nova senha"
									value={newPassword}
									onChange={(e) => setNewPassword(e.target.value)}
									required
									disabled={isLoading}
								/>
							</div>
							<Button type="submit" className="w-full" disabled={isLoading || otp.length !== 6}>
								{isLoading ? (
									<>
										<Loader2 className="mr-2 size-4 animate-spin" />
										Alterando senha...
									</>
								) : (
									"Alterar Senha"
								)}
							</Button>
							<div className="flex gap-2">
								<Button
									type="button"
									variant="outline"
									className="flex-1"
									onClick={() => handleSendOTP()}
									disabled={isLoading || cooldown > 0}
								>
									{cooldown > 0 ? (
										`Reenviar em ${cooldown}s`
									) : (
										"Reenviar código"
									)}
								</Button>
								<Button
									type="button"
									variant="ghost"
									className="flex-1"
									onClick={() => {
										setCodeSent(false)
										setOtp("")
										setNewPassword("")
										setCooldown(0)
									}}
									disabled={isLoading}
								>
									Voltar
								</Button>
							</div>
						</form>
					)}
				</CardContent>
				<CardFooter>
					<p className="text-center text-sm text-muted-foreground w-full">
						Lembrou da senha?{" "}
						<Link href="/auth/signin" className="underline underline-offset-4 hover:text-primary">
							Fazer login
						</Link>
					</p>
				</CardFooter>
			</Card>
		</div>
	)
}
