// src/app/api/nota-parana/produtos/route.ts

import { NextResponse } from "next/server"
import type { NotaParanaProdutosResponse } from "@/types"

const NOTA_PARANA_BASE_URL = "https://menorpreco.notaparana.pr.gov.br/api/v1"

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)
		const termo = searchParams.get("termo")
		const categoria = searchParams.get("categoria")
		const local = searchParams.get("local") || "6gg4dpecb" // Default: Maringá
		const raio = searchParams.get("raio") || "2" // Default: 2km
		const offset = searchParams.get("offset") || "0" // Paginação
		const ordem = searchParams.get("ordem") || "0" // 0: relevância, 1: menor preço, 2: maior desconto
		const data = searchParams.get("data") || "-1" // -1: todos os períodos

		if (!termo) {
			return NextResponse.json({ error: "O parâmetro 'termo' é obrigatório" }, { status: 400 })
		}

		if (!categoria) {
			return NextResponse.json({ error: "O parâmetro 'categoria' é obrigatório" }, { status: 400 })
		}

		// Detectar se é código de barras (somente números, geralmente 8, 12, 13 ou 14 dígitos)
		const isBarcode = /^\d{8,14}$/.test(termo.trim())

		// Fazer a requisição para a API do Nota Paraná
		let url = `${NOTA_PARANA_BASE_URL}/produtos?local=${encodeURIComponent(local)}&termo=${encodeURIComponent(termo)}&categoria=${categoria}&offset=${offset}&raio=${raio}&data=${data}&ordem=${ordem}`

		// Se for código de barras, adicionar parâmetro gtin
		if (isBarcode) {
			url += `&gtin=${termo.trim()}`
		}

		const response = await fetch(url, {
			method: "GET",
			headers: {
				Accept: "application/json",
			},
			// Cache por 5 minutos para evitar muitas requisições
			next: { revalidate: 300 },
		})

		if (!response.ok) {
			console.error("Erro ao buscar produtos do Nota Paraná:", response.statusText)
			return NextResponse.json({ error: "Erro ao buscar produtos do Nota Paraná" }, { status: response.status })
		}

		const responseData: NotaParanaProdutosResponse = await response.json()

		return NextResponse.json(responseData)
	} catch (error) {
		console.error("Erro ao buscar produtos do Nota Paraná:", error)
		return NextResponse.json({ error: "Erro interno ao buscar produtos" }, { status: 500 })
	}
}
