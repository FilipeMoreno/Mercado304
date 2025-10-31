// render/src/routes/rds-snapshots.ts
// Rotas para gerenciar snapshots RDS

import { Router } from "express"
import { createRDSBackupManager } from "../lib/rds-backup"

const router = Router()

/**
 * GET /api/rds/snapshots/list
 * Lista todos os snapshots RDS
 */
router.get("/list", async (req, res) => {
	try {
		const rdsBackupManager = createRDSBackupManager()

		if (!rdsBackupManager) {
			return res.status(500).json({
				success: false,
				error: "RDS Backup não configurado",
				details: "Configure as variáveis AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY e RDS_DB_INSTANCE_ID",
			})
		}

		const snapshots = await rdsBackupManager.listSnapshots()

		return res.json({
			success: true,
			snapshots: snapshots.map((snap) => ({
				identifier: snap.snapshotIdentifier,
				dbInstance: snap.dbInstanceIdentifier,
				createdAt: snap.createdAt,
				status: snap.status,
				size: snap.allocatedStorage,
				engine: snap.engine,
				engineVersion: snap.engineVersion,
				progress: snap.progress,
			})),
			total: snapshots.length,
		})
	} catch (error) {
		console.error("[RDS Snapshots] Erro ao listar:", error)
		return res.status(500).json({
			success: false,
			error: "Erro ao listar snapshots RDS",
			details: error instanceof Error ? error.message : String(error),
		})
	}
})

/**
 * GET /api/rds/snapshots/stats
 * Obtém estatísticas dos snapshots
 */
router.get("/stats", async (req, res) => {
	try {
		const rdsBackupManager = createRDSBackupManager()

		if (!rdsBackupManager) {
			return res.status(500).json({
				success: false,
				error: "RDS Backup não configurado",
			})
		}

		const stats = await rdsBackupManager.getBackupStats()

		return res.json({
			success: true,
			stats: {
				totalSnapshots: stats.totalSnapshots,
				totalSizeGB: stats.totalSizeGB,
				oldestSnapshot: stats.oldestSnapshot,
				newestSnapshot: stats.newestSnapshot,
				availableSnapshots: stats.availableSnapshots,
				creatingSnapshots: stats.creatingSnapshots,
			},
		})
	} catch (error) {
		console.error("[RDS Snapshots] Erro ao buscar estatísticas:", error)
		return res.status(500).json({
			success: false,
			error: "Erro ao buscar estatísticas",
			details: error instanceof Error ? error.message : String(error),
		})
	}
})

/**
 * POST /api/rds/snapshots/create
 * Cria um novo snapshot manual
 */
router.post("/create", async (req, res) => {
	try {
		const { tags } = req.body || {}

		const rdsBackupManager = createRDSBackupManager()

		if (!rdsBackupManager) {
			return res.status(500).json({
				success: false,
				error: "RDS Backup não configurado",
			})
		}

		console.log("[RDS Snapshots] Criando snapshot manual...")

		const snapshot = await rdsBackupManager.createSnapshot(tags)

		console.log(`[RDS Snapshots] Snapshot criado: ${snapshot.snapshotIdentifier}`)

		return res.json({
			success: true,
			snapshot: {
				identifier: snapshot.snapshotIdentifier,
				dbInstance: snapshot.dbInstanceIdentifier,
				createdAt: snapshot.createdAt,
				status: snapshot.status,
				size: snapshot.allocatedStorage,
			},
		})
	} catch (error) {
		console.error("[RDS Snapshots] Erro ao criar snapshot:", error)
		return res.status(500).json({
			success: false,
			error: "Erro ao criar snapshot",
			details: error instanceof Error ? error.message : String(error),
		})
	}
})

/**
 * DELETE /api/rds/snapshots/:identifier
 * Deleta um snapshot específico
 */
router.delete("/:identifier", async (req, res) => {
	try {
		const { identifier } = req.params

		if (!identifier) {
			return res.status(400).json({
				success: false,
				error: "Identificador do snapshot não fornecido",
			})
		}

		const rdsBackupManager = createRDSBackupManager()

		if (!rdsBackupManager) {
			return res.status(500).json({
				success: false,
				error: "RDS Backup não configurado",
			})
		}

		console.log(`[RDS Snapshots] Deletando snapshot: ${identifier}`)

		await rdsBackupManager.deleteSnapshot(identifier)

		console.log(`[RDS Snapshots] Snapshot deletado: ${identifier}`)

		return res.json({
			success: true,
			message: "Snapshot deletado com sucesso",
		})
	} catch (error) {
		console.error("[RDS Snapshots] Erro ao deletar snapshot:", error)
		return res.status(500).json({
			success: false,
			error: "Erro ao deletar snapshot",
			details: error instanceof Error ? error.message : String(error),
		})
	}
})

/**
 * POST /api/rds/snapshots/cleanup
 * Limpa snapshots antigos
 */
router.post("/cleanup", async (req, res) => {
	try {
		const rdsBackupManager = createRDSBackupManager()

		if (!rdsBackupManager) {
			return res.status(500).json({
				success: false,
				error: "RDS Backup não configurado",
			})
		}

		console.log("[RDS Snapshots] Limpando snapshots antigos...")

		const deletedCount = await rdsBackupManager.cleanupOldSnapshots()

		console.log(`[RDS Snapshots] ${deletedCount} snapshots deletados`)

		return res.json({
			success: true,
			deletedCount,
			message: `${deletedCount} snapshot(s) deletado(s)`,
		})
	} catch (error) {
		console.error("[RDS Snapshots] Erro ao limpar snapshots:", error)
		return res.status(500).json({
			success: false,
			error: "Erro ao limpar snapshots antigos",
			details: error instanceof Error ? error.message : String(error),
		})
	}
})

/**
 * GET /api/rds/snapshots/:identifier
 * Obtém informações detalhadas de um snapshot
 */
router.get("/:identifier", async (req, res) => {
	try {
		const { identifier } = req.params

		if (!identifier) {
			return res.status(400).json({
				success: false,
				error: "Identificador do snapshot não fornecido",
			})
		}

		const rdsBackupManager = createRDSBackupManager()

		if (!rdsBackupManager) {
			return res.status(500).json({
				success: false,
				error: "RDS Backup não configurado",
			})
		}

		const snapshot = await rdsBackupManager.getSnapshot(identifier)

		if (!snapshot) {
			return res.status(404).json({
				success: false,
				error: "Snapshot não encontrado",
			})
		}

		return res.json({
			success: true,
			snapshot: {
				identifier: snapshot.snapshotIdentifier,
				dbInstance: snapshot.dbInstanceIdentifier,
				createdAt: snapshot.createdAt,
				status: snapshot.status,
				size: snapshot.allocatedStorage,
				engine: snapshot.engine,
				engineVersion: snapshot.engineVersion,
				progress: snapshot.progress,
			},
		})
	} catch (error) {
		console.error("[RDS Snapshots] Erro ao buscar snapshot:", error)
		return res.status(500).json({
			success: false,
			error: "Erro ao buscar informações do snapshot",
			details: error instanceof Error ? error.message : String(error),
		})
	}
})

export default router

