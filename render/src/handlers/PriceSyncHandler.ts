// render/src/handlers/PriceSyncHandler.ts
// Handler para jobs de sincronização de preços

import type { Job } from "bullmq"
import type { JobResult, PriceSyncJobData } from "../types/jobs"
import { BaseHandler } from "./BaseHandler"

export class PriceSyncHandler extends BaseHandler<PriceSyncJobData> {
	private readonly BATCH_SIZE = 5
	private readonly DELAY_BETWEEN_BATCHES = 500

	async handle(job: Job<PriceSyncJobData>): Promise<JobResult> {
		try {
			await this.updateProgress(job, {
				percentage: 5,
				stage: "INIT",
				message: "Iniciando sincronização de preços",
			})

			const NOTA_PARANA_BASE_URL = "https://menorpreco.notaparana.pr.gov.br/api/v1"
			// Configurações padrão da Nota Paraná
			const LOCAL_PADRAO = "Curitiba"
			const PERIODO_PADRAO = 30
			const RAIO_PADRAO = 5000

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
			})

			// 3. Processar produtos em paralelo (batches)
			let precosRegistrados = 0
			const detalhes: any[] = []
			const produtosNaoEncontrados: any[] = []
			const startTime = Date.now()
			let produtosProcessados = 0

			// Dividir produtos em batches
			const batches: (typeof produtos)[] = []
			for (let i = 0; i < produtos.length; i += this.BATCH_SIZE) {
				batches.push(produtos.slice(i, i + this.BATCH_SIZE))
			}

			await this.logInfo(job, `Processando ${produtos.length} produtos em ${batches.length} batches paralelos`)

			// Processar cada batch em paralelo
			for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
				const batch = batches[batchIndex]

				await this.logInfo(job, `Processando batch ${batchIndex + 1}/${batches.length} com ${batch.length} produtos`)

				const batchStartTime = Date.now()

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

				const batchElapsed = Date.now() - batchStartTime
				await this.logInfo(job, `Batch ${batchIndex + 1} concluído em ${batchElapsed}ms`)

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

				// Calcular progresso
				const progresso = Math.floor(10 + (produtosProcessados / produtos.length) * 85)
				await this.updateProgress(job, {
					percentage: progresso,
					stage: "PROCESSING",
					message: `Processados ${produtosProcessados}/${produtos.length} produtos`,
				})

				// Delay entre batches
				if (batchIndex < batches.length - 1) {
					await new Promise((resolve) => setTimeout(resolve, this.DELAY_BETWEEN_BATCHES))
				}
			}

			await this.updateProgress(job, {
				percentage: 100,
				stage: "COMPLETED",
				message: "Sincronização concluída com sucesso",
			})

			const tempoTotal = Math.round((Date.now() - startTime) / 1000)
			await this.logInfo(job, `Sincronização concluída em ${tempoTotal}s`)

			return this.createSuccessResult("Sincronização de preços concluída com sucesso", {
				mercadosProcessados: mercados.length,
				produtosProcessados: produtos.length,
				precosRegistrados,
				produtosNaoEncontrados: produtosNaoEncontrados.length,
				tempoTotalSegundos: tempoTotal,
				detalhes,
			})
		} catch (error) {
			await this.logError(job, error as Error, "Erro durante sincronização de preços")
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

		try {
			const urlInicial = `${NOTA_PARANA_BASE_URL}/produtos?local=${LOCAL_PADRAO}&termo=${produto.barcode}&offset=0&raio=${RAIO_PADRAO}&data=${PERIODO_PADRAO}&ordem=0&gtin=${produto.barcode}`

			const responseInicial = await fetch(urlInicial)
			if (!responseInicial.ok) {
				debugLogs.push(`[API] Resposta HTTP ${responseInicial.status}`)
		} else {
			const dataInicial = await responseInicial.json() as any
			if (!dataInicial.produtos || dataInicial.produtos.length === 0) {
				debugLogs.push(`[API] Nenhum produto encontrado`)
			} else {
				encontrouProduto = true

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

						if (!nomeEstabelecimento) continue

						// Encontrar mercado correspondente
						const melhorMatch = this.encontrarMelhorMatch(mercados, nomeEstabelecimento, enderecoEstabelecimento)
						if (!melhorMatch) continue

						const mercadoMatch = melhorMatch.mercado

						// Calcular preço
						const preco = parseFloat(produtoNP.valor_tabela) - parseFloat(produtoNP.valor_desconto)
						if (preco <= 0) continue

						// Verificar se já existe registro recente
						const dataLimite = new Date()
						dataLimite.setHours(dataLimite.getHours() - 24)

						const registroExistente = await this.prisma.priceRecord.findFirst({
							where: {
								productId: produto.id,
								marketId: mercadoMatch.id,
								recordDate: { gte: dataLimite },
							},
						})

						const dataAPI = new Date(produtoNP.datahora)
						const dataFormatada = dataAPI.toLocaleString("pt-BR", {
							day: "2-digit",
							month: "2-digit",
							year: "numeric",
							hour: "2-digit",
							minute: "2-digit",
						})

						// Registrar preço se não existe ou mudou significativamente
						if (!registroExistente || Math.abs(registroExistente.price - preco) > 0.01) {
							await this.prisma.priceRecord.create({
								data: {
									productId: produto.id,
									marketId: mercadoMatch.id,
									price: preco,
									recordDate: dataAPI,
									notes: `Sincronizado - Nota Paraná em ${dataFormatada}`,
								},
							})

							precosEncontrados.push({
								mercadoId: mercadoMatch.id,
								mercadoNome: mercadoMatch.name,
								preco: preco,
								data: produtoNP.datahora,
							})
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
