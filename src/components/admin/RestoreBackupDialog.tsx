"use client"

import { AlertTriangle, Database, Eye, EyeOff, Loader2, RotateCcw } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface RestoreBackupDialogProps {
	isOpen: boolean
	onClose: () => void
	backupKey: string
	backupFileName: string
	onRestoreSuccess: () => void
}

export function RestoreBackupDialog({
	isOpen,
	onClose,
	backupKey,
	backupFileName,
	onRestoreSuccess,
}: RestoreBackupDialogProps) {
	const [password, setPassword] = useState("")
	const [showPassword, setShowPassword] = useState(false)
	const [isRestoring, setIsRestoring] = useState(false)
	const [confirmText, setConfirmText] = useState("")

	const handleRestore = async () => {
		// Validar senha
		if (!password.trim()) {
			toast.error("Por favor, digite a senha de restauração")
			return
		}

		// Validar texto de confirmação
		if (confirmText !== "RESTAURAR") {
			toast.error('Por favor, digite "RESTAURAR" para confirmar')
			return
		}

		setIsRestoring(true)

		try {
			const response = await fetch("/api/admin/backup/restore", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					backupKey,
					password,
				}),
			})

			const data = await response.json()

			if (data.success) {
				toast.success("Backup restaurado com sucesso!")
				toast.info("Recarregando a página em 3 segundos...")
				onRestoreSuccess()

				// Recarregar a página após 3 segundos
				setTimeout(() => {
					window.location.reload()
				}, 3000)
			} else {
				toast.error(data.error || "Erro ao restaurar backup")
				console.error("[Restore] Erro:", data.error, data.details)
			}
		} catch (error) {
			console.error("Erro ao restaurar backup:", error)
			toast.error("Erro ao restaurar backup. Verifique a senha e tente novamente.")
		} finally {
			setIsRestoring(false)
		}
	}

	const handleClose = () => {
		if (!isRestoring) {
			setPassword("")
			setConfirmText("")
			setShowPassword(false)
			onClose()
		}
	}

	return (
		<AlertDialog open={isOpen} onOpenChange={handleClose}>
			<AlertDialogContent className="max-w-2xl">
				<AlertDialogHeader>
					<AlertDialogTitle className="flex items-center gap-2 text-xl">
						<Database className="h-6 w-6 text-orange-600" />
						Restaurar Backup
					</AlertDialogTitle>
					<AlertDialogDescription>
						Você está prestes a restaurar o backup: <strong>{backupFileName}</strong>
					</AlertDialogDescription>
				</AlertDialogHeader>

				<div className="space-y-4 py-4">
					{/* Aviso Importante */}
					<Alert variant="destructive">
						<AlertTriangle className="h-4 w-4" />
						<AlertTitle>⚠️ ATENÇÃO: Operação Irreversível</AlertTitle>
						<AlertDescription className="space-y-2">
							<p className="font-semibold">Esta ação irá:</p>
							<ul className="list-disc list-inside space-y-1 ml-2">
								<li>
									<strong>APAGAR TODOS OS DADOS ATUAIS</strong> do banco de dados
								</li>
								<li>Substituir por todos os dados do backup selecionado</li>
								<li>Todas as alterações feitas após o backup serão perdidas</li>
								<li>Esta operação NÃO pode ser desfeita</li>
							</ul>
						</AlertDescription>
					</Alert>

					{/* Campo de Senha */}
					<div className="space-y-2">
						<Label htmlFor="restore-password">Senha de Restauração</Label>
						<div className="relative">
							<Input
								id="restore-password"
								type={showPassword ? "text" : "password"}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Digite a senha de restauração"
								disabled={isRestoring}
								className="pr-10"
								autoComplete="off"
							/>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
								onClick={() => setShowPassword(!showPassword)}
								disabled={isRestoring}
							>
								{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
							</Button>
						</div>
						<p className="text-xs text-muted-foreground">
							A senha está configurada na variável de ambiente <code>BACKUP_RESTORE_PASSWORD</code>
						</p>
					</div>

					{/* Campo de Confirmação */}
					<div className="space-y-2">
						<Label htmlFor="confirm-text">Confirmação</Label>
						<Input
							id="confirm-text"
							type="text"
							value={confirmText}
							onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
							placeholder='Digite "RESTAURAR" para confirmar'
							disabled={isRestoring}
							className="uppercase"
							autoComplete="off"
						/>
						<p className="text-xs text-muted-foreground">Digite exatamente "RESTAURAR" para confirmar a operação</p>
					</div>

					{/* Informações do Backup */}
					<div className="bg-muted rounded-lg p-4 space-y-2">
						<h4 className="font-semibold text-sm">Informações do Backup:</h4>
						<div className="text-sm space-y-1">
							<p>
								<span className="text-muted-foreground">Arquivo:</span> <code>{backupFileName}</code>
							</p>
							<p>
								<span className="text-muted-foreground">Key:</span> <code className="text-xs">{backupKey}</code>
							</p>
						</div>
					</div>
				</div>

				<AlertDialogFooter>
					<Button variant="outline" onClick={handleClose} disabled={isRestoring}>
						Cancelar
					</Button>
					<Button
						variant="destructive"
						onClick={handleRestore}
						disabled={isRestoring || !password || confirmText !== "RESTAURAR"}
					>
						{isRestoring ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Restaurando...
							</>
						) : (
							<>
								<RotateCcw className="mr-2 h-4 w-4" />
								Restaurar Backup
							</>
						)}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
