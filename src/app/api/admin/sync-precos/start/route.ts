// src/app/api/admin/sync-precos/start/route.ts
// Inicia job de sincronização em background

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

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
			return NextResponse.json({
				error: "Já existe uma sincronização em andamento",
				jobId: jobRodando.id,
			}, { status: 409 })
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
		return NextResponse.json(
			{ error: "Erro ao iniciar sincronização" },
			{ status: 500 }
		)
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
				logs: ["Sincronização iniciada"],
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

		await adicionarLog(jobId, `${mercados.length} mercados com razão social encontrados`)

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

		await adicionarLog(jobId, `${produtos.length} produtos com código de barras encontrados`)

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
			},
		})

		// 3. Processar produtos
		let precosRegistrados = 0
		const detalhes: { mercado: string; produtos: number; precos: number }[] = []

		for (let i = 0; i < produtos.length; i++) {
			const produto = produtos[i]
			if (!produto.barcode) continue

			// Atualizar progresso
			const progresso = Math.floor(5 + ((i + 1) / produtos.length) * 90)
			await prisma.syncJob.update({
				where: { id: jobId },
				data: { progresso },
			})

			// Buscar em categorias
			let encontrouProduto = false

			for (const categoria of CATEGORIAS_BUSCA) {
				if (encontrouProduto) break

				try {
					const url = `${NOTA_PARANA_BASE_URL}/produtos?local=${LOCAL_PADRAO}&termo=${produto.barcode}&categoria=${categoria}&offset=0&raio=${RAIO_PADRAO}&data=${PERIODO_PADRAO}&ordem=0&gtin=${produto.barcode}`

					const response = await fetch(url)
					if (!response.ok) continue

					const data = await response.json()
					if (!data.produtos || data.produtos.length === 0) continue

					encontrouProduto = true

					// Processar estabelecimentos
					for (const produtoNP of data.produtos) {
						const nomeEstabelecimento = produtoNP.estabelecimento.nm_emp || produtoNP.estabelecimento.nm_fan
						const enderecoEstabelecimento = produtoNP.estabelecimento

						if (!nomeEstabelecimento) continue

						// Encontrar mercado
						const mercadoMatch = mercados.find((m) => {
							if (!m.legalName) return false

							const palavrasMercado = m.legalName.toLowerCase().split(" ")
							const palavrasEstabelecimento = nomeEstabelecimento.toLowerCase().split(" ")

							let matchesNome = 0
							for (const palavra of palavrasMercado) {
								if (palavra.length > 3 && palavrasEstabelecimento.some((p: string) => p.includes(palavra))) {
									matchesNome++
								}
							}

							if (matchesNome < 2) return false

							if (m.location) {
								const enderecoMercado = m.location.toLowerCase()
								const ruaAPI = enderecoEstabelecimento.nm_logr?.toLowerCase() || ""
								const numeroAPI = enderecoEstabelecimento.nr_logr || ""
								const bairroAPI = enderecoEstabelecimento.bairro?.toLowerCase() || ""

								const temRua = ruaAPI && enderecoMercado.includes(ruaAPI)
								const temNumero = numeroAPI && enderecoMercado.includes(numeroAPI)
								const temBairro = bairroAPI && enderecoMercado.includes(bairroAPI)

								const matchesEndereco = [temRua, temNumero, temBairro].filter(Boolean).length

								if (matchesEndereco < 2) return false
							}

							return true
						})

						if (!mercadoMatch) continue

						// Calcular e registrar preço
						const preco = parseFloat(produtoNP.valor_tabela) - parseFloat(produtoNP.valor_desconto)
						if (preco <= 0) continue

						const dataLimite = new Date()
						dataLimite.setHours(dataLimite.getHours() - 24)

						const registroExistente = await prisma.priceRecord.findFirst({
							where: {
								productId: produto.id,
								marketId: mercadoMatch.id,
								recordDate: { gte: dataLimite },
							},
						})

						if (!registroExistente || Math.abs(registroExistente.price - preco) > 0.01) {
							await prisma.priceRecord.create({
								data: {
									productId: produto.id,
									marketId: mercadoMatch.id,
									price: preco,
									recordDate: new Date(produtoNP.datahora),
									notes: `Sincronizado - Nota Paraná (${produtoNP.tempo})`,
								},
							})

							precosRegistrados++

							let detalhe = detalhes.find((d) => d.mercado === mercadoMatch.name)
							if (!detalhe) {
								detalhe = { mercado: mercadoMatch.name, produtos: 0, precos: 0 }
								detalhes.push(detalhe)
							}
							detalhe.produtos++
							detalhe.precos++

							await adicionarLog(jobId, `Preço registrado: ${produto.name} em ${mercadoMatch.name} - R$ ${preco.toFixed(2)}`)
						}
					}
				} catch {
					continue
				}
			}

			if (encontrouProduto) {
				await adicionarLog(jobId, `✓ ${produto.name} processado`)
			}

			// Delay entre produtos
			await new Promise((resolve) => setTimeout(resolve, 200))
		}

		// Finalizar
		await prisma.syncJob.update({
			where: { id: jobId },
			data: {
				status: "completed",
				progresso: 100,
				precosRegistrados,
				detalhes,
				completedAt: new Date(),
			},
		})

		await adicionarLog(jobId, `Sincronização concluída: ${precosRegistrados} preços registrados`)
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

async function adicionarLog(jobId: string, mensagem: string) {
	const job = await prisma.syncJob.findUnique({
		where: { id: jobId },
		select: { logs: true },
	})

	const logsAtuais = (job?.logs as string[]) || []
	const timestamp = new Date().toISOString()

	await prisma.syncJob.update({
		where: { id: jobId },
		data: {
			logs: [...logsAtuais, `[${timestamp}] ${mensagem}`],
		},
	})
}

