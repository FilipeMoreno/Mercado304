// src/app/api/nota-parana/categorias/route.ts

import { NextResponse } from "next/server"
import type { NotaParanaCategoriaResponse } from "@/types"

const NOTA_PARANA_BASE_URL = "https://menorpreco.notaparana.pr.gov.br/api/v1"

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)
		const termo = searchParams.get("termo")
		const local = searchParams.get("local") || "6gg4dpecb" // Default: Maringá
		const raio = searchParams.get("raio") || "20" // Default: 20km

		if (!termo) {
			return NextResponse.json(
				{ error: "O parâmetro 'termo' é obrigatório" },
				{ status: 400 }
			)
		}

		// Fazer a requisição para a API do Nota Paraná
		const url = `${NOTA_PARANA_BASE_URL}/categorias?local=${encodeURIComponent(local)}&termo=${encodeURIComponent(termo)}&raio=${raio}`
		
		const response = await fetch(url, {
			method: "GET",
			headers: {
				"Accept": "application/json",
			},
			// Cache por 5 minutos para evitar muitas requisições
			next: { revalidate: 300 }
		})

		if (!response.ok) {
			console.error("Erro ao buscar categorias do Nota Paraná:", response.statusText)
			return NextResponse.json(
				{ error: "Erro ao buscar categorias do Nota Paraná" },
				{ status: response.status }
			)
		}

		const data: NotaParanaCategoriaResponse = await response.json()

		return NextResponse.json(data)
	} catch (error) {
		console.error("Erro ao buscar categorias do Nota Paraná:", error)
		return NextResponse.json(
			{ error: "Erro interno ao buscar categorias" },
			{ status: 500 }
		)
	}
}

