// render/src/lib/backup-utils.ts
// Utilitários de backup para o servidor de background

import { promisify } from "node:util"
import { gzip } from "node:zlib"
import type { PrismaClient } from "@prisma/client"
import { generateSecurityMetadata } from "./crypto-utils"
import { uploadToR2 } from "./r2-client"

const gzipAsync = promisify(gzip)

/**
 * Gera backup do banco de dados usando Prisma
 * Versão otimizada para o servidor de background
 */
export async function generateDatabaseBackup(prisma: PrismaClient): Promise<{
	success: boolean
	data?: string
	error?: string
	stats?: {
		tables: number
		records: number
		size: number
	}
}> {
	const sqlStatements: string[] = []
	let totalRecords = 0
	const _startTime = Date.now()

	try {
		// Header do backup
		sqlStatements.push("-- Mercado304 Database Backup")
		sqlStatements.push(`-- Generated at: ${new Date().toISOString()}`)
		sqlStatements.push("-- Generated using Prisma (Background Worker)\n")
		sqlStatements.push("BEGIN;\n")

		// Desabilitar checks temporariamente
		sqlStatements.push("SET CONSTRAINTS ALL DEFERRED;\n")

		// Lista de tabelas para backup (em ordem de dependência)
		const tables = [
			{ name: "markets", model: prisma.market },
			{ name: "brands", model: prisma.brand },
			{ name: "categories", model: prisma.category },
			{ name: "products", model: prisma.product },
			{ name: "purchases", model: prisma.purchase },
			{ name: "purchase_items", model: prisma.purchaseItem },
			{ name: "shopping_lists", model: prisma.shoppingList },
			{ name: "shopping_list_items", model: prisma.shoppingListItem },
			{ name: "price_records", model: prisma.priceRecord },
			{ name: "stock_items", model: prisma.stockItem },
			{ name: "stock_history", model: prisma.stockHistory },
			{ name: "stock_movements", model: prisma.stockMovement },
			{ name: "waste_records", model: prisma.wasteRecord },
			{ name: "expiration_alerts", model: prisma.expirationAlert },
			{ name: "nutritional_info", model: prisma.nutritionalInfo },
			{ name: "recipes", model: prisma.recipe },
			{ name: "sync_jobs", model: prisma.syncJob },
			{ name: "user", model: prisma.user },
			{ name: "session", model: prisma.session },
			{ name: "account", model: prisma.account },
			{ name: "verification", model: prisma.verification },
			{ name: "passkey", model: prisma.passkey },
			{ name: "twoFactor", model: prisma.twoFactor },
			{ name: "dashboard_preferences", model: prisma.dashboardPreference },
			{ name: "churrasco_calculations", model: prisma.churrascoCalculation },
			{ name: "AssistantChatSession", model: prisma.assistantChatSession },
			{ name: "product_kits", model: prisma.productKit },
			{ name: "product_kit_items", model: prisma.productKitItem },
			{ name: "twoFactorEmailCode", model: prisma.twoFactorEmailCode },
			{ name: "trustedDevice", model: prisma.trustedDevice },
			{ name: "security_audit", model: prisma.securityAudit },
			{ name: "security_notifications", model: prisma.securityNotification },
			{ name: "ip_locations", model: prisma.ipLocation },
		]

		// Backup de cada tabela
		for (const table of tables) {
			try {
				// Usar unknown para contornar o problema de tipos do Prisma
				const records = await (table.model as unknown as { findMany: () => Promise<unknown[]> }).findMany()
				if (records.length > 0) {
					sqlStatements.push(`-- ${table.name}`)

					// Gerar INSERT statements para cada registro
					for (const record of records) {
						const insertSQL = generateInsertStatement(table.name, record as Record<string, unknown>)
						if (insertSQL) {
							sqlStatements.push(insertSQL)
							totalRecords++
						}
					}

					sqlStatements.push("")
				}
			} catch (error) {
				console.warn(`Warning: Failed to backup table ${table.name}:`, error)
				// Continue com outras tabelas mesmo se uma falhar
			}
		}

		// Footer do backup
		sqlStatements.push("COMMIT;")
		sqlStatements.push(`\n-- Backup completed at: ${new Date().toISOString()}`)

		const sqlContent = sqlStatements.join("\n")
		const size = Buffer.byteLength(sqlContent, "utf8")

		return {
			success: true,
			data: sqlContent,
			stats: {
				tables: tables.length,
				records: totalRecords,
				size,
			},
		}
	} catch (error) {
		sqlStatements.push("ROLLBACK;")
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		}
	}
}

/**
 * Gera statement INSERT para um registro
 */
function generateInsertStatement(tableName: string, record: Record<string, unknown>): string | null {
	try {
		const columns = Object.keys(record).filter((key) => record[key] !== undefined)
		if (columns.length === 0) return null

		const values = columns.map((col) => escapeValue(record[col]))
		const columnNames = columns.map((col) => `"${col}"`).join(", ")
		const valueList = values.join(", ")

		return `INSERT INTO ${tableName} (${columnNames}) VALUES (${valueList}) ON CONFLICT (id) DO NOTHING;`
	} catch (error) {
		console.warn(`Error generating INSERT for ${tableName}:`, error)
		return null
	}
}

/**
 * Escapa valores para SQL
 */
function escapeValue(value: unknown): string {
	if (value === null || value === undefined) {
		return "NULL"
	}

	if (value instanceof Date) {
		return `'${value.toISOString()}'`
	}

	if (typeof value === "string") {
		return `'${value.replace(/'/g, "''")}'`
	}

	if (typeof value === "boolean") {
		return value ? "true" : "false"
	}

	if (typeof value === "number") {
		return String(value)
	}

	if (typeof value === "object") {
		return `'${JSON.stringify(value).replace(/'/g, "''")}'`
	}

	return `'${String(value).replace(/'/g, "''")}'`
}

/**
 * Cria backup completo e faz upload para R2
 */
export async function createAndUploadBackup(
	prisma: PrismaClient,
	options: {
		compress?: boolean
		encrypt?: boolean
		backupType?: "full" | "incremental"
		description?: string
	} = {},
): Promise<{
	success: boolean
	backupId?: string
	url?: string
	error?: string
	stats?: {
		tables: number
		records: number
		size: number
		compressedSize?: number
		encryptedSize?: number
	}
	security?: {
		checksum: string
		encrypted: boolean
		algorithm?: string
	}
}> {
	try {
		const { compress = true, encrypt = true, backupType = "full", description } = options

		// Gerar backup do banco
		const backupResult = await generateDatabaseBackup(prisma)
		if (!backupResult.success || !backupResult.data) {
			return {
				success: false,
				error: backupResult.error || "Failed to generate backup",
			}
		}

		// Preparar dados para upload
		let dataBuffer = Buffer.from(backupResult.data, "utf8")
		let contentType = "text/plain"
		let compressedSize: number | undefined
		let encryptedSize: number | undefined

		// Comprimir se solicitado
		if (compress) {
			dataBuffer = await gzipAsync(dataBuffer)
			contentType = "application/gzip"
			compressedSize = dataBuffer.length
		}

		// Gerar metadados de segurança (checksum e criptografia)
		const securityMetadata = await generateSecurityMetadata(dataBuffer, encrypt)

		// Criptografar se solicitado
		if (encrypt) {
			const { encryptDataWithIV } = await import("./crypto-utils")
			const encryptedBuffer = await encryptDataWithIV(dataBuffer)
			dataBuffer = Buffer.from(encryptedBuffer)
			encryptedSize = dataBuffer.length
			contentType = "application/octet-stream"
		}

		// Gerar nome do arquivo
		const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
		let extension = "sql"
		if (compress) extension += ".gz"
		if (encrypt) extension += ".enc"
		const fileName = `backup-${backupType}-${timestamp}.${extension}`
		const key = `backups/${fileName}`

		// Metadados para o arquivo
		const metadata: Record<string, string> = {
			"backup-type": backupType,
			generatedAt: new Date().toISOString(),
			compressed: compress.toString(),
			encrypted: encrypt.toString(),
			checksum: securityMetadata.checksum,
			originalSize: securityMetadata.originalSize.toString(),
			description: description || "",
			version: "2.0.0",
		}

		if (compressedSize) {
			metadata.compressedSize = compressedSize.toString()
		}
		if (encryptedSize) {
			metadata.encryptedSize = encryptedSize.toString()
		}
		if (securityMetadata.algorithm) {
			metadata.algorithm = securityMetadata.algorithm
		}

		// Upload para R2
		const uploadResult = await uploadToR2(key, dataBuffer, contentType, metadata)

		if (!uploadResult.success) {
			return {
				success: false,
				error: uploadResult.error || "Failed to upload backup",
			}
		}

		return {
			success: true,
			backupId: fileName,
			url: uploadResult.url,
			stats: {
				...(backupResult.stats || { tables: 0, records: 0, size: 0 }),
				compressedSize,
				encryptedSize,
			},
			security: {
				checksum: securityMetadata.checksum,
				encrypted: encrypt,
				algorithm: securityMetadata.algorithm,
			},
		}
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		}
	}
}

/**
 * Lista backups disponíveis no R2
 */
export async function listBackups(): Promise<{
	success: boolean
	backups?: Array<{
		key: string
		fileName: string
		size: number
		lastModified: Date
		backupType: string
		compressed: boolean
		generatedAt: string
	}>
	error?: string
}> {
	try {
		const { listR2Files } = await import("./r2-client")
		const result = await listR2Files("backups/")

		if (!result.success || !result.files) {
			return {
				success: false,
				error: result.error || "Failed to list backups",
			}
		}

		const backups = result.files
			.filter((file) => file.key.endsWith(".sql") || file.key.endsWith(".sql.gz"))
			.map((file) => {
				const fileName = file.key.split("/").pop() || file.key
				const isCompressed = fileName.endsWith(".gz")
				const backupType = fileName.includes("incremental") ? "incremental" : "full"

				return {
					key: file.key,
					fileName,
					size: file.size,
					lastModified: file.lastModified,
					backupType,
					compressed: isCompressed,
					generatedAt: file.lastModified.toISOString(),
				}
			})
			.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())

		return {
			success: true,
			backups,
		}
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		}
	}
}
