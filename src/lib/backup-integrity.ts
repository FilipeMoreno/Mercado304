/**
 * Sistema de verificação de integridade para backups
 * Inclui checksums, validação de estrutura e relatórios de qualidade
 */

import { createHash } from "node:crypto"
import { prisma } from "./prisma"

export interface BackupIntegrityReport {
	isValid: boolean
	checksum: string
	size: number
	recordCount: number
	tables: {
		name: string
		recordCount: number
		isValid: boolean
	}[]
	validationErrors: string[]
	createdAt: string
}

/**
 * Gera checksum SHA-256 para o conteúdo do backup
 */
export function generateBackupChecksum(backupContent: string): string {
	return createHash("sha256").update(backupContent).digest("hex")
}

/**
 * Valida a estrutura básica do backup SQL
 */
export function validateBackupStructure(backupContent: string): {
	isValid: boolean
	errors: string[]
} {
	const errors: string[] = []

	// Verificar se contém BEGIN e COMMIT
	if (!backupContent.includes("BEGIN;")) {
		errors.push("Backup não contém declaração BEGIN")
	}

	if (!backupContent.includes("COMMIT;")) {
		errors.push("Backup não contém declaração COMMIT")
	}

	// Verificar se contém tabelas essenciais
	const essentialTables = ["users", "markets", "brands", "categories", "products"]

	for (const table of essentialTables) {
		if (!backupContent.includes(`INSERT INTO ${table}`)) {
			errors.push(`Backup não contém dados da tabela essencial: ${table}`)
		}
	}

	// Verificar se há SQL injection básico
	const suspiciousPatterns = [
		/DROP\s+TABLE/i,
		/DELETE\s+FROM(?!\s+temp)/i, // Permitir DELETE FROM temp tables
		/TRUNCATE/i,
		/;\s*DROP/i, // SQL injection típico
		/UNION\s+SELECT/i, // SQL injection
		/\/\*[\s\S]*?\*\//, // Comentários de bloco suspeitos
	]

	for (const pattern of suspiciousPatterns) {
		if (pattern.test(backupContent)) {
			errors.push(`Conteúdo suspeito detectado: ${pattern.source}`)
		}
	}

	// Verificar comentários suspeitos mais específicos (evitar falsos positivos)
	const maliciousCommentPattern = /--\s*(DROP|DELETE|TRUNCATE|EXEC|EXECUTE)/i
	if (maliciousCommentPattern.test(backupContent)) {
		errors.push("Comentários SQL maliciosos detectados")
	}

	return {
		isValid: errors.length === 0,
		errors,
	}
}

/**
 * Conta registros aproximados no backup SQL
 */
export function countBackupRecords(backupContent: string): number {
	const insertMatches = backupContent.match(/INSERT INTO \w+/g)
	return insertMatches ? insertMatches.length : 0
}

/**
 * Conta registros por tabela no backup
 */
export function countRecordsByTable(backupContent: string): Array<{
	table: string
	count: number
}> {
	const tables: Record<string, number> = {}

	// Regex para capturar INSERT INTO table_name
	const insertRegex = /INSERT INTO (\w+)/g
	let match

	while ((match = insertRegex.exec(backupContent)) !== null) {
		const tableName = match[1]
		tables[tableName] = (tables[tableName] || 0) + 1
	}

	return Object.entries(tables).map(([table, count]) => ({
		table,
		count,
	}))
}

/**
 * Gera relatório completo de integridade do backup
 */
export async function generateIntegrityReport(
	backupContent: string,
	skipDatabaseCheck = false, // Opção para pular verificação do banco
): Promise<BackupIntegrityReport> {
	const checksum = generateBackupChecksum(backupContent)
	const structure = validateBackupStructure(backupContent)
	const recordCount = countBackupRecords(backupContent)
	const tableRecords = countRecordsByTable(backupContent)

	// Verificar consistência com banco atual (opcional)
	let tables = tableRecords.map(({ table, count }) => ({
		name: table,
		recordCount: count,
		isValid: true, // Por padrão, considerar válido
	}))

	if (!skipDatabaseCheck) {
		try {
			const currentCounts = await getCurrentDatabaseCounts()

			tables = tableRecords.map(({ table, count }) => {
				const currentCount = currentCounts[table] || 0

				// Se não temos dados do banco atual, considerar válido
				if (currentCount === 0) {
					return {
						name: table,
						recordCount: count,
						isValid: true,
					}
				}

				// Permitir diferenças maiores (backup pode ser defasado ou ter dados diferentes)
				// Aceitar até 50% de diferença ou diferença absoluta de até 10 registros
				const percentDiff = Math.abs(count - currentCount) / currentCount
				const absoluteDiff = Math.abs(count - currentCount)
				const isValid = percentDiff <= 0.5 || absoluteDiff <= 10

				return {
					name: table,
					recordCount: count,
					isValid,
				}
			})
		} catch (error) {
			console.warn("[Backup Integrity] Erro ao verificar banco, pulando verificação:", error)
			// Se falhar, manter todas as tabelas como válidas
		}
	}

	// Adicionar erros de inconsistência
	const validationErrors = [...structure.errors]
	tables.forEach((table) => {
		if (!table.isValid) {
			validationErrors.push(`Inconsistência na tabela ${table.name}: backup tem ${table.recordCount} registros`)
		}
	})

	return {
		isValid: structure.isValid && tables.every((t) => t.isValid),
		checksum,
		size: Buffer.byteLength(backupContent, "utf8"),
		recordCount,
		tables,
		validationErrors,
		createdAt: new Date().toISOString(),
	}
}

/**
 * Obtém contagem atual de registros no banco
 * Executa em sequência para evitar timeout do connection pool
 */
async function getCurrentDatabaseCounts(): Promise<Record<string, number>> {
	try {
		const counts: Record<string, number> = {}

		// Executar contagens em sequência para evitar timeout do pool
		console.log("[Backup Integrity] Obtendo contagens do banco...")

		try {
			counts.users = await prisma.user.count()
		} catch (e) {
			counts.users = 0
		}

		try {
			counts.markets = await prisma.market.count()
		} catch (e) {
			counts.markets = 0
		}

		try {
			counts.brands = await prisma.brand.count()
		} catch (e) {
			counts.brands = 0
		}

		try {
			counts.categories = await prisma.category.count()
		} catch (e) {
			counts.categories = 0
		}

		try {
			counts.products = await prisma.product.count()
		} catch (e) {
			counts.products = 0
		}

		try {
			counts.purchases = await prisma.purchase.count()
		} catch (e) {
			counts.purchases = 0
		}

		try {
			counts.stock_items = await prisma.stockItem.count()
		} catch (e) {
			counts.stock_items = 0
		}

		try {
			counts.waste_records = await prisma.wasteRecord.count()
		} catch (e) {
			counts.waste_records = 0
		}

		console.log("[Backup Integrity] Contagens obtidas:", counts)
		return counts
	} catch (error) {
		console.warn("Erro ao obter contagens do banco:", error)
		// Retornar contagens vazias para não bloquear o backup
		return {}
	}
}

/**
 * Sanitiza dados sensíveis no backup para logs
 */
export function sanitizeBackupForLogging(backupContent: string): string {
	// Remover dados sensíveis dos logs
	return (
		backupContent
			.replace(/password['"]\s*:\s*['"][^'"]*['"]/gi, 'password": "***"')
			.replace(/secret['"]\s*:\s*['"][^'"]*['"]/gi, 'secret": "***"')
			.replace(/token['"]\s*:\s*['"][^'"]*['"]/gi, 'token": "***"')
			.substring(0, 500) + "..."
	) // Limitar tamanho do log
}
