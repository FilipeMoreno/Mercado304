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
