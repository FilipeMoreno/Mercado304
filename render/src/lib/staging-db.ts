// render/src/lib/staging-db.ts
// Biblioteca para gerenciar banco de dados SQLite temporário durante a sync

import Database from "better-sqlite3"
import { randomUUID } from "crypto"
import { existsSync, unlinkSync, readdirSync, statSync } from "fs"
import { join } from "path"
import type { PrismaClient } from "@prisma/client"

interface PriceRecordStaging {
	productId: string
	marketId: string
	price: number
	recordDate: Date
	notes?: string
}

export class StagingDatabase {
	private db: Database.Database
	private dbPath: string
	private insertStmt: Database.Statement
	private recordCount = 0
	private syncJobId: string

	constructor(syncJobId: string) {
		this.syncJobId = syncJobId
		// Criar banco SQLite temporário
		this.dbPath = join(process.cwd(), `staging-${syncJobId}.db`)
		this.db = new Database(this.dbPath)
		
		// Configurações de performance para SQLite
		this.db.pragma("journal_mode = WAL") // Write-Ahead Logging
		this.db.pragma("synchronous = NORMAL") // Balance entre segurança e velocidade
		this.db.pragma("cache_size = 10000") // Cache maior
		this.db.pragma("temp_store = MEMORY") // Usar memória para temp
		
		// Criar tabela
		this.db.exec(`
			CREATE TABLE IF NOT EXISTS price_records (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				productId TEXT NOT NULL,
				marketId TEXT NOT NULL,
				price REAL NOT NULL,
				recordDate TEXT NOT NULL,
				notes TEXT
			);
			
			-- Índices para acelerar a importação
			CREATE INDEX IF NOT EXISTS idx_product_market ON price_records(productId, marketId);
			CREATE INDEX IF NOT EXISTS idx_record_date ON price_records(recordDate);
		`)
		
		// Preparar statement de inserção (muito mais rápido que criar statement cada vez)
		this.insertStmt = this.db.prepare(`
			INSERT INTO price_records (productId, marketId, price, recordDate, notes)
			VALUES (?, ?, ?, ?, ?)
		`)
		
		console.log(`📦 Staging database criado: ${this.dbPath}`)
	}

	/**
	 * Inserir um preço no staging database (operação extremamente rápida)
	 */
	insert(record: PriceRecordStaging): void {
		this.insertStmt.run(
			record.productId,
			record.marketId,
			record.price,
			record.recordDate.toISOString(),
			record.notes || null
		)
		this.recordCount++
	}

	/**
	 * Inserir múltiplos preços em uma única transação (ainda mais rápido)
	 */
	insertBatch(records: PriceRecordStaging[]): void {
		const insertMany = this.db.transaction((items: PriceRecordStaging[]) => {
			for (const item of items) {
				this.insertStmt.run(
					item.productId,
					item.marketId,
					item.price,
					item.recordDate.toISOString(),
					item.notes || null
				)
			}
		})
		
		insertMany(records)
		this.recordCount += records.length
	}

	/**
	 * Obter estatísticas do staging database
	 */
	getStats() {
		const stats = this.db.prepare(`
			SELECT 
				COUNT(*) as total,
				COUNT(DISTINCT productId) as uniqueProducts,
				COUNT(DISTINCT marketId) as uniqueMarkets,
				MIN(price) as minPrice,
				MAX(price) as maxPrice,
				AVG(price) as avgPrice
			FROM price_records
		`).get() as any

		return {
			totalRecords: stats.total,
			uniqueProducts: stats.uniqueProducts,
			uniqueMarkets: stats.uniqueMarkets,
			minPrice: stats.minPrice,
			maxPrice: stats.maxPrice,
			avgPrice: stats.avgPrice,
		}
	}

	/**
	 * Importar todos os dados para o PostgreSQL em batches (com suporte a parallel import)
	 */
	async importToPostgres(
		prisma: PrismaClient,
		options: {
			batchSize?: number
			checkExisting?: boolean
			parallelWorkers?: number
			onProgress?: (imported: number, total: number) => void
		} = {}
	): Promise<{ imported: number; skipped: number; errors: number }> {
		const batchSize = options.batchSize || 1000
		const checkExisting = options.checkExisting ?? true
		const parallelWorkers = options.parallelWorkers || 1 // Default: sequencial (compatibilidade)
		
		if (parallelWorkers > 1) {
			console.log(`🚀 Iniciando importação PARALELA de ${this.recordCount} registros com ${parallelWorkers} workers...`)
			return this.importToPostgresParallel(prisma, { batchSize, checkExisting, parallelWorkers, onProgress: options.onProgress })
		}
		
		console.log(`🚀 Iniciando importação de ${this.recordCount} registros para PostgreSQL...`)
		
		let imported = 0
		let skipped = 0
		let errors = 0
		let offset = 0
		
		// Preparar query para ler em batches
		const selectStmt = this.db.prepare(`
			SELECT productId, marketId, price, recordDate, notes
			FROM price_records
			LIMIT ? OFFSET ?
		`)
		
		while (offset < this.recordCount) {
			const batch = selectStmt.all(batchSize, offset) as Array<{
				productId: string
				marketId: string
				price: number
				recordDate: string
				notes: string | null
			}>
			
			if (batch.length === 0) break
			
			try {
				if (checkExisting) {
					// Verificar quais registros já existem (últimas 24h)
					const dataLimite = new Date()
					dataLimite.setHours(dataLimite.getHours() - 24)
					
					const existingRecords = await prisma.priceRecord.findMany({
						where: {
							OR: batch.map(r => ({
								productId: r.productId,
								marketId: r.marketId,
								recordDate: { gte: dataLimite },
							})),
						},
						select: {
							productId: true,
							marketId: true,
							price: true,
						},
					})
					
					// Criar set para lookup rápido
					const existingSet = new Set(
						existingRecords.map(r => `${r.productId}:${r.marketId}:${r.price.toFixed(2)}`)
					)
					
					// Filtrar apenas os novos
					const newRecords = batch.filter(r => {
						const key = `${r.productId}:${r.marketId}:${r.price.toFixed(2)}`
						return !existingSet.has(key)
					})
					
					skipped += batch.length - newRecords.length
					
					// Inserir apenas os novos
					if (newRecords.length > 0) {
						await prisma.priceRecord.createMany({
							data: newRecords.map(r => ({
								productId: r.productId,
								marketId: r.marketId,
								price: r.price,
								recordDate: new Date(r.recordDate),
								notes: r.notes || undefined,
							})),
							skipDuplicates: true,
						})
						
						imported += newRecords.length
					}
				} else {
					// Inserir todos sem verificar (mais rápido)
					await prisma.priceRecord.createMany({
						data: batch.map(r => ({
							productId: r.productId,
							marketId: r.marketId,
							price: r.price,
							recordDate: new Date(r.recordDate),
							notes: r.notes || undefined,
						})),
						skipDuplicates: true,
					})
					
					imported += batch.length
				}
			} catch (error) {
				console.error(`❌ Erro ao importar batch (offset ${offset}):`, error)
				errors += batch.length
			}
			
			offset += batch.length
			
			// Callback de progresso
			if (options.onProgress) {
				options.onProgress(offset, this.recordCount)
			}
			
			// Log de progresso
			if (offset % 5000 === 0 || offset === this.recordCount) {
				console.log(`📊 Progresso: ${offset}/${this.recordCount} (${Math.round(offset / this.recordCount * 100)}%)`)
			}
		}
		
		console.log(`✅ Importação concluída: ${imported} inseridos, ${skipped} ignorados, ${errors} erros`)
		
		return { imported, skipped, errors }
	}

	/**
	 * Importação paralela (NOVO!) - 2-4x mais rápido
	 */
	private async importToPostgresParallel(
		prisma: PrismaClient,
		options: {
			batchSize: number
			checkExisting: boolean
			parallelWorkers: number
			onProgress?: (imported: number, total: number) => void
		}
	): Promise<{ imported: number; skipped: number; errors: number }> {
		const { batchSize, checkExisting, parallelWorkers, onProgress } = options
		
		// Dividir registros em chunks para cada worker
		const totalBatches = Math.ceil(this.recordCount / batchSize)
		const batchesPerWorker = Math.ceil(totalBatches / parallelWorkers)
		
		console.log(`📦 Dividindo ${totalBatches} batches entre ${parallelWorkers} workers (${batchesPerWorker} batches por worker)`)
		
		// Criar workers
		const workers: Promise<{ imported: number; skipped: number; errors: number }>[] = []
		
		for (let workerIndex = 0; workerIndex < parallelWorkers; workerIndex++) {
			const startOffset = workerIndex * batchesPerWorker * batchSize
			const endOffset = Math.min((workerIndex + 1) * batchesPerWorker * batchSize, this.recordCount)
			
			if (startOffset >= this.recordCount) break
			
			// Criar worker
			const workerPromise = this.importWorker(
				prisma,
				workerIndex,
				startOffset,
				endOffset,
				batchSize,
				checkExisting,
				onProgress
			)
			
			workers.push(workerPromise)
		}
		
		console.log(`⚡ Processando ${workers.length} workers em paralelo...`)
		
		// Executar todos os workers em paralelo
		const results = await Promise.all(workers)
		
		// Consolidar resultados
		const totals = results.reduce(
			(acc, result) => ({
				imported: acc.imported + result.imported,
				skipped: acc.skipped + result.skipped,
				errors: acc.errors + result.errors,
			}),
			{ imported: 0, skipped: 0, errors: 0 }
		)
		
		console.log(`✅ Importação PARALELA concluída: ${totals.imported} inseridos, ${totals.skipped} ignorados, ${totals.errors} erros`)
		
		return totals
	}

	/**
	 * Worker individual para importação paralela
	 */
	private async importWorker(
		prisma: PrismaClient,
		workerId: number,
		startOffset: number,
		endOffset: number,
		batchSize: number,
		checkExisting: boolean,
		onProgress?: (imported: number, total: number) => void
	): Promise<{ imported: number; skipped: number; errors: number }> {
		let imported = 0
		let skipped = 0
		let errors = 0
		
		const recordsToProcess = endOffset - startOffset
		console.log(`🔨 Worker ${workerId}: processando registros ${startOffset} a ${endOffset} (${recordsToProcess} registros)`)
		
		// Preparar query para este worker
		const selectStmt = this.db.prepare(`
			SELECT productId, marketId, price, recordDate, notes
			FROM price_records
			LIMIT ? OFFSET ?
		`)
		
		let offset = startOffset
		
		while (offset < endOffset) {
			const batch = selectStmt.all(batchSize, offset) as Array<{
				productId: string
				marketId: string
				price: number
				recordDate: string
				notes: string | null
			}>
			
			if (batch.length === 0) break
			
			try {
				if (checkExisting) {
					const dataLimite = new Date()
					dataLimite.setHours(dataLimite.getHours() - 24)
					
					const existingRecords = await prisma.priceRecord.findMany({
						where: {
							OR: batch.map(r => ({
								productId: r.productId,
								marketId: r.marketId,
								recordDate: { gte: dataLimite },
							})),
						},
						select: {
							productId: true,
							marketId: true,
							price: true,
						},
					})
					
					const existingSet = new Set(
						existingRecords.map(r => `${r.productId}:${r.marketId}:${r.price.toFixed(2)}`)
					)
					
					const newRecords = batch.filter(r => {
						const key = `${r.productId}:${r.marketId}:${r.price.toFixed(2)}`
						return !existingSet.has(key)
					})
					
					skipped += batch.length - newRecords.length
					
					if (newRecords.length > 0) {
						await prisma.priceRecord.createMany({
							data: newRecords.map(r => ({
								productId: r.productId,
								marketId: r.marketId,
								price: r.price,
								recordDate: new Date(r.recordDate),
								notes: r.notes || undefined,
							})),
							skipDuplicates: true,
						})
						
						imported += newRecords.length
					}
				} else {
					await prisma.priceRecord.createMany({
						data: batch.map(r => ({
							productId: r.productId,
							marketId: r.marketId,
							price: r.price,
							recordDate: new Date(r.recordDate),
							notes: r.notes || undefined,
						})),
						skipDuplicates: true,
					})
					
					imported += batch.length
				}
			} catch (error) {
				console.error(`❌ Worker ${workerId} erro no batch (offset ${offset}):`, error)
				errors += batch.length
			}
			
			offset += batch.length
			
			if (onProgress) {
				onProgress(offset - startOffset + startOffset, this.recordCount)
			}
		}
		
		console.log(`✅ Worker ${workerId} concluído: ${imported} inseridos, ${skipped} ignorados, ${errors} erros`)
		
		return { imported, skipped, errors }
	}

	/**
	 * Fechar e limpar o banco temporário
	 * @param deleteFile - Se true, deleta o arquivo local
	 * @param retentionDays - Se > 0, mantém o arquivo por X dias (persistent staging)
	 */
	async close(deleteFile = true, retentionDays = 0): Promise<void> {
		// Fechar conexão
		this.db.close()
		
		// PERSISTENT STAGING: Manter arquivo por X dias
		if (retentionDays > 0) {
			console.log(`💾 PERSISTENT STAGING: Arquivo mantido por ${retentionDays} dias: ${this.dbPath}`)
			console.log(`📅 Será deletado automaticamente após: ${new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000).toLocaleString()}`)
			return // Não deletar
		}
		
		if (deleteFile && existsSync(this.dbPath)) {
			try {
				unlinkSync(this.dbPath)
				console.log(`🗑️ Staging database removido: ${this.dbPath}`)
			} catch (error) {
				console.error(`⚠️ Erro ao remover staging database: ${error}`)
			}
		}
	}

	/**
	 * Obter quantidade de registros
	 */
	getRecordCount(): number {
		return this.recordCount
	}

	/**
	 * Verificar se há registros duplicados no staging
	 */
	findDuplicates() {
		return this.db.prepare(`
			SELECT productId, marketId, COUNT(*) as count
			FROM price_records
			GROUP BY productId, marketId
			HAVING count > 1
		`).all()
	}
}

/**
 * Criar staging database para uma sync
 */
export function createStagingDb(syncJobId: string): StagingDatabase {
	return new StagingDatabase(syncJobId)
}

/**
 * Abrir um staging database existente (para reimportar ou analisar)
 */
export function openExistingStagingDb(dbPath: string): StagingDatabase | null {
	if (!existsSync(dbPath)) {
		console.error(`❌ Staging database não encontrado: ${dbPath}`)
		return null
	}

	// Extrair syncJobId do nome do arquivo
	const fileName = dbPath.split(/[/\\]/).pop() || ""
	const syncJobId = fileName.replace("staging-", "").replace(".db", "")

	console.log(`📂 Abrindo staging database existente: ${dbPath}`)

	try {
		const db = new Database(dbPath, { readonly: true })

		// Criar instância fake para acessar métodos de importação
		const stagingDb = Object.create(StagingDatabase.prototype) as StagingDatabase
		
		// Contar registros
		const countResult = db.prepare("SELECT COUNT(*) as count FROM price_records").get() as { count: number }
		
		Object.assign(stagingDb, {
			db,
			dbPath,
			syncJobId,
			recordCount: countResult.count,
		})

		console.log(`✅ Staging database aberto: ${countResult.count} registros`)

		return stagingDb
	} catch (error) {
		console.error(`❌ Erro ao abrir staging database:`, error)
		return null
	}
}

/**
 * Listar todos os staging databases existentes
 */
export function listStagingDatabases(directory = process.cwd()): Array<{
	path: string
	syncJobId: string
	size: number
	created: Date
	age: number
}> {
	try {
		const files = readdirSync(directory)
		const stagingFiles = files.filter((f) => f.startsWith("staging-") && f.endsWith(".db"))

		return stagingFiles.map((fileName) => {
			const filePath = join(directory, fileName)
			const stats = statSync(filePath)
			const syncJobId = fileName.replace("staging-", "").replace(".db", "")
			const ageDays = Math.floor((Date.now() - stats.mtime.getTime()) / (24 * 60 * 60 * 1000))

			return {
				path: filePath,
				syncJobId,
				size: stats.size,
				created: stats.mtime,
				age: ageDays,
			}
		})
	} catch (error) {
		console.error("❌ Erro ao listar staging databases:", error)
		return []
	}
}

/**
 * Limpar staging databases antigos (PERSISTENT STAGING - limpeza automática)
 * @param retentionDays - Deletar arquivos com mais de X dias
 * @param directory - Diretório onde procurar
 * @returns Quantidade de arquivos deletados
 */
export function cleanupOldStagingDatabases(retentionDays = 7, directory = process.cwd()): number {
	console.log(`🧹 Limpando staging databases com mais de ${retentionDays} dias...`)

	const stagingFiles = listStagingDatabases(directory)
	let deletedCount = 0

	for (const file of stagingFiles) {
		if (file.age >= retentionDays) {
			try {
				unlinkSync(file.path)
				console.log(`🗑️ Deletado: ${file.path} (${file.age} dias, ${(file.size / 1024 / 1024).toFixed(2)} MB)`)
				deletedCount++
			} catch (error) {
				console.error(`❌ Erro ao deletar ${file.path}:`, error)
			}
		}
	}

	if (deletedCount === 0) {
		console.log(`✅ Nenhum arquivo antigo encontrado (retention: ${retentionDays} dias)`)
	} else {
		console.log(`✅ ${deletedCount} arquivo(s) deletado(s)`)
	}

	return deletedCount
}

/**
 * Reimportar dados de um staging database existente
 */
export async function reimportFromStagingDb(
	dbPath: string,
	prisma: PrismaClient,
	options: {
		batchSize?: number
		checkExisting?: boolean
		parallelWorkers?: number
		onProgress?: (imported: number, total: number) => void
	} = {}
): Promise<{ imported: number; skipped: number; errors: number } | null> {
	console.log(`♻️ Reimportando dados de staging database: ${dbPath}`)

	const stagingDb = openExistingStagingDb(dbPath)
	if (!stagingDb) {
		return null
	}

	try {
		const result = await stagingDb.importToPostgres(prisma, options)
		console.log(`✅ Reimportação concluída: ${result.imported} inseridos, ${result.skipped} ignorados`)
		return result
	} catch (error) {
		console.error("❌ Erro durante reimportação:", error)
		return null
	} finally {
		// Fechar conexão (não deletar)
		if (stagingDb) {
			await stagingDb.close(false, 0)
		}
	}
}

