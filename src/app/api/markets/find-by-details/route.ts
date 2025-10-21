import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma as db } from "@/lib/prisma"

// Schema de validação (sem alteração)
const findMarketSchema = z.object({
	name: z.string().min(3, "O nome do mercado é muito curto."),
	address: z.string().optional(),
})

// Dicionário de aliases (sem alteração)
const marketNameAliases: { [key: string]: string } = {
	MUFFATO: "Muffato",
	IRMAOS: "Muffato",
	AMIGAO: "Amigão",
	"SUL AMERICANA": "Amigão",
	SULAMERICANA: "Amigão",
	CANCAO: "Amigão",
	CIDADE: "Amigão",
	ATACADAO: "Atacadão",
	ASSAI: "Assaí",
	SENDAS: "Assaí",
	ANGELONI: "Angeloni",
	"BOM DIA": "Bom Dia",
}

// Função para normalizar strings para comparação (remove acentos e deixa em minúsculas)
const normalizeString = (str: string | null | undefined) => {
	if (!str) return ""
	return str
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
}

export async function POST(request: Request) {
	try {
		if (!db) {
			throw new Error("A conexão com o banco de dados falhou.")
		}

		const body = await request.json()
		const validation = findMarketSchema.safeParse(body)

		if (!validation.success) {
			return NextResponse.json({ error: validation.error.format() }, { status: 400 })
		}

		const { name, address } = validation.data
		const nameUpperCase = name.toUpperCase()
		let searchTerm: string | null = null

		for (const key in marketNameAliases) {
			if (nameUpperCase.includes(key)) {
				searchTerm = marketNameAliases[key]
				break
			}
		}

		if (!searchTerm) {
			searchTerm = name.split(" ")[0]
		}

		console.log(`[MARKET_FIND_V2] Nome da Nota: "${name}". Termo de busca: "${searchTerm}"`)

		// --- LÓGICA DE BUSCA APRIMORADA ---

		// 1. Busca TODOS os mercados que correspondem ao nome
		const potentialMarkets = await db.market.findMany({
			where: {
				name: {
					contains: searchTerm,
					mode: "insensitive",
				},
			},
		})

		// 2. Analisa os resultados
		if (potentialMarkets.length === 0) {
			console.log(`[MARKET_FIND_V2] Nenhum mercado correspondente encontrado.`)
			return NextResponse.json(null)
		}

		if (potentialMarkets.length === 1) {
			const market = potentialMarkets[0]
			console.log(`[MARKET_FIND_V2] Encontrado 1 mercado correspondente: ${market.name} (ID: ${market.id})`)
			return NextResponse.json(market)
		}

		// 3. Se houver múltiplos mercados, usa o endereço para desambiguar
		if (potentialMarkets.length > 1 && address) {
			console.log(
				`[MARKET_FIND_V2] Múltiplos mercados encontrados (${potentialMarkets.length}). Usando endereço para desambiguar: "${address}"`,
			)

			const normalizedAddress = normalizeString(address)

			for (const market of potentialMarkets) {
				const normalizedLocation = normalizeString(market.location)
				// Verifica se a localização do mercado (ex: "catuai") existe no endereço da nota
				if (normalizedLocation && normalizedAddress.includes(normalizedLocation)) {
					return NextResponse.json(market)
				}
			}
		}

		// 4. Se a desambiguação falhar, retorna o primeiro como fallback
		const fallbackMarket = potentialMarkets[0]
		console.log(
			`[MARKET_FIND_V2] Desambiguação pelo endereço falhou. Retornando o primeiro mercado encontrado como fallback: ${fallbackMarket.name}`,
		)
		return NextResponse.json(fallbackMarket)
	} catch (error: any) {
		console.error("[MARKET_FIND_V2] Erro na execução da rota:", error)
		return NextResponse.json(
			{
				error: "Erro interno do servidor ao buscar mercado.",
				details: error.message,
			},
			{ status: 500 },
		)
	}
}
