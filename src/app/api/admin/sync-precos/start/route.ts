// src/app/api/admin/sync-precos/start/route.ts
// Inicia job de sincronização em background

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Configuração de paralelismo
const BATCH_SIZE = 5 // Processar 5 produtos simultaneamente
const DELAY_BETWEEN_BATCHES = 500 // 500ms entre batches (reduzido de 200ms por produto)
const MAX_LOGS = 500 // Máximo de logs para evitar exceder 5MB
const MAX_LOG_LENGTH = 500 // Tamanho máximo de cada log

// Verificar e retomar jobs interrompidos ao iniciar o servidor
async function retomarJobsInterrompidos() {
	try {
		// Buscar jobs que estavam rodando ou pendentes
		const jobsInterrompidos = await prisma.syncJob.findMany({
			where: {
				status: {
					in: ["pending", "running"],
				},
			},
			orderBy: {
				createdAt: "asc",
			},
		})

		if (jobsInterrompidos.length > 0) {
			console.log(`[RETOMADA] Encontrados ${jobsInterrompidos.length} jobs interrompidos`)
			
			for (const job of jobsInterrompidos) {
				console.log(`[RETOMADA] Retomando job ${job.id}`)
				
				// Adicionar log de retomada
				const logsAtuais = (job.logs as string[]) || []
				await prisma.syncJob.update({
					where: { id: job.id },
					data: {
						logs: [...logsAtuais, `[SERVER] Servidor reiniciado - retomando sincronização`],
					},
				})
				
				// Reiniciar processamento
				processarSyncJob(job.id).catch(console.error)
			}
		}
	} catch (error) {
		console.error("[RETOMADA] Erro ao retomar jobs:", error)
	}
}

// Executar retomada ao carregar o módulo
retomarJobsInterrompidos().catch(console.error)

export async function POST() {
	try {
		// Verificar se já existe job rodando
		const jobRodando = await prisma.syncJob.findFirst({
			where: {
				status: {
					in: ["pending", "running"],
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		})

		if (jobRodando) {
			return NextResponse.json(
				{
					error: "Já existe uma sincronização em andamento",
					jobId: jobRodando.id,
				},
				{ status: 409 },
			)
		}

		// Criar novo job
		const job = await prisma.syncJob.create({
			data: {
				status: "pending",
				tipo: "precos",
				logs: ["Job criado, aguardando início da execução"],
			},
		})

		// Iniciar processamento em background (não await!)
		processarSyncJob(job.id).catch(console.error)

		return NextResponse.json({
			jobId: job.id,
			status: "pending",
			message: "Sincronização iniciada em background",
		})
	} catch (error) {
		console.error("Erro ao iniciar sincronização:", error)
		return NextResponse.json({ error: "Erro ao iniciar sincronização" }, { status: 500 })
	}
}

// Função que processa o job em background
async function processarSyncJob(jobId: string) {
	const NOTA_PARANA_BASE_URL = "https://menorpreco.notaparana.pr.gov.br/api/v1"
	const { CATEGORIAS_BUSCA, LOCAL_PADRAO, PERIODO_PADRAO, RAIO_PADRAO } = await import("@/lib/nota-parana-config")

	try {
		// Atualizar status para running
		await prisma.syncJob.update({
			where: { id: jobId },
			data: {
				status: "running",
				startedAt: new Date(),
				logs: ["[SERVER] Sincronização iniciada", "[DEBUG] Modo de processamento paralelo ativado"],
			},
		})

		// 1. Buscar mercados
		const mercados = await prisma.market.findMany({
			where: {
				legalName: {
					not: null,
				},
			},
			select: {
				id: true,
				name: true,
				legalName: true,
				location: true,
			},
		})

		await adicionarLog(jobId, `[SERVER] ${mercados.length} mercados com razão social encontrados`)
		await adicionarLog(jobId, `[DEBUG] Mercados: ${mercados.map((m) => m.name).join(", ")}`)

		if (mercados.length === 0) {
			await prisma.syncJob.update({
				where: { id: jobId },
				data: {
					status: "completed",
					completedAt: new Date(),
					progresso: 100,
					erros: ["Nenhum mercado com razão social cadastrada"],
				},
			})
			return
		}

		// 2. Buscar produtos
		const produtos = await prisma.product.findMany({
			where: {
				barcode: {
					not: null,
				},
			},
			select: {
				id: true,
				name: true,
				barcode: true,
			},
		})

		await adicionarLog(jobId, `[SERVER] ${produtos.length} produtos com código de barras encontrados`)
		await adicionarLog(jobId, `[DEBUG] Primeiros produtos: ${produtos.slice(0, 5).map((p) => p.name).join(", ")}...`)

		if (produtos.length === 0) {
			await prisma.syncJob.update({
				where: { id: jobId },
				data: {
					status: "completed",
					completedAt: new Date(),
					progresso: 100,
					erros: ["Nenhum produto com código de barras cadastrado"],
				},
			})
			return
		}

		await prisma.syncJob.update({
			where: { id: jobId },
			data: {
				mercadosProcessados: mercados.length,
				produtosProcessados: produtos.length,
				progresso: 5,
				detalhes: {
					produtosTotal: produtos.length,
					produtosProcessadosAtual: 0,
					quantidadeProdutosNaoEncontrados: 0,
				},
			},
		})

		// 3. Processar produtos em paralelo (batches)
		let precosRegistrados = 0
		const detalhes: {
			mercado: string
			mercadoId: string
			itens: {
				produto: string
				preco: number
				data: string
			}[]
		}[] = []
		const produtosNaoEncontrados: {
			id: string
			nome: string
			barcode: string
		}[] = []
		const startTime = Date.now()
		let produtosProcessados = 0

		// Dividir produtos em batches
		const batches: typeof produtos[] = []
		for (let i = 0; i < produtos.length; i += BATCH_SIZE) {
			batches.push(produtos.slice(i, i + BATCH_SIZE))
		}

		await adicionarLog(jobId, `[SERVER] Processando ${produtos.length} produtos em ${batches.length} batches paralelos (${BATCH_SIZE} por vez)`)
		await adicionarLog(jobId, `[DEBUG] Configuração: BATCH_SIZE=${BATCH_SIZE}, DELAY=${DELAY_BETWEEN_BATCHES}ms`)

		// Processar cada batch em paralelo
		for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
			const batch = batches[batchIndex]

			// Verificar se o job foi cancelado antes de cada batch
			const jobAtual = await prisma.syncJob.findUnique({
				where: { id: jobId },
				select: { status: true },
			})

			if (jobAtual?.status === "cancelled") {
				await adicionarLog(jobId, "[SERVER] Sincronização cancelada pelo usuário")
				await adicionarLog(jobId, `[DEBUG] Batch ${batchIndex + 1}/${batches.length} interrompido`)
				return
			}

			await adicionarLog(jobId, `[DEBUG] Processando batch ${batchIndex + 1}/${batches.length} com ${batch.length} produtos EM PARALELO`)
			
			// Log no console para debug
			console.log(`[PARALLEL] Iniciando processamento paralelo de ${batch.length} produtos`)
			const batchStartTime = Date.now()

			// Processar produtos do batch em paralelo (todos ao mesmo tempo)
			const batchResults = await Promise.all(
				batch.map(async (produto, idx) => {
					console.log(`[PARALLEL] Thread ${idx + 1}/${batch.length}: Iniciando ${produto.name}`)
					if (!produto.barcode) return { encontrou: false, precosEncontrados: [], debugLogs: [] }

					const result = await processarProduto(
						produto,
						mercados,
						NOTA_PARANA_BASE_URL,
						CATEGORIAS_BUSCA,
						LOCAL_PADRAO,
						RAIO_PADRAO,
						PERIODO_PADRAO,
					)
					console.log(`[PARALLEL] Thread ${idx + 1}/${batch.length}: Concluído ${produto.name}`)
					return result
				}),
			)
			
			const batchElapsed = Date.now() - batchStartTime
			console.log(`[PARALLEL] Batch ${batchIndex + 1} concluído em ${batchElapsed}ms (${batch.length} produtos em paralelo)`)
			await adicionarLog(jobId, `[DEBUG] Batch ${batchIndex + 1} processado em ${(batchElapsed / 1000).toFixed(1)}s`)

			// Consolidar resultados do batch
			const logsParaAdicionar: string[] = []
			const logsDebugParaAdicionar: string[] = []
			
			for (let i = 0; i < batch.length; i++) {
				const produto = batch[i]
				const result = batchResults[i]

				// Separar logs de debug dos logs normais
				if (result.debugLogs && result.debugLogs.length > 0) {
					// Filtrar apenas alguns logs de debug importantes (reduzir volume)
					const logsDebugImportantes = result.debugLogs.filter((log) => 
						log.includes("✓ Match encontrado") || 
						log.includes("✗ Nenhum mercado") ||
						log.includes("Match Score") ||
						log.includes("Novo preço!") ||
						log.includes("Preço atualizado!")
					)
					logsDebugParaAdicionar.push(...logsDebugImportantes)
				}

				if (result.encontrou) {
					logsParaAdicionar.push(`✓ ${produto.name} processado`)

					// Registrar preços encontrados
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

							logsParaAdicionar.push(
								`Preço registrado: ${produto.name} em ${precoInfo.mercadoNome} - R$ ${precoInfo.preco.toFixed(2)}`,
							)
						}
					}
				} else if (produto.barcode) {
					// Produto não encontrado
					produtosNaoEncontrados.push({
						id: produto.id,
						nome: produto.name,
						barcode: produto.barcode,
					})
					logsParaAdicionar.push(`⚠ ${produto.name} não encontrado na API`)
				}

				produtosProcessados++
			}
			
			// Adicionar todos os logs (normais + debug importantes) de uma vez
			const todosLogs = [...logsParaAdicionar, ...logsDebugParaAdicionar]
			if (todosLogs.length > 0) {
				await adicionarLogsEmLote(jobId, todosLogs)
			}

			// Calcular tempo estimado
			const elapsed = Date.now() - startTime
			const avgTimePerProduct = elapsed / produtosProcessados
			const remaining = produtos.length - produtosProcessados
			const estimatedTimeRemaining = Math.round((avgTimePerProduct * remaining) / 1000)

			// Atualizar progresso após cada batch
			const progresso = Math.floor(5 + (produtosProcessados / produtos.length) * 90)
			
			// Buscar detalhes atuais para fazer merge
			const currentJob = await prisma.syncJob.findUnique({
				where: { id: jobId },
				select: { detalhes: true },
			})
			
			const detalhesAtualizados = {
				...(typeof currentJob?.detalhes === 'object' && currentJob?.detalhes !== null ? currentJob.detalhes : {}),
				estimativaSegundos: estimatedTimeRemaining,
				produtosProcessadosAtual: produtosProcessados,
				produtosTotal: produtos.length,
				quantidadeProdutosNaoEncontrados: produtosNaoEncontrados.length,
				mercados: detalhes,
				produtosNaoEncontrados: produtosNaoEncontrados,
				batchAtual: batchIndex + 1,
				totalBatches: batches.length,
				produtosPorBatch: BATCH_SIZE,
			}
			
			await prisma.syncJob.update({
				where: { id: jobId },
				data: {
					progresso,
					precosRegistrados,
					detalhes: detalhesAtualizados,
				},
			})

			// Delay entre batches (não mais entre cada produto)
			if (batchIndex < batches.length - 1) {
				await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
			}
		}

		// Finalizar - buscar detalhes atuais para preservar dados
		const finalJob = await prisma.syncJob.findUnique({
			where: { id: jobId },
			select: { detalhes: true },
		})
		
		const detalhesFinal = {
			...(typeof finalJob?.detalhes === 'object' && finalJob?.detalhes !== null ? finalJob.detalhes : {}),
			mercados: detalhes,
			produtosNaoEncontrados: produtosNaoEncontrados,
			produtosProcessadosAtual: produtos.length,
			produtosTotal: produtos.length,
			quantidadeProdutosNaoEncontrados: produtosNaoEncontrados.length,
			estatisticas: {
				produtosTotal: produtos.length,
				produtosEncontrados: produtos.length - produtosNaoEncontrados.length,
				produtosNaoEncontrados: produtosNaoEncontrados.length,
				precosRegistrados,
				tempoTotalSegundos: Math.round((Date.now() - startTime) / 1000),
			},
		}
		
		await prisma.syncJob.update({
			where: { id: jobId },
			data: {
				status: "completed",
				progresso: 100,
				precosRegistrados,
				detalhes: detalhesFinal,
				completedAt: new Date(),
			},
		})

		await adicionarLog(jobId, `[SERVER] Sincronização concluída com sucesso`)
		await adicionarLog(
			jobId,
			`[DEBUG] Resumo: ${precosRegistrados} preços registrados, ${produtosNaoEncontrados.length} produtos não encontrados em ${Math.round((Date.now() - startTime) / 1000)}s`,
		)
	} catch (err) {
		console.error("Erro ao processar job:", err)
		await prisma.syncJob.update({
			where: { id: jobId },
			data: {
				status: "failed",
				progresso: 100,
				completedAt: new Date(),
				erros: [err instanceof Error ? err.message : "Erro desconhecido"],
			},
		})
	}
}

// Função auxiliar para processar um produto individualmente
async function processarProduto(
	produto: { id: string; name: string; barcode: string | null },
	mercados: { id: string; name: string; legalName: string | null; location: string | null }[],
	NOTA_PARANA_BASE_URL: string,
	CATEGORIAS_BUSCA: readonly number[],
	LOCAL_PADRAO: string,
	RAIO_PADRAO: number,
	PERIODO_PADRAO: number,
) {
	if (!produto.barcode) {
		return { encontrou: false, precosEncontrados: [], debugLogs: [] }
	}

	const precosEncontrados: {
		mercadoId: string
		mercadoNome: string
		preco: number
		data: string
	}[] = []

	const debugLogs: string[] = []
	let encontrouProduto = false

	// Buscar em categorias
	for (const categoria of CATEGORIAS_BUSCA) {
		if (encontrouProduto) break

		try {
			const url = `${NOTA_PARANA_BASE_URL}/produtos?local=${LOCAL_PADRAO}&termo=${produto.barcode}&categoria=${categoria}&offset=0&raio=${RAIO_PADRAO}&data=${PERIODO_PADRAO}&ordem=0&gtin=${produto.barcode}`

			debugLogs.push(`[API] Buscando: ${produto.name} (EAN: ${produto.barcode})`)
			debugLogs.push(`[API] Categoria: ${categoria} | Raio: ${RAIO_PADRAO}m | Período: ${PERIODO_PADRAO} | Local: ${LOCAL_PADRAO}`)
			debugLogs.push(`[API] URL: ${url}`)

			const response = await fetch(url)
			if (!response.ok) {
				debugLogs.push(`[API] Resposta HTTP ${response.status} para categoria ${categoria}`)
				continue
			}

			const data = await response.json()
			if (!data.produtos || data.produtos.length === 0) {
				debugLogs.push(`[API] Nenhum produto encontrado na categoria ${categoria}`)
				continue
			}

			encontrouProduto = true
			debugLogs.push(`[API] ✓ Produto encontrado! ${data.produtos.length} estabelecimento(s) retornado(s)`)
			
			// Log de debug da API (será filtrado se debug mode estiver desligado)
			console.log(`[API] Produto encontrado: ${produto.name} - ${data.produtos.length} estabelecimentos`)

			// Processar estabelecimentos
			for (const produtoNP of data.produtos) {
				const nomeEstabelecimento = produtoNP.estabelecimento.nm_emp || produtoNP.estabelecimento.nm_fan
				const enderecoEstabelecimento = produtoNP.estabelecimento

				if (!nomeEstabelecimento) {
					debugLogs.push(`[DEBUG] Estabelecimento sem nome, pulando...`)
					continue
				}

				// Log dos dados do estabelecimento da API
				debugLogs.push(`[DEBUG] ─────────────────────────────────────`)
				debugLogs.push(`[DEBUG] Estabelecimento API: ${nomeEstabelecimento}`)
				debugLogs.push(`[DEBUG] Endereço API: ${enderecoEstabelecimento.nm_logr || "N/A"}, ${enderecoEstabelecimento.nr_logr || "S/N"} - ${enderecoEstabelecimento.bairro || "N/A"}`)
				debugLogs.push(`[DEBUG] Preço API: R$ ${(parseFloat(produtoNP.valor_tabela) - parseFloat(produtoNP.valor_desconto)).toFixed(2)}`)
				debugLogs.push(`[DEBUG] Data API: ${produtoNP.datahora} (${produtoNP.tempo})`)

				// Encontrar mercado correspondente com logs detalhados
				let melhorMatch: {
					mercado: { id: string; name: string; legalName: string | null; location: string | null }
					score: number
					detalhes: string
				} | null = null

				// Função para normalizar nome (remove /  .  e outros caracteres especiais)
				const normalizarNome = (nome: string) => {
					return nome
						.toLowerCase()
						.replace(/\//g, "") // Remove /
						.replace(/\./g, "") // Remove .
						.replace(/-/g, " ") // Substitui - por espaço
						.replace(/\s+/g, " ") // Remove espaços extras
						.trim()
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

					// Calcular score do match
					const score = matchesNome + matchesEndereco
					const detalhes = `Nome: ${matchesNome} matches [${palavrasMatched.join(", ")}] | Endereço: ${matchesEndereco} matches [${enderecoMatches.join(", ")}]`

					if (!melhorMatch || score > melhorMatch.score) {
						melhorMatch = { mercado: m, score, detalhes }
					}
				}

				if (!melhorMatch) {
					debugLogs.push(`[DEBUG] ✗ Nenhum mercado correspondente encontrado`)
					continue
				}

				const mercadoMatch = melhorMatch.mercado
				debugLogs.push(`[DEBUG] ✓ Match encontrado: ${mercadoMatch.name}`)
				debugLogs.push(`[DEBUG] Match Score: ${melhorMatch.score} | ${melhorMatch.detalhes}`)
				debugLogs.push(`[DEBUG] Mercado DB: ${mercadoMatch.legalName} - ${mercadoMatch.location || "Sem endereço"}`)

				// Calcular preço
				const preco = parseFloat(produtoNP.valor_tabela) - parseFloat(produtoNP.valor_desconto)
				if (preco <= 0) {
					debugLogs.push(`[DEBUG] Preço inválido (≤ 0), pulando...`)
					continue
				}

				// Verificar se já existe registro recente
				const dataLimite = new Date()
				dataLimite.setHours(dataLimite.getHours() - 24)

				const registroExistente = await prisma.priceRecord.findFirst({
					where: {
						productId: produto.id,
						marketId: mercadoMatch.id,
						recordDate: { gte: dataLimite },
					},
				})

				// Formatar data/hora da API para exibição
				const dataAPI = new Date(produtoNP.datahora)
				const dataFormatada = dataAPI.toLocaleString("pt-BR", {
					day: "2-digit",
					month: "2-digit",
					year: "numeric",
					hour: "2-digit",
					minute: "2-digit",
				})

				// Registrar preço se não existe ou mudou significativamente
				if (!registroExistente) {
					debugLogs.push(`[DEBUG] Novo preço! Registrando R$ ${preco.toFixed(2)} (Data API: ${dataFormatada})`)
					await prisma.priceRecord.create({
						data: {
							productId: produto.id,
							marketId: mercadoMatch.id,
							price: preco,
							recordDate: dataAPI, // Usa a data/hora da API
							notes: `Sincronizado - Nota Paraná em ${dataFormatada}`,
						},
					})

					precosEncontrados.push({
						mercadoId: mercadoMatch.id,
						mercadoNome: mercadoMatch.name,
						preco: preco,
						data: produtoNP.datahora,
					})
				} else if (Math.abs(registroExistente.price - preco) > 0.01) {
					debugLogs.push(`[DEBUG] Preço atualizado! De R$ ${registroExistente.price.toFixed(2)} para R$ ${preco.toFixed(2)} (Data API: ${dataFormatada})`)
					await prisma.priceRecord.create({
						data: {
							productId: produto.id,
							marketId: mercadoMatch.id,
							price: preco,
							recordDate: dataAPI, // Usa a data/hora da API
							notes: `Sincronizado - Nota Paraná em ${dataFormatada}`,
						},
					})

					precosEncontrados.push({
						mercadoId: mercadoMatch.id,
						mercadoNome: mercadoMatch.name,
						preco: preco,
						data: produtoNP.datahora,
					})
				} else {
					debugLogs.push(`[DEBUG] Preço já registrado recentemente (R$ ${preco.toFixed(2)}), pulando...`)
				}
			}
		} catch (error) {
			// Ignorar erros individuais para não parar o processamento
			debugLogs.push(`[DEBUG] ✗ Erro ao processar: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
			console.error(`Erro ao processar produto ${produto.name}:`, error)
		}
	}

	return {
		encontrou: encontrouProduto,
		precosEncontrados,
		debugLogs,
	}
}

async function adicionarLog(jobId: string, mensagem: string) {
	const job = await prisma.syncJob.findUnique({
		where: { id: jobId },
		select: { logs: true },
	})

	const logsAtuais = (job?.logs as string[]) || []
	const timestamp = new Date().toISOString().split("T")[1].substring(0, 8) // Apenas HH:mm:ss
	
	// Truncar mensagem se muito longa
	const mensagemTruncada = mensagem.length > MAX_LOG_LENGTH 
		? `${mensagem.substring(0, MAX_LOG_LENGTH)}...` 
		: mensagem
	
	// Manter apenas os últimos MAX_LOGS logs (circular buffer)
	const novosLogs = [...logsAtuais, `[${timestamp}] ${mensagemTruncada}`]
	const logsFinais = novosLogs.length > MAX_LOGS 
		? novosLogs.slice(-MAX_LOGS) 
		: novosLogs

	await prisma.syncJob.update({
		where: { id: jobId },
		data: {
			logs: logsFinais,
		},
	})
}

// Adicionar múltiplos logs de uma vez (mais eficiente para batches)
async function adicionarLogsEmLote(jobId: string, mensagens: string[]) {
	const job = await prisma.syncJob.findUnique({
		where: { id: jobId },
		select: { logs: true },
	})

	const logsAtuais = (job?.logs as string[]) || []
	const timestamp = new Date().toISOString().split("T")[1].substring(0, 8) // Apenas HH:mm:ss
	
	// Truncar mensagens longas
	const novosLogs = mensagens.map((msg) => {
		const mensagemTruncada = msg.length > MAX_LOG_LENGTH 
			? `${msg.substring(0, MAX_LOG_LENGTH)}...` 
			: msg
		return `[${timestamp}] ${mensagemTruncada}`
	})
	
	// Manter apenas os últimos MAX_LOGS logs (circular buffer)
	const logsCompletos = [...logsAtuais, ...novosLogs]
	const logsFinais = logsCompletos.length > MAX_LOGS 
		? logsCompletos.slice(-MAX_LOGS) 
		: logsCompletos

	await prisma.syncJob.update({
		where: { id: jobId },
		data: {
			logs: logsFinais,
		},
	})
}
