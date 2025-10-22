/**
 * Estado global do progresso do backup (em memória)
 * Em produção, considere usar Redis ou similar para múltiplas instâncias
 */

export type BackupProgress = {
	status: "idle" | "creating" | "uploading" | "completed" | "error"
	progress: number // 0-100
	currentStep: string
	startTime: number
	estimatedTime?: number
	error?: string
	backupInfo?: {
		fileName: string
		size: number
		sizeFormatted: string
		checksum?: string
		recordCount?: number
		validated?: boolean
	}
}

// Armazena o progresso atual do backup
export const backupProgressState: { current: BackupProgress } = {
	current: {
		status: "idle",
		progress: 0,
		currentStep: "",
		startTime: 0,
	},
}

// Função auxiliar para atualizar o progresso
export function updateBackupProgress(update: Partial<BackupProgress>) {
	backupProgressState.current = {
		...backupProgressState.current,
		...update,
	}
}

// Função auxiliar para resetar o progresso
export function resetBackupProgress() {
	backupProgressState.current = {
		status: "idle",
		progress: 0,
		currentStep: "",
		startTime: 0,
	}
}

// Função auxiliar para atualizar progresso com reset automático para estados finais
export function updateBackupProgressWithAutoReset(update: Partial<BackupProgress>, autoResetMs?: number) {
	updateBackupProgress(update)
	
	// Se o status é final (completed ou error), configurar reset automático
	if (update.status === "completed" || update.status === "error") {
		const resetDelay = autoResetMs || (update.status === "error" ? 15000 : 10000) // 15s para erro, 10s para sucesso
		setTimeout(() => {
			console.log(`[Backup] Auto-resetando estado do backup após ${update.status} (${resetDelay}ms)`)
			resetBackupProgress()
		}, resetDelay)
	}
}
