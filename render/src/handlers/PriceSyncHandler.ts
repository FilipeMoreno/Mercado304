// render/src/handlers/PriceSyncHandler.ts
// Handler para jobs de sincronização de preços

import type { Job } from "bullmq"
import { LOCAL_PADRAO, NOTA_PARANA_BASE_URL, PERIODO_PADRAO, RAIO_PADRAO } from "../lib/nota-parana-config"
import { createRDSBackupManager } from "../lib/rds-backup"
import { createStagingDb, type StagingDatabase } from "../lib/staging-db"
import type { JobProgress, JobResult, PriceSyncJobData } from "../types/jobs"
import { BaseHandler } from "./BaseHandler"

export class PriceSyncHandler extends BaseHandler<PriceSyncJobData> {
	private readonly BATCH_SIZE = 5
	private readonly DELAY_BETWEEN_BATCHES = 500
	private syncJobId: string | null = null
	private stagingDb: StagingDatabase | null = null

	protected async updateProgress(job: Job<PriceSyncJobData>, progress: JobProgress): Promise<void> {
		// Enviar progresso completo para o BullMQ (frontend pode acessar via API)
		await job.updateProgress({
			percentage: progress.percentage,
			stage: progress.stage,
			message: progress.message,
			currentPhase: progress.currentPhase,
			parallelWorkers: progress.parallelWorkers,
			stagingStats: progress.stagingStats,
			importProgress: progress.importProgress,
			backupProgress: progress.backupProgress,
			persistentStaging: progress.persistentStaging,
		})

		console.log(`[${job.name}] ${progress.stage}: ${progress.message} (${progress.percentage}%)`)

		// Atualizar também na tabela SyncJob com informações estendidas
		if (this.syncJobId) {
			await this.prisma.syncJob.update({
				where: { id: this.syncJobId },
				data: {
					progresso: progress.percentage,
					detalhes: {
						...(await this.getCurrentDetails()),
						currentPhase: progress.currentPhase,
						parallelWorkers: progress.parallelWorkers,
						stagingStats: progress.stagingStats,
						importProgress: progress.importProgress,
						backupProgress: progress.backupProgress,
						persistentStaging: progress.persistentStaging,
					},
					updatedAt: new Date(),
				},
			})
		}
	}

	// Método auxiliar para preservar detalhes existentes
	private async getCurrentDetails(): Promise<any> {
		if (!this.syncJobId) return {}

		const current = await this.prisma.syncJob.findUnique({
			where: { id: this.syncJobId },
			select: { detalhes: true },
		})

		return current?.detalhes || {}
	}

	protected async logInfo(
		job: Job<PriceSyncJobData>,
		message: string,
		data?: unknown,
		debugLogs?: string[],
	): Promise<void> {
		console.log(`[${job.name}] ${message}`, data ? JSON.stringify(data, null, 2) : "")

		// Salvar log também na tabela SyncJob se disponível
		if (this.syncJobId) {
			const currentSyncJob = await this.prisma.syncJob.findUnique({
				where: { id: this.syncJobId },
				select: { logs: true },
			})

			const currentLogs = Array.isArray(currentSyncJob?.logs) ? (currentSyncJob.logs as string[]) : []
			let newLogs = [...currentLogs, `[${new Date().toISOString()}] ${message}`]

			// Adicionar logs de debug se fornecidos
			if (debugLogs && debugLogs.length > 0) {
				newLogs = [...newLogs, ...debugLogs.map((log) => `[${new Date().toISOString()}] ${log}`)]
			}

			await this.prisma.syncJob.update({
				where: { id: this.syncJobId },
				data: {
					logs: newLogs,
					updatedAt: new Date(),
				},
			})
		}
	}

	async handle(job: Job<PriceSyncJobData>): Promise<JobResult> {
		try {
			// Criar registro na tabela SyncJob
			const syncJob = await this.prisma.syncJob.create({
				data: {
					status: "running",
					tipo: "precos",
					progresso: 0,
					startedAt: new Date(),
				},
			})
			this.syncJobId = syncJob.id
			const startTime = Date.now()

			// 🚀 OTIMIZAÇÃO: Criar staging database SQLite para inserções rápidas
			this.stagingDb = createStagingDb(syncJob.id)
			await this.logInfo(job, "📦 Staging database criado - todas as inserções serão feitas localmente primeiro")

			await this.updateProgress(job, {
				percentage: 5,
				stage: "INIT",
				message: "Iniciando sincronização de preços",
				currentPhase: "collecting",
				stagingStats: {
					totalRecords: 0,
					uniqueProducts: 0,
					uniqueMarkets: 0,
					avgPrice: 0,
				},
			})

			// 1. Buscar mercados
			const mercados = await this.prisma.market.findMany({
				where: {
					legalName: { not: null },
				},
				select: {
					id: true,
					name: true,
					legalName: true,
					location: true,
				},
			})

			await this.logInfo(job, `Encontrados ${mercados.length} mercados com razão social`)

			if (mercados.length === 0) {
				// Fechar staging database
				if (this.stagingDb) {
					await this.stagingDb.close(true) // deleteFile=true
					this.stagingDb = null
				}

				// Atualizar progresso final
				await this.updateProgress(job, {
					percentage: 100,
					stage: "COMPLETED",
					message: "Sincronização encerrada: nenhum mercado com razão social",
					currentPhase: "completed",
				})

				// Atualizar status no banco
				if (this.syncJobId) {
					await this.prisma.syncJob.update({
						where: { id: this.syncJobId },
						data: {
							status: "completed",
							progresso: 100,
							mercadosProcessados: 0,
							produtosProcessados: 0,
							precosRegistrados: 0,
							detalhes: {
								estatisticas: {
									produtosTotal: 0,
									produtosEncontrados: 0,
									produtosNaoEncontrados: 0,
									precosColetados: 0,
									precosImportados: 0,
									precosIgnorados: 0,
									tempoTotalSegundos: Math.round((Date.now() - startTime) / 1000),
								},
							},
							completedAt: new Date(),
							updatedAt: new Date(),
						},
					})
				}

				return this.createSuccessResult("Nenhum mercado com razão social cadastrada", {
					mercadosProcessados: 0,
					produtosProcessados: 0,
					precosRegistrados: 0,
				})
			}

			// 2. Buscar produtos
			const produtos = await this.prisma.product.findMany({
				where: {
					barcode: { not: null },
				},
				select: {
					id: true,
					name: true,
					barcode: true,
				},
			})

			await this.logInfo(job, `Encontrados ${produtos.length} produtos com código de barras`)

			if (produtos.length === 0) {
				// Fechar staging database
				if (this.stagingDb) {
					await this.stagingDb.close(true) // deleteFile=true
					this.stagingDb = null
				}

				// Atualizar progresso final
				await this.updateProgress(job, {
					percentage: 100,
					stage: "COMPLETED",
					message: "Sincronização encerrada: nenhum produto com código de barras",
					currentPhase: "completed",
				})

				// Atualizar status no banco
				if (this.syncJobId) {
					await this.prisma.syncJob.update({
						where: { id: this.syncJobId },
						data: {
							status: "completed",
							progresso: 100,
							mercadosProcessados: mercados.length,
							produtosProcessados: 0,
							precosRegistrados: 0,
							detalhes: {
								estatisticas: {
									produtosTotal: 0,
									produtosEncontrados: 0,
									produtosNaoEncontrados: 0,
									precosColetados: 0,
									precosImportados: 0,
									precosIgnorados: 0,
									tempoTotalSegundos: Math.round((Date.now() - startTime) / 1000),
								},
							},
							completedAt: new Date(),
							updatedAt: new Date(),
						},
					})
				}

				return this.createSuccessResult("Nenhum produto com código de barras cadastrado", {
					mercadosProcessados: mercados.length,
					produtosProcessados: 0,
					precosRegistrados: 0,
				})
			}

			await this.updateProgress(job, {
				percentage: 10,
				stage: "PROCESSING",
				message: "Iniciando processamento de produtos",
				currentPhase: "collecting",
			})

			// 3. Processar produtos em paralelo (batches)
			let precosRegistrados = 0
			const detalhes: any[] = []
			const produtosNaoEncontrados: any[] = []
			let produtosProcessados = 0

			// Dividir produtos em batches
			const batches: (typeof produtos)[] = []
			for (let i = 0; i < produtos.length; i += this.BATCH_SIZE) {
				batches.push(produtos.slice(i, i + this.BATCH_SIZE))
			}

			await this.logInfo(
				job,
				`🚀 Processando ${produtos.length} produtos em ${batches.length} batches paralelos (${this.BATCH_SIZE} produtos por batch)`,
			)

			// Atualizar contadores iniciais na tabela SyncJob
			if (this.syncJobId) {
				await this.prisma.syncJob.update({
					where: { id: this.syncJobId },
					data: {
						mercadosProcessados: mercados.length,
						produtosProcessados: 0,
						precosRegistrados: 0,
						updatedAt: new Date(),
					},
				})
			}

			// Processar cada batch em paralelo
			for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
				// Verificar se o job foi cancelado
				if (this.syncJobId) {
					const currentSyncJob = await this.prisma.syncJob.findUnique({
						where: { id: this.syncJobId },
						select: { status: true },
					})

					if (currentSyncJob?.status === "cancelled") {
						await this.logInfo(job, `🛑 Sincronização cancelada pelo usuário`)

						// Limpar staging database em caso de cancelamento
						if (this.stagingDb) {
							try {
								await this.stagingDb.close(true) // deleteFile=true
								this.stagingDb = null
							} catch (cleanupError) {
								console.error("⚠️ Erro ao limpar staging database:", cleanupError)
							}
						}

						return this.createSuccessResult("Sincronização cancelada pelo usuário", {
							mercadosProcessados: mercados.length,
							produtosProcessados,
							precosRegistrados,
							produtosNaoEncontrados: produtosNaoEncontrados.length,
							tempoTotalSegundos: Math.round((Date.now() - startTime) / 1000),
							detalhes,
						})
					}
				}

				const batch = batches[batchIndex]

				await this.logInfo(job, `📦 Processando batch ${batchIndex + 1}/${batches.length} com ${batch.length} produtos`)

				const batchStartTime = Date.now()
				let batchPrecosRegistrados = 0
				let batchProdutosEncontrados = 0
				let batchProdutosNaoEncontrados = 0

				// Processar produtos do batch em paralelo
				const batchResults = await Promise.all(
					batch.map(async (produto, _idx) => {
						if (!produto.barcode) return { encontrou: false, precosEncontrados: [], debugLogs: [] }

						const result = await this.processarProduto(
							produto,
							mercados,
							NOTA_PARANA_BASE_URL,
							LOCAL_PADRAO,
							RAIO_PADRAO,
							PERIODO_PADRAO,
						)
						return result
					}),
				)

				// Coletar todos os logs de debug do batch
				const allDebugLogs = batchResults.flatMap((result) => result.debugLogs || [])
				if (allDebugLogs.length > 0) {
					await this.logInfo(job, `🔍 Logs detalhados do batch ${batchIndex + 1}:`, undefined, allDebugLogs)
				}

				const batchElapsed = Date.now() - batchStartTime

				// Contar resultados do batch
				for (const result of batchResults) {
					if (result.encontrou) {
						batchProdutosEncontrados++
						batchPrecosRegistrados += result.precosEncontrados.length
					} else {
						batchProdutosNaoEncontrados++
					}
				}

				await this.logInfo(
					job,
					`✅ Batch ${batchIndex + 1} concluído em ${batchElapsed}ms - ${batchProdutosEncontrados} produtos encontrados, ${batchPrecosRegistrados} preços registrados, ${batchProdutosNaoEncontrados} não encontrados`,
				)

				// Consolidar resultados do batch
				for (let i = 0; i < batch.length; i++) {
					const produto = batch[i]
					const result = batchResults[i]

					if (result.encontrou) {
						if (result.precosEncontrados && result.precosEncontrados.length > 0) {
							for (const precoInfo of result.precosEncontrados) {
								precosRegistrados++

								let detalhe = detalhes.find((d) => d.mercadoId === precoInfo.mercadoId)
								if (!detalhe) {
									detalhe = {
										mercado: precoInfo.mercadoNome,
										mercadoId: precoInfo.mercadoId,
										itens: [],
									}
									detalhes.push(detalhe)
								}
								detalhe.itens.push({
									produto: produto.name,
									preco: precoInfo.preco,
									data: precoInfo.data,
								})
							}
						}
					} else if (produto.barcode) {
						produtosNaoEncontrados.push({
							id: produto.id,
							nome: produto.name,
							barcode: produto.barcode,
						})
					}

					produtosProcessados++
				}

				// Calcular estimativa de tempo restante
				const tempoDecorrido = Math.round((Date.now() - startTime) / 1000)
				const progressoAtual = produtosProcessados / produtos.length
				const estimativaSegundos = progressoAtual > 0 ? Math.round(tempoDecorrido / progressoAtual - tempoDecorrido) : 0

				// Atualizar contadores em tempo real na tabela SyncJob
				if (this.syncJobId) {
					await this.prisma.syncJob.update({
						where: { id: this.syncJobId },
						data: {
							produtosProcessados,
							precosRegistrados,
							detalhes: {
								mercados: detalhes, // Lista de mercados com preços encontrados
								produtosNaoEncontrados,
								// Campos para o progresso em tempo real
								produtosProcessadosAtual: produtosProcessados,
								produtosTotal: produtos.length,
								batchAtual: batchIndex + 1,
								totalBatches: batches.length,
								produtosPorBatch: this.BATCH_SIZE,
								estimativaSegundos: estimativaSegundos,
								estatisticas: {
									produtosTotal: produtos.length,
									produtosEncontrados: produtosProcessados - produtosNaoEncontrados.length,
									produtosNaoEncontrados: produtosNaoEncontrados.length,
									precosRegistrados,
									tempoTotalSegundos: tempoDecorrido,
								},
							},
							updatedAt: new Date(),
						},
					})
				}

				// Calcular progresso
				const progresso = Math.floor(10 + (produtosProcessados / produtos.length) * 85)
				const formatarTempo = (segundos: number) => {
					if (segundos < 60) return `${segundos}s`
					const minutos = Math.floor(segundos / 60)
					const segs = segundos % 60
					return `${minutos}m ${segs}s`
				}

				await this.updateProgress(job, {
					percentage: progresso,
					stage: "PROCESSING",
					message: `Processados ${produtosProcessados}/${produtos.length} produtos (${precosRegistrados} preços registrados) - Tempo decorrido: ${formatarTempo(tempoDecorrido)} - Estimativa restante: ${formatarTempo(estimativaSegundos)}`,
					currentPhase: "collecting",
					stagingStats: this.stagingDb
						? {
								totalRecords: this.stagingDb.getRecordCount(),
								uniqueProducts: 0, // Será atualizado no final
								uniqueMarkets: 0,
								avgPrice: 0,
							}
						: undefined,
				})

				// Delay entre batches
				if (batchIndex < batches.length - 1) {
					await new Promise((resolve) => setTimeout(resolve, this.DELAY_BETWEEN_BATCHES))
				}
			}

			// 🚀 IMPORTAÇÃO: Transferir dados do staging database para PostgreSQL
			let precosImportados = 0
			let precosIgnorados = 0

			if (this.stagingDb) {
				const stats = this.stagingDb.getStats()
				await this.logInfo(job, `📊 Estatísticas do staging database:`, stats)
				await this.logInfo(
					job,
					`🔄 Iniciando importação de ${this.stagingDb.getRecordCount()} registros para PostgreSQL...`,
				)

				const parallelWorkers = 4

				await this.updateProgress(job, {
					percentage: 95,
					stage: "IMPORTING",
					message: "Importando dados do staging database para PostgreSQL...",
					currentPhase: "importing",
					parallelWorkers,
					stagingStats: {
						totalRecords: stats.totalRecords,
						uniqueProducts: stats.uniqueProducts,
						uniqueMarkets: stats.uniqueMarkets,
						avgPrice: stats.avgPrice || 0,
					},
					importProgress: {
						imported: 0,
						skipped: 0,
						errors: 0,
						workersActive: parallelWorkers,
					},
				})

				const importStartTime = Date.now()
				const result = await this.stagingDb.importToPostgres(this.prisma, {
					batchSize: 1000,
					checkExisting: true,
					parallelWorkers,
					onProgress: async (imported, total) => {
						if (imported % 5000 === 0) {
							await this.updateProgress(job, {
								percentage: 95 + Math.floor((imported / total) * 4),
								stage: "IMPORTING",
								message: `Importando: ${imported}/${total} registros (${Math.round((imported / total) * 100)}%)`,
								currentPhase: "importing",
								parallelWorkers,
								stagingStats: {
									totalRecords: stats.totalRecords,
									uniqueProducts: stats.uniqueProducts,
									uniqueMarkets: stats.uniqueMarkets,
									avgPrice: stats.avgPrice || 0,
								},
								importProgress: {
									imported,
									skipped: 0,
									errors: 0,
									workersActive: parallelWorkers,
								},
							})
						}
					},
				})

				precosImportados = result.imported
				precosIgnorados = result.skipped
				const importElapsed = Math.round((Date.now() - importStartTime) / 1000)

				await this.logInfo(
					job,
					`✅ Importação concluída em ${importElapsed}s: ${precosImportados} inseridos, ${precosIgnorados} ignorados, ${result.errors} erros`,
				)

				// Atualizar com resultados finais da importação
				await this.updateProgress(job, {
					percentage: 99,
					stage: "IMPORTING",
					message: "Importação concluída",
					currentPhase: "backing_up",
					parallelWorkers,
					stagingStats: {
						totalRecords: stats.totalRecords,
						uniqueProducts: stats.uniqueProducts,
						uniqueMarkets: stats.uniqueMarkets,
						avgPrice: stats.avgPrice || 0,
					},
					importProgress: {
						imported: precosImportados,
						skipped: precosIgnorados,
						errors: result.errors,
						workersActive: 0,
					},
				})

				// 💾 PERSISTENT STAGING & ☁️ BACKUP RDS
				const retentionDays = 2
				const willDeleteAt = new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000)

				// Fechar staging database (persistent - mantém por 2 dias)
				if (this.stagingDb) {
					await this.stagingDb.close(false /* deleteFile */, 2 /* retentionDays */)
				}

				// Criar backup do RDS
				const rdsBackupManager = createRDSBackupManager()

				if (rdsBackupManager) {
					await this.updateProgress(job, {
						percentage: 99,
						stage: "BACKUP",
						message: "Criando snapshot do RDS...",
						currentPhase: "backing_up",
						backupProgress: {
							status: "pending",
						},
						persistentStaging: {
							enabled: true,
							retentionDays,
							willDeleteAt: willDeleteAt.toISOString(),
						},
					})

					try {
						// Criar snapshot com tags
						const snapshot = await rdsBackupManager.createSnapshot({
							syncJobId: this.syncJobId || "unknown",
							produtosProcessados: produtosProcessados.toString(),
							precosRegistrados: precosRegistrados.toString(),
							mercadosProcessados: mercados.length.toString(),
						})

						await this.logInfo(job, `✅ Snapshot RDS criado: ${snapshot.snapshotIdentifier}`)

						await this.updateProgress(job, {
							percentage: 99,
							stage: "BACKUP",
							message: `Snapshot RDS criado: ${snapshot.snapshotIdentifier}`,
							currentPhase: "backing_up",
							backupProgress: {
								status: "completed",
								url: snapshot.snapshotIdentifier,
							},
							persistentStaging: {
								enabled: true,
								retentionDays,
								willDeleteAt: willDeleteAt.toISOString(),
							},
						})

						// Limpar snapshots antigos em background (não esperar)
						rdsBackupManager.cleanupOldSnapshots().catch((error) => {
							console.error("[RDS Backup] Erro ao limpar snapshots antigos:", error)
						})
					} catch (error) {
						await this.logError(job, error as Error, "Erro ao criar snapshot RDS")

						await this.updateProgress(job, {
							percentage: 99,
							stage: "BACKUP",
							message: "Erro ao criar snapshot (sincronização concluída)",
							currentPhase: "backing_up",
							backupProgress: {
								status: "skipped",
							},
							persistentStaging: {
								enabled: true,
								retentionDays,
								willDeleteAt: willDeleteAt.toISOString(),
							},
						})
					}
				} else {
					await this.logInfo(job, "⚠️ RDS backup não configurado (sync concluída)")

					await this.updateProgress(job, {
						percentage: 99,
						stage: "BACKUP",
						message: "Finalizando (RDS backup não configurado)",
						currentPhase: "backing_up",
						backupProgress: {
							status: "skipped",
						},
						persistentStaging: {
							enabled: true,
							retentionDays,
							willDeleteAt: willDeleteAt.toISOString(),
						},
					})
				}

				this.stagingDb = null
			}

			await this.updateProgress(job, {
				percentage: 100,
				stage: "COMPLETED",
				message: "Sincronização concluída com sucesso",
				currentPhase: "completed",
				importProgress: {
					imported: precosImportados,
					skipped: precosIgnorados,
					errors: 0,
					workersActive: 0,
				},
			})

			const tempoTotal = Math.round((Date.now() - startTime) / 1000)
			await this.logInfo(job, `Sincronização concluída em ${tempoTotal}s`)

			// Atualizar status final na tabela SyncJob
			if (this.syncJobId) {
				await this.prisma.syncJob.update({
					where: { id: this.syncJobId },
					data: {
						status: "completed",
						progresso: 100,
						mercadosProcessados: mercados.length,
						produtosProcessados: produtos.length,
						precosRegistrados: precosImportados, // Usar quantidade real importada
						detalhes: {
							mercados: detalhes, // Lista de mercados com preços encontrados
							produtosNaoEncontrados,
							estatisticas: {
								produtosTotal: produtos.length,
								produtosEncontrados: produtos.length - produtosNaoEncontrados.length,
								produtosNaoEncontrados: produtosNaoEncontrados.length,
								precosColetados: precosRegistrados,
								precosImportados: precosImportados,
								precosIgnorados: precosIgnorados,
								tempoTotalSegundos: tempoTotal,
							},
						},
						completedAt: new Date(),
						updatedAt: new Date(),
					},
				})
			}

			return this.createSuccessResult("Sincronização de preços concluída com sucesso", {
				mercadosProcessados: mercados.length,
				produtosProcessados: produtos.length,
				precosColetados: precosRegistrados,
				precosImportados: precosImportados,
				precosIgnorados: precosIgnorados,
				produtosNaoEncontrados: produtosNaoEncontrados.length,
				tempoTotalSegundos: tempoTotal,
				detalhes,
			})
		} catch (error) {
			await this.logError(job, error as Error, "Erro durante sincronização de preços")

			// Limpar staging database em caso de erro
			if (this.stagingDb) {
				try {
					await this.stagingDb.close(true) // deleteFile=true
					this.stagingDb = null
				} catch (cleanupError) {
					console.error("⚠️ Erro ao limpar staging database:", cleanupError)
				}
			}

			// Atualizar status de erro na tabela SyncJob
			if (this.syncJobId) {
				const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
				await this.prisma.syncJob.update({
					where: { id: this.syncJobId },
					data: {
						status: "failed",
						erros: [errorMessage],
						completedAt: new Date(),
						updatedAt: new Date(),
					},
				})
			}

			return this.createErrorResult("Erro durante sincronização de preços", [
				error instanceof Error ? error.message : "Erro desconhecido",
			])
		}
	}

	private async processarProduto(
		produto: { id: string; name: string; barcode: string | null },
		mercados: { id: string; name: string; legalName: string | null; location: string | null }[],
		NOTA_PARANA_BASE_URL: string,
		LOCAL_PADRAO: string,
		RAIO_PADRAO: number,
		PERIODO_PADRAO: number,
	) {
		if (!produto.barcode) {
			return { encontrou: false, precosEncontrados: [], debugLogs: [] }
		}

		const precosEncontrados: any[] = []
		const debugLogs: string[] = []
		let encontrouProduto = false

		debugLogs.push(`[DEBUG] 🔍 Processando produto: ${produto.name} (EAN: ${produto.barcode})`)

		try {
			const urlInicial = `${NOTA_PARANA_BASE_URL}/produtos?local=${LOCAL_PADRAO}&termo=${produto.barcode}&offset=0&raio=${RAIO_PADRAO}&data=${PERIODO_PADRAO}&ordem=0&gtin=${produto.barcode}`

			const responseInicial = await fetch(urlInicial)
			if (!responseInicial.ok) {
				debugLogs.push(`[API] ❌ Resposta HTTP ${responseInicial.status} para ${produto.name}`)
			} else {
				const dataInicial = (await responseInicial.json()) as any
				if (!dataInicial.produtos || dataInicial.produtos.length === 0) {
					debugLogs.push(`[API] ❌ Nenhum produto encontrado para ${produto.name} (EAN: ${produto.barcode})`)
				} else {
					encontrouProduto = true
					debugLogs.push(
						`[API] ✅ Produto encontrado: ${produto.name} - ${dataInicial.produtos.length} resultados na API`,
					)

					// Processar produtos encontrados
					const produtosPorCategoria = new Map<number, any[]>()

					for (const prod of dataInicial.produtos) {
						const categoria = prod.categoria || 0
						if (!produtosPorCategoria.has(categoria)) {
							produtosPorCategoria.set(categoria, [])
						}
						produtosPorCategoria.get(categoria)?.push(prod)
					}

					const categoriasOrdenadas = Array.from(produtosPorCategoria.entries())
						.sort((a, b) => b[1].length - a[1].length)
						.slice(0, 3)

					const todosProdutos = categoriasOrdenadas.flatMap(([_, produtos]) => produtos)

					// Processar estabelecimentos
					for (const produtoNP of todosProdutos) {
						const nomeEstabelecimento = produtoNP.estabelecimento.nm_emp || produtoNP.estabelecimento.nm_fan
						const enderecoEstabelecimento = produtoNP.estabelecimento

						if (!nomeEstabelecimento) {
							debugLogs.push(`[PARSING] ⚠️ Estabelecimento sem nome para ${produto.name}`)
							continue
						}

						// Encontrar mercado correspondente
						const melhorMatch = this.encontrarMelhorMatch(mercados, nomeEstabelecimento, enderecoEstabelecimento)
						if (!melhorMatch) {
							debugLogs.push(
								`[PARSING] ⚠️ Nenhum mercado correspondente para "${nomeEstabelecimento}" (produto: ${produto.name})`,
							)
							continue
						}

						const mercadoMatch = melhorMatch.mercado
						debugLogs.push(
							`[PARSING] ✅ Mercado encontrado: ${mercadoMatch.name} para "${nomeEstabelecimento}" (score: ${melhorMatch.score})`,
						)

						// Calcular preço
						const preco = parseFloat(produtoNP.valor_tabela) - parseFloat(produtoNP.valor_desconto)
						if (preco <= 0) continue

						// 🚀 OTIMIZAÇÃO: Inserir no staging database (muito mais rápido)
						// A verificação de duplicados será feita na importação final
						const dataAPI = new Date(produtoNP.datahora)
						const dataFormatada = dataAPI.toLocaleString("pt-BR", {
							day: "2-digit",
							month: "2-digit",
							year: "numeric",
							hour: "2-digit",
							minute: "2-digit",
						})

						if (this.stagingDb) {
							this.stagingDb.insert({
								productId: produto.id,
								marketId: mercadoMatch.id,
								price: preco,
								recordDate: dataAPI,
								notes: `Sincronizado - Nota Paraná em ${dataFormatada}`,
							})

							precosEncontrados.push({
								mercadoId: mercadoMatch.id,
								mercadoNome: mercadoMatch.name,
								preco: preco,
								data: produtoNP.datahora,
							})

							debugLogs.push(
								`[PRICE] 💰 Preço coletado: ${produto.name} - R$ ${preco.toFixed(2)} no ${mercadoMatch.name}`,
							)
						}
					}
				}
			}
		} catch (error) {
			debugLogs.push(`[DEBUG] ✗ Erro ao processar: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
		}

		return {
			encontrou: encontrouProduto,
			precosEncontrados,
			debugLogs,
		}
	}

	private encontrarMelhorMatch(
		mercados: { id: string; name: string; legalName: string | null; location: string | null }[],
		nomeEstabelecimento: string,
		enderecoEstabelecimento: any,
	) {
		let melhorMatch: {
			mercado: { id: string; name: string; legalName: string | null; location: string | null }
			score: number
			detalhes: string
		} | null = null

		const normalizarNome = (nome: string) => {
			return nome.toLowerCase().replace(/\//g, "").replace(/\./g, "").replace(/-/g, " ").replace(/\s+/g, " ").trim()
		}

		for (const m of mercados) {
			if (!m.legalName) continue

			const nomeNormalizadoMercado = normalizarNome(m.legalName)
			const nomeNormalizadoEstabelecimento = normalizarNome(nomeEstabelecimento)

			const palavrasMercado = nomeNormalizadoMercado.split(" ")
			const palavrasEstabelecimento = nomeNormalizadoEstabelecimento.split(" ")

			let matchesNome = 0
			const palavrasMatched: string[] = []
			for (const palavra of palavrasMercado) {
				if (palavra.length > 3 && palavrasEstabelecimento.some((p: string) => p.includes(palavra))) {
					matchesNome++
					palavrasMatched.push(palavra)
				}
			}

			if (matchesNome < 2) continue

			let matchesEndereco = 0
			const enderecoMatches: string[] = []

			if (m.location) {
				const enderecoMercado = m.location.toLowerCase()
				const ruaAPI = enderecoEstabelecimento.nm_logr?.toLowerCase() || ""
				const numeroAPI = enderecoEstabelecimento.nr_logr || ""
				const bairroAPI = enderecoEstabelecimento.bairro?.toLowerCase() || ""

				if (ruaAPI && enderecoMercado.includes(ruaAPI)) {
					matchesEndereco++
					enderecoMatches.push("rua")
				}
				if (numeroAPI && enderecoMercado.includes(numeroAPI)) {
					matchesEndereco++
					enderecoMatches.push("número")
				}
				if (bairroAPI && enderecoMercado.includes(bairroAPI)) {
					matchesEndereco++
					enderecoMatches.push("bairro")
				}
			}

			if (matchesEndereco < 2 && m.location) continue

			const score = matchesNome + matchesEndereco
			const detalhes = `Nome: ${matchesNome} matches [${palavrasMatched.join(", ")}] | Endereço: ${matchesEndereco} matches [${enderecoMatches.join(", ")}]`

			if (!melhorMatch || score > melhorMatch.score) {
				melhorMatch = { mercado: m, score, detalhes }
			}
		}

		return melhorMatch
	}
}
