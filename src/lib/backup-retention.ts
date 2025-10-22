/**
 * Sistema de retenção automática de backups
 * Gerencia limpeza automática de backups antigos baseado em políticas configuráveis
 */

import { DeleteObjectCommand, ListObjectsV2Command, type S3Client } from "@aws-sdk/client-s3"

export interface RetentionPolicy {
	// Manter backups diários pelos últimos X dias
	dailyRetentionDays: number
	// Manter backups semanais pelas últimas X semanas
	weeklyRetentionWeeks: number
	// Manter backups mensais pelos últimos X meses
	monthlyRetentionMonths: number
	// Tamanho máximo total dos backups (em bytes)
	maxTotalSize?: number
	// Número máximo de backups a manter
	maxBackupCount?: number
}

export interface BackupInfo {
	key: string
	fileName: string
	lastModified: Date
	size: number
	isManual: boolean
}

// Política padrão de retenção
export const DEFAULT_RETENTION_POLICY: RetentionPolicy = {
	dailyRetentionDays: 7, // 1 semana de backups diários
	weeklyRetentionWeeks: 4, // 1 mês de backups semanais
	monthlyRetentionMonths: 6, // 6 meses de backups mensais
	maxTotalSize: 5 * 1024 * 1024 * 1024, // 5GB máximo
	maxBackupCount: 50, // Máximo 50 backups
}

/**
 * Aplica política de retenção aos backups
 */
export async function applyRetentionPolicy(
	s3Client: S3Client,
	bucketName: string,
	policy: RetentionPolicy = DEFAULT_RETENTION_POLICY,
): Promise<{
	deleted: string[]
	kept: string[]
	totalSizeBefore: number
	totalSizeAfter: number
	errors: string[]
}> {
	const result = {
		deleted: [] as string[],
		kept: [] as string[],
		totalSizeBefore: 0,
		totalSizeAfter: 0,
		errors: [] as string[],
	}

	try {
		// Listar todos os backups
		const backups = await listAllBackups(s3Client, bucketName)

		result.totalSizeBefore = backups.reduce((sum, backup) => sum + backup.size, 0)

		// Classificar backups por data (mais recente primeiro)
		backups.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())

		// Determinar quais backups manter
		const toKeep = determineBackupsToKeep(backups, policy)
		const toDelete = backups.filter((backup) => !toKeep.includes(backup))

		console.log(`[Retention] Total backups: ${backups.length}`)
		console.log(`[Retention] To keep: ${toKeep.length}`)
		console.log(`[Retention] To delete: ${toDelete.length}`)

		// Deletar backups antigos
		for (const backup of toDelete) {
			try {
				await deleteBackup(s3Client, bucketName, backup.key)
				result.deleted.push(backup.fileName)
				console.log(`[Retention] Deleted: ${backup.fileName}`)
			} catch (error) {
				const errorMsg = `Failed to delete ${backup.fileName}: ${error instanceof Error ? error.message : "Unknown error"}`
				result.errors.push(errorMsg)
				console.error(`[Retention] ${errorMsg}`)
			}
		}

		// Atualizar informações dos backups mantidos
		result.kept = toKeep.map((backup) => backup.fileName)
		result.totalSizeAfter = toKeep.reduce((sum, backup) => sum + backup.size, 0)

		return result
	} catch (error) {
		const errorMsg = `Error applying retention policy: ${error instanceof Error ? error.message : "Unknown error"}`
		result.errors.push(errorMsg)
		console.error(`[Retention] ${errorMsg}`)
		return result
	}
}

/**
 * Lista todos os backups no bucket
 */
async function listAllBackups(s3Client: S3Client, bucketName: string): Promise<BackupInfo[]> {
	const backups: BackupInfo[] = []
	let continuationToken: string | undefined

	do {
		const command = new ListObjectsV2Command({
			Bucket: bucketName,
			Prefix: "backups/",
			ContinuationToken: continuationToken,
		})

		const response = await s3Client.send(command)

		if (response.Contents) {
			for (const object of response.Contents) {
				if (object.Key && object.Key.endsWith(".sql") && object.LastModified) {
					// Extrair metadados do nome do arquivo
					const fileName = object.Key.replace("backups/", "")
					const isManual = fileName.includes("manual") || object.Key.includes("manual")

					backups.push({
						key: object.Key,
						fileName,
						lastModified: object.LastModified,
						size: object.Size || 0,
						isManual,
					})
				}
			}
		}

		continuationToken = response.NextContinuationToken
	} while (continuationToken)

	return backups
}

/**
 * Determina quais backups manter baseado na política de retenção
 */
function determineBackupsToKeep(backups: BackupInfo[], policy: RetentionPolicy): BackupInfo[] {
	const now = new Date()
	const toKeep: BackupInfo[] = []

	// Sempre manter backups manuais
	const manualBackups = backups.filter((b) => b.isManual)
	toKeep.push(...manualBackups)

	// Filtrar apenas backups automáticos para aplicar política
	const autoBackups = backups.filter((b) => !b.isManual)

	// 1. Backups diários (últimos X dias)
	const dailyCutoff = new Date(now.getTime() - policy.dailyRetentionDays * 24 * 60 * 60 * 1000)
	const dailyBackups = autoBackups.filter((b) => b.lastModified >= dailyCutoff)
	toKeep.push(...dailyBackups)

	// 2. Backups semanais (um por semana nas últimas X semanas)
	const weeklyCutoff = new Date(now.getTime() - policy.weeklyRetentionWeeks * 7 * 24 * 60 * 60 * 1000)
	const weeklyBackups = getWeeklyBackups(
		autoBackups.filter((b) => b.lastModified >= weeklyCutoff && b.lastModified < dailyCutoff),
		policy.weeklyRetentionWeeks,
	)
	toKeep.push(...weeklyBackups)

	// 3. Backups mensais (um por mês nos últimos X meses)
	const monthlyCutoff = new Date(now.getTime() - policy.monthlyRetentionMonths * 30 * 24 * 60 * 60 * 1000)
	const monthlyBackups = getMonthlyBackups(
		autoBackups.filter((b) => b.lastModified >= monthlyCutoff && b.lastModified < weeklyCutoff),
		policy.monthlyRetentionMonths,
	)
	toKeep.push(...monthlyBackups)

	// Remover duplicatas
	const uniqueToKeep = Array.from(new Set(toKeep))

	// Aplicar limites adicionais se configurados
	let finalToKeep = uniqueToKeep

	// Limite por tamanho total
	if (policy.maxTotalSize) {
		finalToKeep = applyTotalSizeLimit(finalToKeep, policy.maxTotalSize)
	}

	// Limite por quantidade
	if (policy.maxBackupCount) {
		finalToKeep = finalToKeep
			.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
			.slice(0, policy.maxBackupCount)
	}

	return finalToKeep
}

/**
 * Seleciona um backup por semana
 */
function getWeeklyBackups(backups: BackupInfo[], weeks: number): BackupInfo[] {
	const weeklyBackups: BackupInfo[] = []
	const now = new Date()

	for (let week = 0; week < weeks; week++) {
		const weekStart = new Date(now.getTime() - (week + 1) * 7 * 24 * 60 * 60 * 1000)
		const weekEnd = new Date(now.getTime() - week * 7 * 24 * 60 * 60 * 1000)

		const weekBackups = backups.filter((b) => b.lastModified >= weekStart && b.lastModified < weekEnd)

		// Manter o backup mais recente da semana
		if (weekBackups.length > 0) {
			weekBackups.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
			const mostRecent = weekBackups[0]
			if (mostRecent) {
				weeklyBackups.push(mostRecent)
			}
		}
	}

	return weeklyBackups
}

/**
 * Seleciona um backup por mês
 */
function getMonthlyBackups(backups: BackupInfo[], months: number): BackupInfo[] {
	const monthlyBackups: BackupInfo[] = []
	const now = new Date()

	for (let month = 0; month < months; month++) {
		const monthStart = new Date(now.getFullYear(), now.getMonth() - month - 1, 1)
		const monthEnd = new Date(now.getFullYear(), now.getMonth() - month, 1)

		const monthBackups = backups.filter((b) => b.lastModified >= monthStart && b.lastModified < monthEnd)

		// Manter o backup mais recente do mês
		if (monthBackups.length > 0) {
			monthBackups.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
			const mostRecent = monthBackups[0]
			if (mostRecent) {
				monthlyBackups.push(mostRecent)
			}
		}
	}

	return monthlyBackups
}

/**
 * Aplica limite de tamanho total, removendo backups mais antigos primeiro
 */
function applyTotalSizeLimit(backups: BackupInfo[], maxSize: number): BackupInfo[] {
	const sorted = backups.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
	const result: BackupInfo[] = []
	let totalSize = 0

	for (const backup of sorted) {
		if (totalSize + backup.size <= maxSize) {
			result.push(backup)
			totalSize += backup.size
		} else {
			// Parar quando atingir o limite de tamanho
			break
		}
	}

	return result
}

/**
 * Deleta um backup específico
 */
async function deleteBackup(s3Client: S3Client, bucketName: string, key: string): Promise<void> {
	const command = new DeleteObjectCommand({
		Bucket: bucketName,
		Key: key,
	})

	await s3Client.send(command)
}

/**
 * Gera relatório de retenção em formato legível
 */
export function generateRetentionReport(result: {
	deleted: string[]
	kept: string[]
	totalSizeBefore: number
	totalSizeAfter: number
	errors: string[]
}): string {
	const sizeBefore = (result.totalSizeBefore / 1024 / 1024).toFixed(2)
	const sizeAfter = (result.totalSizeAfter / 1024 / 1024).toFixed(2)
	const spaceSaved = ((result.totalSizeBefore - result.totalSizeAfter) / 1024 / 1024).toFixed(2)

	let report = "=== RELATÓRIO DE RETENÇÃO DE BACKUPS ===\n"
	report += `Backups mantidos: ${result.kept.length}\n`
	report += `Backups deletados: ${result.deleted.length}\n`
	report += `Tamanho antes: ${sizeBefore} MB\n`
	report += `Tamanho depois: ${sizeAfter} MB\n`
	report += `Espaço liberado: ${spaceSaved} MB\n`

	if (result.errors.length > 0) {
		report += `\nErros: ${result.errors.length}\n`
		result.errors.forEach((error) => {
			report += `  - ${error}\n`
		})
	}

	if (result.deleted.length > 0) {
		report += "\nBackups deletados:\n"
		result.deleted.forEach((file) => {
			report += `  - ${file}\n`
		})
	}

	return report
}
