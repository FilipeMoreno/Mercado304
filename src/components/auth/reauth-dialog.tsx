"use client"

import { AlertCircle, Eye, EyeOff, Loader2, Lock, Shield } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
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

interface ReauthDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	onConfirm: (password?: string, authToken?: string) => void
	title: string
	description: string
	hasPassword: boolean
	isLoading?: boolean
}

export function ReauthDialog({
	open,
	onOpenChange,
	onConfirm,
	title,
	description,
	hasPassword,
	isLoading = false,
}: ReauthDialogProps) {
	const [password, setPassword] = useState("")
	const [showPassword, setShowPassword] = useState(false)
	const [isReauthenticating, setIsReauthenticating] = useState(false)

	const handleGoogleReauth = async () => {
		setIsReauthenticating(true)
		try {
			// Determina a operação baseada no título
			// IMPORTANTE: Verificar coisas específicas ANTES de genéricas
			let operation = "disable-2fa"
			let operationType = "disable-2fa"

			if (title.toLowerCase().includes("email") && title.toLowerCase().includes("desativar")) {
				// Desativar 2FA via Email
				operation = "disable-email-2fa"
				operationType = "disable-email-2fa"
			} else if (title.toLowerCase().includes("desativar")) {
				// Desativar 2FA via Aplicativo
				operation = "disable-2fa"
				operationType = "disable-2fa"
			} else if (title.toLowerCase().includes("ativar")) {
				operation = "enable-2fa"
				operationType = "enable-2fa"
			} else if (title.toLowerCase().includes("backup") || title.toLowerCase().includes("códigos")) {
				operation = "generate-backup-codes"
				operationType = "generate-backup-codes"
			} else if (title.toLowerCase().includes("passkey")) {
				operation = "manage-passkey"
				operationType = "delete-passkey"
			} else if (title.toLowerCase().includes("senha")) {
				operation = "change-password"
				operationType = "change-password"
			}

			console.log("ReauthDialog: Determined operation", { title, operation, operationType })

			// Salva a operação pendente no sessionStorage ANTES de redirecionar
			// Inclui dados adicionais como passkeyId se necessário
			const pendingOperation: any = {
				type: operationType,
				timestamp: Date.now(),
			}

			// Se é operação de deletar passkey, salva o ID também
			if (operationType === "delete-passkey") {
				// Recupera do props (passado pelo SecurityTab)
				const currentOp = JSON.parse(sessionStorage.getItem("currentReauthOperation") || "{}")
				if (currentOp.passkeyId) {
					pendingOperation.passkeyId = currentOp.passkeyId
				}
			}

			sessionStorage.setItem("pendingReauthOperation", JSON.stringify(pendingOperation))

			const response = await fetch("/api/auth/reauth/google", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ operation }),
			})

			if (!response.ok) {
				sessionStorage.removeItem("pendingReauthOperation")
				throw new Error("Erro ao iniciar reautenticação")
			}

			const { reauthUrl } = await response.json()

			// Redireciona para o Google
			window.location.href = reauthUrl
		} catch (error: any) {
			console.error("Error initiating reauth:", error)
			setIsReauthenticating(false)
			toast.error(error.message || "Erro ao iniciar reautenticação")
		}
	}

	const handleConfirm = () => {
		if (hasPassword) {
			onConfirm(password)
		} else {
			handleGoogleReauth()
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<div className="flex items-center gap-3">
						<div className="p-2 rounded-full bg-blue-100 dark:bg-blue-950">
							<Shield className="size-5 text-blue-600 dark:text-blue-400" />
						</div>
						<div>
							<DialogTitle>{title}</DialogTitle>
							<DialogDescription className="mt-1">{description}</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<div className="space-y-4 py-4">
					{!hasPassword ? (
						<Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
							<Shield className="size-4 text-blue-600 dark:text-blue-400" />
							<AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
								<strong>Conta OAuth detectada:</strong> Para sua segurança, você precisará reautenticar com o Google
								para realizar esta operação.
							</AlertDescription>
						</Alert>
					) : (
						<div className="space-y-2">
							<Label htmlFor="password">Senha Atual</Label>
							<div className="relative">
								<Lock className="absolute left-3 top-3 size-4 text-muted-foreground" />
								<Input
									id="password"
									type={showPassword ? "text" : "password"}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="Digite sua senha"
									className="pl-9 pr-9"
									disabled={isLoading}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											handleConfirm()
										}
									}}
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
					)}

					{!hasPassword && (
						<Alert>
							<AlertCircle className="size-4" />
							<AlertDescription className="text-xs">
								Você será redirecionado para o Google. Após autenticar, retornará automaticamente para completar a
								operação.
							</AlertDescription>
						</Alert>
					)}
				</div>

				<DialogFooter className="flex-col sm:flex-row gap-2">
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading || isReauthenticating}>
						Cancelar
					</Button>
					<Button
						onClick={handleConfirm}
						disabled={isLoading || isReauthenticating || (hasPassword && !password.trim())}
					>
						{isLoading || isReauthenticating ? (
							<>
								<Loader2 className="mr-2 size-4 animate-spin" />
								{isReauthenticating ? "Redirecionando..." : "Processando..."}
							</>
						) : hasPassword ? (
							"Confirmar"
						) : (
							<>
								<Shield className="mr-2 size-4" />
								Reautenticar com Google
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
