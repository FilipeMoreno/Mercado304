// src/app/api/admin/sync-precos/route.ts

import { NextResponse } from "next/server"
import {
	CATEGORIAS_BUSCA,
	LOCAL_PADRAO,
	NOTA_PARANA_BASE_URL,
	PERIODO_PADRAO,
	RAIO_PADRAO,
} from "@/lib/nota-parana-config"
import { prisma } from "@/lib/prisma"

interface SyncResult {
	success: boolean
	mercadosProcessados: number
	produtosProcessados: number
	precosRegistrados: number
	erros: string[]
	detalhes: {
		mercado: string
		produtos: number
		precos: number
	}[]
}

export async function POST() {
	const result: SyncResult = {
		success: true,
		mercadosProcessados: 0,
		produtosProcessados: 0,
		precosRegistrados: 0,
		erros: [],
		detalhes: [],
	}

	try {
		// 1. Buscar mercados com razão social cadastrada
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

		if (mercados.length === 0) {
			return NextResponse.json({
				...result,
				erros: ["Nenhum mercado com razão social cadastrada encontrado"],
			})
		}

		// 2. Buscar produtos com código de barras
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

		if (produtos.length === 0) {
			return NextResponse.json({
				...result,
				erros: ["Nenhum produto com código de barras cadastrado encontrado"],
			})
		}

		result.mercadosProcessados = mercados.length
		result.produtosProcessados = produtos.length

		// 3. Para cada produto com código de barras, buscar preços
		for (const produto of produtos) {
			if (!produto.barcode) continue

			// Buscar produto em cada categoria até encontrar
			let encontrouProduto = false

			for (const categoria of CATEGORIAS_BUSCA) {
				if (encontrouProduto) break

				try {
					const url = `${NOTA_PARANA_BASE_URL}/produtos?local=${LOCAL_PADRAO}&termo=${produto.barcode}&categoria=${categoria}&offset=0&raio=${RAIO_PADRAO}&data=${PERIODO_PADRAO}&ordem=0&gtin=${produto.barcode}`

					const response = await fetch(url, {
						method: "GET",
						headers: {
							Accept: "application/json",
						},
					})

					if (!response.ok) continue

					const data = await response.json()

					if (!data.produtos || data.produtos.length === 0) continue

					encontrouProduto = true

					// Para cada estabelecimento encontrado
					for (const produtoNP of data.produtos) {
						const nomeEstabelecimento = produtoNP.estabelecimento.nm_emp || produtoNP.estabelecimento.nm_fan
						const enderecoEstabelecimento = produtoNP.estabelecimento

						if (!nomeEstabelecimento) continue

						// Tentar encontrar mercado correspondente
						const mercadoMatch = mercados.find((m) => {
							if (!m.legalName) return false

							// 1. Comparação por razão social
							const palavrasMercado = m.legalName.toLowerCase().split(" ")
							const palavrasEstabelecimento = nomeEstabelecimento.toLowerCase().split(" ")

							// Verifica se pelo menos 2 palavras significativas coincidem
							let matchesNome = 0
							for (const palavra of palavrasMercado) {
								if (palavra.length > 3 && palavrasEstabelecimento.some((p: string) => p.includes(palavra))) {
									matchesNome++
								}
							}

							// Se não tem match de nome, não é este mercado
							if (matchesNome < 2) return false

							// 2. Validação por endereço (se o mercado tiver endereço cadastrado)
							if (m.location) {
								const enderecoMercado = m.location.toLowerCase()
								const ruaAPI = enderecoEstabelecimento.nm_logr?.toLowerCase() || ""
								const numeroAPI = enderecoEstabelecimento.nr_logr || ""
								const bairroAPI = enderecoEstabelecimento.bairro?.toLowerCase() || ""

								// Verifica se rua, número ou bairro coincidem
								const temRua = ruaAPI && enderecoMercado.includes(ruaAPI)
								const temNumero = numeroAPI && enderecoMercado.includes(numeroAPI)
								const temBairro = bairroAPI && enderecoMercado.includes(bairroAPI)

								// Precisa ter pelo menos 2 matches de endereço
								const matchesEndereco = [temRua, temNumero, temBairro].filter(Boolean).length

								// Se tem endereço cadastrado, precisa ter match de endereço
								if (matchesEndereco < 2) return false
							}

							return true
						})

						if (!mercadoMatch) continue

						// Calcular preço final
						const preco = parseFloat(produtoNP.valor_tabela) - parseFloat(produtoNP.valor_desconto)

						if (preco <= 0) continue

						// Verificar se já existe registro recente (últimas 24h)
						const dataLimite = new Date()
						dataLimite.setHours(dataLimite.getHours() - 24)

						const registroExistente = await prisma.priceRecord.findFirst({
							where: {
								productId: produto.id,
								marketId: mercadoMatch.id,
								recordDate: {
									gte: dataLimite,
								},
							},
						})

						// Só registra se não existir ou se o preço for diferente
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

							result.precosRegistrados++

							// Atualizar detalhes do mercado
							let detalhe = result.detalhes.find((d) => d.mercado === mercadoMatch.name)
							if (!detalhe) {
								detalhe = { mercado: mercadoMatch.name, produtos: 0, precos: 0 }
								result.detalhes.push(detalhe)
							}
							detalhe.produtos++
							detalhe.precos++
						}
					}
				} catch {}
			}

			// Pequeno delay para não sobrecarregar a API
			await new Promise((resolve) => setTimeout(resolve, 200))
		}

		return NextResponse.json(result)
	} catch (error) {
		console.error("Erro ao sincronizar preços:", error)
		return NextResponse.json(
			{
				...result,
				success: false,
				erros: [error instanceof Error ? error.message : "Erro desconhecido"],
			},
			{ status: 500 },
		)
	}
}
