// render/src/routes/backup.ts
// Rotas de API para backup no servidor de background

import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import { listBackups } from "../lib/backup-utils"
import { addBackupJob } from "../lib/queue"
import { deleteFromR2, getSignedDownloadUrl } from "../lib/r2-client"

const router = Router()
const prisma = new PrismaClient()

// Iniciar backup
router.post("/start", async (req, res) => {
	try {
		const { backupType = "full", tables, compress = true, encrypt = true, description } = req.body

		// Validar parâmetros
		if (!["full", "incremental"].includes(backupType)) {
			return res.status(400).json({
				error: 'Tipo de backup inválido. Use "full" ou "incremental"',
			})
		}

		// Adicionar job à fila
		const job = await addBackupJob({
			backupType,
			tables,
			compress,
			encrypt,
			description: description || `Backup ${backupType} - ${new Date().toLocaleString("pt-BR")}`,
		})

		res.json({
			success: true,
			message: "Backup iniciado com sucesso",
			jobId: job.id,
			status: "enqueued",
		})
	} catch (error) {
		console.error("Erro ao iniciar backup:", error)
		res.status(500).json({
			error: "Erro ao iniciar backup",
			details: error instanceof Error ? error.message : "Erro desconhecido",
		})
	}
})

// Listar backups disponíveis
router.get("/list", async (_req, res) => {
	try {
		const result = await listBackups()

		if (!result.success) {
			return res.status(500).json({
				error: "Erro ao listar backups",
				details: result.error,
			})
		}

		res.json({
			success: true,
			backups: result.backups || [],
		})
	} catch (error) {
		console.error("Erro ao listar backups:", error)
		res.status(500).json({
			error: "Erro ao listar backups",
			details: error instanceof Error ? error.message : "Erro desconhecido",
		})
	}
})

// Gerar URL de download para backup
router.post("/download/:backupId", async (req, res) => {
	try {
		const { backupId } = req.params
		const { expiresIn = 3600 } = req.body as { expiresIn?: number } // 1 hora por padrão

		if (!backupId) {
			return res.status(400).json({
				error: "ID do backup é obrigatório",
			})
		}

		// Gerar URL assinada
		const result = await getSignedDownloadUrl(`backups/${backupId}`, expiresIn)

		if (!result.success) {
			return res.status(500).json({
				error: "Erro ao gerar URL de download",
				details: result.error,
			})
		}

		res.json({
			success: true,
			downloadUrl: result.url,
			expiresIn: expiresIn,
		})
	} catch (error) {
		console.error("Erro ao gerar URL de download:", error)
		res.status(500).json({
			error: "Erro ao gerar URL de download",
			details: error instanceof Error ? error.message : "Erro desconhecido",
		})
	}
})

// Deletar backup
router.delete("/:backupId", async (req, res) => {
	try {
		const { backupId } = req.params

		if (!backupId) {
			return res.status(400).json({
				error: "ID do backup é obrigatório",
			})
		}

		// Deletar do R2
		const result = await deleteFromR2(`backups/${backupId}`)

		if (!result.success) {
			return res.status(500).json({
				error: "Erro ao deletar backup",
				details: result.error,
			})
		}

		res.json({
			success: true,
			message: "Backup deletado com sucesso",
		})
	} catch (error) {
		console.error("Erro ao deletar backup:", error)
		res.status(500).json({
			error: "Erro ao deletar backup",
			details: error instanceof Error ? error.message : "Erro desconhecido",
		})
	}
})

// Status de backup (usando SyncJob)
router.get("/status/:jobId", async (req, res) => {
	try {
		const { jobId } = req.params

		if (!jobId) {
			return res.status(400).json({
				error: "ID do job é obrigatório",
			})
		}

		// Buscar job na tabela SyncJob
		const syncJob = await prisma.syncJob.findUnique({
			where: { id: jobId },
		})

		if (!syncJob) {
			return res.status(404).json({
				error: "Job não encontrado",
			})
		}

		res.json({
			success: true,
			job: {
				id: syncJob.id,
				status: syncJob.status,
				progresso: syncJob.progresso,
				startedAt: syncJob.startedAt,
				completedAt: syncJob.completedAt,
				logs: syncJob.logs,
				detalhes: syncJob.detalhes,
				erros: syncJob.erros,
			},
		})
	} catch (error) {
		console.error("Erro ao buscar status do backup:", error)
		res.status(500).json({
			error: "Erro ao buscar status do backup",
			details: error instanceof Error ? error.message : "Erro desconhecido",
		})
	}
})

export default router
