// src/app/api/shopping-lists/[id]/optimize-route-with-distances/route.ts

import { GoogleGenerativeAI } from "@google/generative-ai"
import { PrismaClient } from "@prisma/client"
import { type NextRequest, NextResponse } from "next/server"

const prisma = new PrismaClient()

interface OptimizedMarket {
	marketId: string
	marketName: string
	marketLocation?: string | null
	items: Array<{
		itemId: string
		productId: string
		productName: string
		quantity: number
		bestPrice: number
		estimatedTotal: number
		averagePrice?: number
		savings?: number
	}>
	totalCost: number
	estimatedSavings: number
	itemCount: number
	distanceKm?: number
	durationMinutes?: number
	order?: number
}

interface RouteWithDistances {
	listName: string
	optimizedRoute: OptimizedMarket[]
	totalEstimatedSavings: number
	totalDistanceKm: number
	totalDurationMinutes: number
	aiAnalysis: {
		worthIt: boolean
		summary: string
		factors: {
			totalSavings: number
			estimatedFuelCost: number
			estimatedTimeCost: number
			netBenefit: number
		}
		recommendation: string
	}
	summary: {
		totalMarkets: number
		totalItems: number
		itemsDistributed: number
	}
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		const listId = params.id
		const { userAddress, selectedMarketIds } = await request.json()

		if (!userAddress) {
			return NextResponse.json({ error: "Endereço do usuário é obrigatório" }, { status: 400 })
		}

		// Buscar a lista com itens
		const shoppingList = await prisma.shoppingList.findUnique({
			where: { id: listId },
			include: {
				items: {
					include: {
						product: {
							include: {
								priceRecords: {
									include: {
										market: true,
									},
									orderBy: {
										recordDate: "desc",
									},
								},
							},
						},
					},
				},
			},
		})

		if (!shoppingList) {
			return NextResponse.json({ error: "Lista de compras não encontrada" }, { status: 404 })
		}

		// Buscar mercados selecionados
		const markets = await prisma.market.findMany({
			where: {
				id: {
					in: selectedMarketIds,
				},
			},
		})

		if (markets.length === 0) {
			return NextResponse.json({ error: "Nenhum mercado selecionado" }, { status: 400 })
		}

		// Calcular distâncias e durações
		const marketsWithDistances = await calculateDistances(userAddress, markets)

		// Otimizar rota (ordenar por distância crescente)
		const sortedMarkets = marketsWithDistances.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0))

		// Distribuir itens nos mercados já ordenados
		const optimizedRoute = distributeItemsToMarkets(shoppingList.items, sortedMarkets)

		// Calcular totais
		const totalDistanceKm = optimizedRoute.reduce((sum, m) => sum + (m.distanceKm || 0), 0)
		const totalDurationMinutes = optimizedRoute.reduce((sum, m) => sum + (m.durationMinutes || 0), 0)
		const totalSavings = optimizedRoute.reduce((sum, m) => sum + m.estimatedSavings, 0)

		// Análise de IA com Gemini
		const aiAnalysis = await generateAIAnalysis({
			totalSavings,
			totalDistanceKm,
			totalDurationMinutes,
			totalMarkets: optimizedRoute.length,
		})

		const response: RouteWithDistances = {
			listName: shoppingList.name,
			optimizedRoute,
			totalEstimatedSavings: totalSavings,
			totalDistanceKm,
			totalDurationMinutes,
			aiAnalysis,
			summary: {
				totalMarkets: optimizedRoute.length,
				totalItems: shoppingList.items.length,
				itemsDistributed: optimizedRoute.reduce((sum, m) => sum + m.items.length, 0),
			},
		}

		return NextResponse.json(response)
	} catch (error) {
		console.error("Erro ao calcular rota com distâncias:", error)
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
	}
}

async function calculateDistances(
	origin: string,
	markets: Array<{ id: string; name: string; location?: string | null }>,
): Promise<
	Array<{ id: string; name: string; location?: string | null; distanceKm: number; durationMinutes: number }>
> {
	const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY

	if (!googleMapsApiKey) {
		console.warn("Google Maps API Key não configurada, usando distâncias estimadas")
		// Fallback: retornar distâncias aleatórias para teste
		return markets.map((market) => ({
			...market,
			distanceKm: Math.random() * 10 + 1, // 1-11 km
			durationMinutes: Math.random() * 20 + 5, // 5-25 min
		}))
	}

	try {
		// Calcular distância para cada mercado individualmente usando Routes API
		const results = await Promise.all(
			markets.map(async (market) => {
				try {
					const destination = market.location || market.name

					// Usar Routes API (Compute Routes) - nova API do Google Maps
					const url = `https://routes.googleapis.com/directions/v2:computeRoutes`

					const requestBody = {
						origin: {
							address: origin,
						},
						destination: {
							address: destination,
						},
						travelMode: "DRIVE",
						routingPreference: "TRAFFIC_AWARE",
						computeAlternativeRoutes: false,
						languageCode: "pt-BR",
						units: "METRIC",
					}

					const response = await fetch(url, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							"X-Goog-Api-Key": googleMapsApiKey,
							"X-Goog-FieldMask": "routes.distanceMeters,routes.duration",
						},
						body: JSON.stringify(requestBody),
					})

					if (!response.ok) {
						const errorData = await response.json()
						console.error(`Erro ao calcular rota para ${market.name}:`, errorData)
						// Fallback para este mercado específico
						return {
							...market,
							distanceKm: 5,
							durationMinutes: 15,
						}
					}

					const data = await response.json()

					if (data.routes && data.routes.length > 0) {
						const route = data.routes[0]
						const distanceMeters = route.distanceMeters || 5000
						const durationSeconds = route.duration
							? Number.parseInt(route.duration.replace("s", ""), 10)
							: 900

						return {
							...market,
							distanceKm: distanceMeters / 1000,
							durationMinutes: durationSeconds / 60,
						}
					} else {
						// Nenhuma rota encontrada
						console.warn(`Nenhuma rota encontrada para ${market.name}`)
						return {
							...market,
							distanceKm: 5,
							durationMinutes: 15,
						}
					}
				} catch (marketError) {
					console.error(`Erro ao processar mercado ${market.name}:`, marketError)
					return {
						...market,
						distanceKm: 5,
						durationMinutes: 15,
					}
				}
			}),
		)

		return results
	} catch (error) {
		console.error("Erro ao calcular distâncias:", error)
		// Fallback em caso de erro geral
		return markets.map((market) => ({
			...market,
			distanceKm: Math.random() * 10 + 1,
			durationMinutes: Math.random() * 20 + 5,
		}))
	}
}

interface ShoppingListItem {
	id: string
	quantity: number
	product?: {
		id: string
		name: string
		priceRecords: Array<{
			price: number
			market: {
				id: string
			}
		}>
	} | null
}

function distributeItemsToMarkets(
	items: ShoppingListItem[],
	markets: Array<{ id: string; name: string; location?: string | null; distanceKm: number; durationMinutes: number }>,
): OptimizedMarket[] {
	const marketItems: { [marketId: string]: OptimizedMarket } = {}

	// Inicializar estrutura dos mercados
	markets.forEach((market, index) => {
		marketItems[market.id] = {
			marketId: market.id,
			marketName: market.name,
			marketLocation: market.location,
			items: [],
			totalCost: 0,
			estimatedSavings: 0,
			itemCount: 0,
			distanceKm: market.distanceKm,
			durationMinutes: market.durationMinutes,
			order: index + 1,
		}
	})

	// Para cada item, encontrar o melhor mercado (entre os selecionados)
	items.forEach((item) => {
		if (!item.product || !item.product.priceRecords.length) {
			return
		}

		// Calcular preço médio mais recente por mercado (apenas mercados selecionados)
		const marketPrices: { [marketId: string]: { price: number; recordCount: number } } = {}

		item.product.priceRecords.forEach((record: { price: number; market: { id: string } }) => {
			const marketId = record.market.id
			// Apenas considerar mercados que estão na lista selecionada
			if (!marketItems[marketId]) return

			if (!marketPrices[marketId]) {
				marketPrices[marketId] = { price: 0, recordCount: 0 }
			}
			marketPrices[marketId].price += record.price
			marketPrices[marketId].recordCount += 1
		})

		// Calcular preços médios
		Object.keys(marketPrices).forEach((marketId) => {
			marketPrices[marketId].price = marketPrices[marketId].price / marketPrices[marketId].recordCount
		})

		// Encontrar o mercado com o menor preço
		let bestMarketId: string | null = null
		let bestPrice = Infinity
		let averagePrice = 0
		let priceCount = 0

		Object.entries(marketPrices).forEach(([marketId, data]) => {
			averagePrice += data.price
			priceCount += 1

			if (data.price < bestPrice) {
				bestPrice = data.price
				bestMarketId = marketId
			}
		})

		averagePrice = priceCount > 0 ? averagePrice / priceCount : 0

		if (bestMarketId && marketItems[bestMarketId]) {
			const estimatedTotal = item.quantity * bestPrice
			const savings = averagePrice > 0 ? (averagePrice - bestPrice) * item.quantity : 0

			marketItems[bestMarketId].items.push({
				itemId: item.id,
				productId: item.product.id,
				productName: item.product.name,
				quantity: item.quantity,
				bestPrice,
				estimatedTotal,
				averagePrice,
				savings,
			})

			marketItems[bestMarketId].totalCost += estimatedTotal
			marketItems[bestMarketId].estimatedSavings += savings
			marketItems[bestMarketId].itemCount += 1
		}
	})

	// Filtrar apenas mercados com itens
	return Object.values(marketItems).filter((market) => market.items.length > 0)
}

async function generateAIAnalysis(data: {
	totalSavings: number
	totalDistanceKm: number
	totalDurationMinutes: number
	totalMarkets: number
}) {
	const apiKey = process.env.GEMINI_API_KEY

	if (!apiKey) {
		// Fallback sem IA
		const estimatedFuelCost = (data.totalDistanceKm / 10) * 5.5 // Consumo 10km/L, R$ 5.50/L
		const estimatedTimeCost = (data.totalDurationMinutes / 60) * 30 // R$ 30/hora
		const netBenefit = data.totalSavings - estimatedFuelCost - estimatedTimeCost

		return {
			worthIt: netBenefit > 0,
			summary: netBenefit > 0 
				? "Vale a pena! A economia em produtos supera os custos de deslocamento."
				: "Não compensa. Os custos de deslocamento são maiores que a economia.",
			factors: {
				totalSavings: data.totalSavings,
				estimatedFuelCost,
				estimatedTimeCost,
				netBenefit,
			},
			recommendation: netBenefit > 0
				? "Recomendamos seguir este roteiro para maximizar sua economia."
				: "Considere comprar tudo em um único mercado mais próximo para economizar tempo e combustível.",
		}
	}

	try {
		const genAI = new GoogleGenerativeAI(apiKey)
		const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

		// Cálculos estimados
		const estimatedFuelCost = (data.totalDistanceKm / 10) * 5.5 // Consumo 10km/L, R$ 5.50/L
		const estimatedTimeCost = (data.totalDurationMinutes / 60) * 30 // R$ 30/hora
		const netBenefit = data.totalSavings - estimatedFuelCost - estimatedTimeCost

		const prompt = `
Você é um assistente de compras inteligente. Analise o seguinte roteiro de compras e forneça uma recomendação sobre se vale a pena ou não:

**Dados do Roteiro:**
- Economia total em produtos: R$ ${data.totalSavings.toFixed(2)}
- Distância total a percorrer: ${data.totalDistanceKm.toFixed(1)} km
- Tempo estimado de deslocamento: ${Math.round(data.totalDurationMinutes)} minutos
- Número de mercados: ${data.totalMarkets}

**Custos Estimados:**
- Combustível (10km/L a R$ 5,50/L): R$ ${estimatedFuelCost.toFixed(2)}
- Valor do tempo (R$ 30/hora): R$ ${estimatedTimeCost.toFixed(2)}

**Benefício Líquido:** R$ ${netBenefit.toFixed(2)}

Forneça sua resposta APENAS no seguinte formato JSON (sem markdown, sem \`\`\`json):
{
  "worthIt": true ou false,
  "summary": "Uma frase curta resumindo se vale a pena ou não",
  "recommendation": "Uma recomendação prática e amigável de 1-2 frases sobre o que o usuário deve fazer"
}
`

		const result = await model.generateContent(prompt)
		const responseText = result.response.text().trim()
		
		// Remover markdown se presente
		const cleanedText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
		
		const aiResponse = JSON.parse(cleanedText)

		return {
			worthIt: aiResponse.worthIt,
			summary: aiResponse.summary,
			factors: {
				totalSavings: data.totalSavings,
				estimatedFuelCost,
				estimatedTimeCost,
				netBenefit,
			},
			recommendation: aiResponse.recommendation,
		}
	} catch (error) {
		console.error("Erro ao gerar análise de IA:", error)
		
		// Fallback sem IA
		const estimatedFuelCost = (data.totalDistanceKm / 10) * 5.5
		const estimatedTimeCost = (data.totalDurationMinutes / 60) * 30
		const netBenefit = data.totalSavings - estimatedFuelCost - estimatedTimeCost

		return {
			worthIt: netBenefit > 0,
			summary: netBenefit > 0
				? "Vale a pena! A economia em produtos supera os custos de deslocamento."
				: "Não compensa. Os custos de deslocamento são maiores que a economia.",
			factors: {
				totalSavings: data.totalSavings,
				estimatedFuelCost,
				estimatedTimeCost,
				netBenefit,
			},
			recommendation: netBenefit > 0
				? "Recomendamos seguir este roteiro para maximizar sua economia."
				: "Considere comprar tudo em um único mercado mais próximo para economizar tempo e combustível.",
		}
	}
}

