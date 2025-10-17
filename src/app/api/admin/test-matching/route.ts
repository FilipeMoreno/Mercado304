// src/app/api/admin/test-matching/route.ts
// Endpoint para testar o matching de mercados antes de sincronizar

import { NextResponse } from "next/server"
import {
	CATEGORIAS_BUSCA,
	LOCAL_PADRAO,
	NOTA_PARANA_BASE_URL,
	PERIODO_PADRAO,
	RAIO_PADRAO,
} from "@/lib/nota-parana-config"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
	try {
		const { barcode } = await request.json()

		if (!barcode) {
			return NextResponse.json({ error: "Código de barras é obrigatório" }, { status: 400 })
		}

		// Buscar mercados com razão social
		const mercados = await prisma.market.findMany({
			where: {
				legalName: {
					not: null,
				},
			},
		})

		// Buscar na API do Nota Paraná
		const resultados = []

		for (const categoria of CATEGORIAS_BUSCA) {
			try {
				const url = `${NOTA_PARANA_BASE_URL}/produtos?local=${LOCAL_PADRAO}&termo=${barcode}&categoria=${categoria}&offset=0&raio=${RAIO_PADRAO}&data=${PERIODO_PADRAO}&ordem=0&gtin=${barcode}`

				const response = await fetch(url)
				if (!response.ok) continue

				const data = await response.json()
				if (!data.produtos || data.produtos.length === 0) continue

				// Para cada produto encontrado
				for (const produtoNP of data.produtos) {
					const nomeEst = produtoNP.estabelecimento.nm_emp || produtoNP.estabelecimento.nm_fan
					const enderecoAPI = produtoNP.estabelecimento

					// Tentar fazer match
					for (const mercado of mercados) {
						const matchResult = {
							mercadoCadastrado: mercado.name,
							razaoSocialCadastrada: mercado.legalName,
							enderecoCadastrado: mercado.location,
							estabelecimentoAPI: nomeEst,
							enderecoAPI: `${enderecoAPI.tp_logr} ${enderecoAPI.nm_logr}, ${enderecoAPI.nr_logr} - ${enderecoAPI.bairro}`,
							matchNome: false,
							matchEndereco: false,
							detalhesMatch: {
								palavrasMatch: [] as string[],
								totalMatchesNome: 0,
								temRua: false,
								temNumero: false,
								temBairro: false,
								totalMatchesEndereco: 0,
							},
						}

						// Match de nome
						const palavrasMercado = (mercado.legalName || "").toLowerCase().split(" ")
						const palavrasEstabelecimento = nomeEst.toLowerCase().split(" ")

						let matchesNome = 0
						const palavrasMatch: string[] = []
						for (const palavra of palavrasMercado) {
							if (palavra.length > 3 && palavrasEstabelecimento.some((p: string) => p.includes(palavra))) {
								matchesNome++
								palavrasMatch.push(palavra)
							}
						}

						matchResult.matchNome = matchesNome >= 2
						matchResult.detalhesMatch.palavrasMatch = palavrasMatch
						matchResult.detalhesMatch.totalMatchesNome = matchesNome

						// Match de endereço
						if (mercado.location) {
							const enderecoMercado = mercado.location.toLowerCase()
							const ruaAPI = enderecoAPI.nm_logr?.toLowerCase() || ""
							const numeroAPI = enderecoAPI.nr_logr || ""
							const bairroAPI = enderecoAPI.bairro?.toLowerCase() || ""

							const temRua = ruaAPI && enderecoMercado.includes(ruaAPI)
							const temNumero = numeroAPI && enderecoMercado.includes(numeroAPI)
							const temBairro = bairroAPI && enderecoMercado.includes(bairroAPI)

							const matchesEndereco = [temRua, temNumero, temBairro].filter(Boolean).length

							matchResult.matchEndereco = matchesEndereco >= 2
							matchResult.detalhesMatch.temRua = temRua
							matchResult.detalhesMatch.temNumero = temNumero
							matchResult.detalhesMatch.temBairro = temBairro
							matchResult.detalhesMatch.totalMatchesEndereco = matchesEndereco
						}

						// Resultado final
						const wouldMatch = matchResult.matchNome && (mercado.location ? matchResult.matchEndereco : true)

						if (wouldMatch || matchResult.matchNome) {
							resultados.push({
								...matchResult,
								wouldMatch,
								preco: `R$ ${(parseFloat(produtoNP.valor_tabela) - parseFloat(produtoNP.valor_desconto)).toFixed(2)}`,
							})
						}
					}
				}

				break // Encontrou produtos, não precisa buscar em outras categorias
			} catch {}
		}

		return NextResponse.json({
			barcode,
			resultados,
			totalMercados: mercados.length,
		})
	} catch (error) {
		console.error("Erro ao testar matching:", error)
		return NextResponse.json({ error: "Erro ao testar matching" }, { status: 500 })
	}
}
