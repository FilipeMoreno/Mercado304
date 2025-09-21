import { prisma } from "@/lib/prisma"

export const analyticsFunctions = {
	// Analytics & Predictions
	getConsumptionPatterns: async () => {
		const response = await fetch(`${process.env.NEXTAUTH_URL}/api/predictions/consumption-patterns`)
		const data = await response.json()
		return { success: true, patterns: data }
	},

	getPriceHistory: async ({ productName, days = 30 }: any) => {
		const product = await prisma.product.findFirst({
			where: { name: { contains: productName, mode: "insensitive" } },
		})
		if (!product)
			return {
				success: false,
				message: `Produto "${productName}" não encontrado.`,
			}

		const startDate = new Date()
		startDate.setDate(startDate.getDate() - days)

		const history = await prisma.purchaseItem.findMany({
			where: {
				productId: product.id,
				purchase: { purchaseDate: { gte: startDate } },
			},
			include: { purchase: { include: { market: true } } },
			orderBy: { purchase: { purchaseDate: "desc" } },
		})

		return { success: true, product: product.name, history }
	},

	checkBestPrice: async ({ productName }: { productName: string }) => {
		const response = await fetch(`${process.env.NEXTAUTH_URL}/api/best-price-check`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ productName }),
		})
		const data = await response.json()
		return { success: true, bestPrice: data }
	},

	analyzeCostBenefit: async ({ products }: { products: Array<{ name: string, price: number, quantity: number, unit: string, market?: string }> }) => {
		try {
			// Normalizar todas as unidades para a mesma base
			const normalizeToStandardUnit = (quantity: number, unit: string) => {
				const unitLower = unit.toLowerCase()
				
				// Normalizar para mililitros (líquidos)
				if (unitLower.includes('l') || unitLower.includes('litro')) {
					return { value: quantity * 1000, standardUnit: 'ml' }
				}
				if (unitLower.includes('ml') || unitLower.includes('mililitro')) {
					return { value: quantity, standardUnit: 'ml' }
				}
				
				// Normalizar para gramas (sólidos)
				if (unitLower.includes('kg') || unitLower.includes('kilo')) {
					return { value: quantity * 1000, standardUnit: 'g' }
				}
				if (unitLower.includes('g') || unitLower.includes('grama')) {
					return { value: quantity, standardUnit: 'g' }
				}
				
				// Unidades
				if (unitLower.includes('unidade') || unitLower.includes('un') || unitLower.includes('pç')) {
					return { value: quantity, standardUnit: 'unidade' }
				}
				
				// Pacotes/caixas
				if (unitLower.includes('pacote') || unitLower.includes('caixa')) {
					return { value: quantity, standardUnit: 'pacote' }
				}
				
				// Fallback - assumir como unidade
				return { value: quantity, standardUnit: unit }
			}

			// Calcular custo-benefício para cada produto
			const analysis = products.map(product => {
				const normalized = normalizeToStandardUnit(product.quantity, product.unit)
				const pricePerUnit = product.price / normalized.value
				
				return {
					...product,
					normalizedQuantity: normalized.value,
					standardUnit: normalized.standardUnit,
					pricePerUnit: pricePerUnit,
					costBenefitScore: 1 / pricePerUnit // Quanto maior, melhor o custo-benefício
				}
			})

			// Verificar se todos os produtos têm a mesma unidade padrão
			const standardUnits = Array.from(new Set(analysis.map(p => p.standardUnit)))
			const canCompare = standardUnits.length === 1

			if (!canCompare) {
				return {
					success: true,
					canCompare: false,
					message: "⚠️ **Não é possível comparar diretamente** - produtos têm unidades de medida incompatíveis.",
					products: analysis.map(p => ({
						name: p.name,
						price: p.price,
						quantity: p.quantity,
						unit: p.unit,
						market: p.market,
						priceInfo: `R$ ${p.pricePerUnit.toFixed(4)} por ${p.standardUnit}`
					}))
				}
			}

			// Ordenar por melhor custo-benefício (menor preço por unidade)
			const sortedByBenefit = analysis.sort((a, b) => a.pricePerUnit - b.pricePerUnit)
			const bestOption = sortedByBenefit[0]
			const standardUnit = standardUnits[0]

			// Calcular economia
			const worstOption = sortedByBenefit[sortedByBenefit.length - 1]
			const savingsPercentage = ((worstOption.pricePerUnit - bestOption.pricePerUnit) / worstOption.pricePerUnit) * 100

			// Criar recomendação detalhada
			let recommendation = `🏆 **MELHOR OPÇÃO: ${bestOption.name}**\n\n`
			recommendation += `💰 **Preço por ${standardUnit}:** R$ ${bestOption.pricePerUnit.toFixed(4)}\n`
			if (bestOption.market) {
				recommendation += `🏪 **Mercado:** ${bestOption.market}\n`
			}
			recommendation += `💵 **Preço total:** R$ ${bestOption.price.toFixed(2)}\n\n`

			recommendation += `📊 **COMPARAÇÃO COMPLETA:**\n`
			sortedByBenefit.forEach((product, index) => {
				const position = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}º`
				const savings = index > 0 ? ` (+${(((product.pricePerUnit - bestOption.pricePerUnit) / bestOption.pricePerUnit) * 100).toFixed(1)}%)` : ""
				
				recommendation += `${position} **${product.name}**\n`
				recommendation += `   • R$ ${product.pricePerUnit.toFixed(4)} por ${standardUnit}${savings}\n`
				recommendation += `   • Preço: R$ ${product.price.toFixed(2)} (${product.quantity}${product.unit})\n`
				if (product.market) {
					recommendation += `   • Local: ${product.market}\n`
				}
				recommendation += `\n`
			})

			if (savingsPercentage > 0) {
				recommendation += `💡 **ECONOMIA:** Escolhendo a melhor opção, você economiza ${savingsPercentage.toFixed(1)}% por ${standardUnit}!`
			}

			return {
				success: true,
				canCompare: true,
				bestOption: bestOption.name,
				recommendation,
				analysis: sortedByBenefit,
				savings: savingsPercentage
			}

		} catch (error) {
			console.error("Erro na análise de custo-benefício:", error)
			return {
				success: false,
				message: "Erro ao calcular custo-benefício. Verifique os dados fornecidos."
			}
		}
	},
}
