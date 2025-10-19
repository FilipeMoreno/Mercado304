// src/app/api/admin/test-matching/route.ts
// Endpoint para testar o matching de mercados antes de sincronizar

import { NextResponse } from "next/server"
import {
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

		// Buscar TODOS os mercados cadastrados no sistema
		const mercados = await prisma.market.findMany({
			select: {
				id: true,
				name: true,
				legalName: true,
				location: true,
			},
		})

		// Buscar na API do Nota Paraná (sem filtro de categoria)
		const url = `${NOTA_PARANA_BASE_URL}/produtos?local=${LOCAL_PADRAO}&termo=${barcode}&offset=0&raio=${RAIO_PADRAO}&data=${PERIODO_PADRAO}&ordem=0&gtin=${barcode}`

		const response = await fetch(url)
		if (!response.ok) {
			return NextResponse.json({
				error: "Erro ao buscar na API do Nota Paraná",
				barcode,
				totalMercadosCadastrados: mercados.length,
			}, { status: response.status })
		}

		const data = await response.json()
		if (!data.produtos || data.produtos.length === 0) {
			return NextResponse.json({
				barcode,
				totalMercadosCadastrados: mercados.length,
				totalEstabelecimentosAPI: 0,
				resultados: [],
				mensagem: "Nenhum produto encontrado na API do Nota Paraná",
			})
		}

		// Agrupar produtos por categoria para identificar as top 3
		const produtosPorCategoria = new Map<number, typeof data.produtos>()
		
		for (const prod of data.produtos) {
			const categoria = prod.categoria || 0
			if (!produtosPorCategoria.has(categoria)) {
				produtosPorCategoria.set(categoria, [])
			}
			produtosPorCategoria.get(categoria)?.push(prod)
		}

		// Ordenar categorias por quantidade de produtos e pegar top 3
		const categoriasOrdenadas = Array.from(produtosPorCategoria.entries())
			.sort((a, b) => b[1].length - a[1].length)
			.slice(0, 3) // Top 3 categorias

		// Processar produtos das top 3 categorias
		const todosProdutos = categoriasOrdenadas.flatMap(([_, produtos]) => produtos)

		const resultados = []

		// Para cada estabelecimento da API, testar com TODOS os mercados cadastrados
		for (const produtoNP of todosProdutos) {
			const nomeEst = produtoNP.estabelecimento.nm_emp || produtoNP.estabelecimento.nm_fan
			const enderecoAPI = produtoNP.estabelecimento
			const categoria = produtoNP.categoria || 0

			if (!nomeEst) continue

			// Função para normalizar nome (mesma lógica do sync)
			const normalizarNome = (nome: string) => {
				return nome
					.toLowerCase()
					.replace(/\//g, "") // Remove /
					.replace(/\./g, "") // Remove .
					.replace(/-/g, " ") // Substitui - por espaço
					.replace(/\s+/g, " ") // Remove espaços extras
					.trim()
			}

			// Testar contra TODOS os mercados cadastrados
			for (const mercado of mercados) {
				const matchResult = {
					mercadoCadastrado: mercado.name,
					razaoSocialCadastrada: mercado.legalName || "Não informada",
					enderecoCadastrado: mercado.location || "Não informado",
					estabelecimentoAPI: nomeEst,
					enderecoAPI: `${enderecoAPI.tp_logr || ""} ${enderecoAPI.nm_logr || ""}, ${enderecoAPI.nr_logr || "S/N"} - ${enderecoAPI.bairro || ""}`,
					categoria: categoria,
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

				// Match de nome (mesma lógica do sync)
				if (mercado.legalName) {
					const nomeNormalizadoMercado = normalizarNome(mercado.legalName)
					const nomeNormalizadoEstabelecimento = normalizarNome(nomeEst)
					
					const palavrasMercado = nomeNormalizadoMercado.split(" ")
					const palavrasEstabelecimento = nomeNormalizadoEstabelecimento.split(" ")

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
				}

				// Match de endereço (mesma lógica do sync)
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

				// Resultado final (mesma lógica do sync)
				const wouldMatch = matchResult.matchNome && (mercado.location ? matchResult.matchEndereco : true)

				// Adicionar TODOS os resultados, não apenas matches
				resultados.push({
					...matchResult,
					wouldMatch,
					preco: `R$ ${(parseFloat(produtoNP.valor_tabela) - parseFloat(produtoNP.valor_desconto)).toFixed(2)}`,
					dataHora: produtoNP.datahora,
					tempo: produtoNP.tempo,
				})
			}
		}

		// Separar resultados em matches e não-matches
		const matches = resultados.filter(r => r.wouldMatch)
		const possiveisMatches = resultados.filter(r => !r.wouldMatch && r.matchNome)
		const semMatch = resultados.filter(r => !r.wouldMatch && !r.matchNome)

		return NextResponse.json({
			barcode,
			totalMercadosCadastrados: mercados.length,
			totalEstabelecimentosAPI: todosProdutos.length,
			categoriasEncontradas: Array.from(produtosPorCategoria.keys()),
			topCategorias: categoriasOrdenadas.map(([id, prods]) => ({
				categoria: id,
				quantidade: prods.length,
			})),
			estatisticas: {
				matches: matches.length,
				possiveisMatches: possiveisMatches.length,
				semMatch: semMatch.length,
				total: resultados.length,
			},
			resultados: {
				matches,
				possiveisMatches,
				semMatch,
			},
		})
	} catch (error) {
		console.error("Erro ao testar matching:", error)
		return NextResponse.json({ error: "Erro ao testar matching" }, { status: 500 })
	}
}
