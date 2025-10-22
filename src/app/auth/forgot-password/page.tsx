"use client"

import { Loader2, Mail, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
	const [email, setEmail] = useState("")
	const [isLoading, setIsLoading] = useState(false)
	const [emailSent, setEmailSent] = useState(false)
	const [cooldown, setCooldown] = useState(0)

	// Cooldown timer
	useEffect(() => {
		let timer: NodeJS.Timeout
		if (cooldown > 0) {
			timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
		}
		return () => clearTimeout(timer)
	}, [cooldown])

	const handleSendEmail = async (e?: React.FormEvent) => {
		if (e) e.preventDefault()
		if (cooldown > 0) return

		setIsLoading(true)

		try {
			// Usa a API de forgot-password
			const response = await fetch("/api/auth/forgot-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			})

			const result = await response.json()

			if (!response.ok) {
				throw new Error(result.error || "Erro ao enviar email")
			}

			toast.success("Email de recuperação enviado! Verifique sua caixa de entrada.")
			setEmailSent(true)
			setCooldown(60) // 60 segundos de cooldown
		} catch (error: any) {
			console.error("[ForgotPassword] Error:", error)
			toast.error(error.message || "Erro ao enviar email de recuperação")
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
						{emailSent
							? "Enviamos um link de recuperação para seu email. Verifique sua caixa de entrada."
							: "Digite seu email para receber um link de recuperação."}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{!emailSent ? (
						<form onSubmit={handleSendEmail} className="space-y-4">
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
									"Enviar link de recuperação"
								)}
							</Button>
						</form>
					) : (
						<div className="space-y-4">
							<div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
								<p className="text-sm text-green-800 dark:text-green-200">
									Email enviado com sucesso! Verifique sua caixa de entrada e spam.
								</p>
							</div>
							<div className="flex gap-2">
								<Button
									type="button"
									variant="outline"
									className="flex-1"
									onClick={() => handleSendEmail()}
									disabled={isLoading || cooldown > 0}
								>
									{cooldown > 0 ? `Reenviar em ${cooldown}s` : "Reenviar email"}
								</Button>
								<Button
									type="button"
									variant="ghost"
									className="flex-1"
									onClick={() => {
										setEmailSent(false)
										setCooldown(0)
									}}
									disabled={isLoading}
								>
									Voltar
								</Button>
							</div>
						</div>
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
