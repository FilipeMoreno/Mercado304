/**
 * Funções de Kits/Combos para o Assistente de IA
 */

import { prisma } from "@/lib/prisma"
import * as productKitService from "@/services/productKitService"

/**
 * Listar todos os kits
 */
export async function listProductKits(args: { includeInactive?: boolean }) {
	try {
		const kits = await productKitService.listProductKits(args.includeInactive)

		if (!kits || kits.length === 0) {
			return {
				success: true,
				message:
					"Nenhum kit cadastrado ainda. Você pode criar um kit para combos promocionais que os mercados oferecem!",
				kits: [],
			}
		}

		const kitList = kits.map((kit) => ({
			id: kit.kitProductId,
			name: kit.kitProduct.name,
			description: kit.description,
			barcode: kit.barcode,
			brand: kit.brand?.name,
			category: kit.category?.name,
			isActive: kit.isActive,
			productCount: kit.items.length,
			products: kit.items.map((item) => ({
				name: item.product.name,
				quantity: item.quantity,
				brand: item.product.brand?.name,
			})),
		}))

		const message = `Encontrei ${kits.length} kit(s) cadastrado(s):\n\n${kitList
			.map((k, i) => {
				let kitInfo = `${i + 1}. **${k.name}** ${!k.isActive ? "(Inativo)" : ""}`
				if (k.brand) kitInfo += ` - ${k.brand}`
				kitInfo += `\n   ${k.description || "Sem descrição"}`
				if (k.category) kitInfo += `\n   Categoria: ${k.category}`
				if (k.barcode) kitInfo += `\n   Código: ${k.barcode}`
				kitInfo += `\n   Produtos: ${k.products.map((p) => `${p.quantity}x ${p.name}`).join(", ")}`
				return kitInfo
			})
			.join("\n\n")}`

		return {
			success: true,
			message,
			kits: kitList,
		}
	} catch (error) {
		return {
			success: false,
			message: `Erro ao listar kits: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
		}
	}
}

/**
 * Criar um novo kit/combo
 */
export async function createProductKit(args: {
	kitName: string
	description?: string
	barcode?: string
	brandName?: string
	categoryName?: string
	products: Array<{ productName: string; quantity: number }>
}) {
	try {
		const { kitName, description, barcode, brandName, categoryName, products } = args

		if (!kitName || !products || products.length === 0) {
			return {
				success: false,
				message: "Para criar um kit, preciso do nome e pelo menos um produto.",
			}
		}

		// Buscar ou criar marca se fornecida
		let brandId: string | undefined
		if (brandName) {
			let brand = await prisma.brand.findFirst({
				where: { name: { equals: brandName, mode: "insensitive" } },
			})
			if (!brand) {
				brand = await prisma.brand.create({
					data: { name: brandName },
				})
			}
			brandId = brand.id
		}

		// Buscar ou criar categoria se fornecida
		let categoryId: string | undefined
		if (categoryName) {
			let category = await prisma.category.findFirst({
				where: { name: { equals: categoryName, mode: "insensitive" } },
			})
			if (!category) {
				category = await prisma.category.create({
					data: { name: categoryName, icon: "📦", isFood: false },
				})
			}
			categoryId = category.id
		}

		// Buscar os produtos pelo nome
		const productPromises = products.map(async (p) => {
			const found = await prisma.product.findFirst({
				where: {
					name: { contains: p.productName, mode: "insensitive" },
					isKit: false, // Não incluir kits
				},
				select: { id: true, name: true },
			})
			return { ...p, foundProduct: found }
		})

		const productsData = await Promise.all(productPromises)

		// Verificar se todos os produtos foram encontrados
		const notFound = productsData.filter((p) => !p.foundProduct)
		if (notFound.length > 0) {
			return {
				success: false,
				message: `Não encontrei estes produtos: ${notFound
					.map((p) => p.productName)
					.join(", ")}. Cadastre-os primeiro ou verifique os nomes.`,
			}
		}

		// Criar o produto kit
		const kitProduct = await prisma.product.create({
			data: {
				name: kitName,
				unit: "kit",
				hasStock: false,
				isKit: true,
			},
		})

		// Criar o kit
		// Todos os produtos foram validados acima, então foundProduct está definido
		const kit = await productKitService.createProductKit({
			kitProductId: kitProduct.id,
			...(description ? { description } : {}),
			...(barcode ? { barcode } : {}),
			...(brandId ? { brandId } : {}),
			...(categoryId ? { categoryId } : {}),
			items: productsData.map((p) => ({
				productId: p.foundProduct?.id as string, // Safe: validated above that all products were found
				quantity: p.quantity,
			})),
		})

		const productsList = productsData.map((p) => `${p.quantity}x ${p.foundProduct?.name}`).join(", ")

		let message = `Kit "${kitName}" criado com sucesso! Produtos inclusos: ${productsList}.`
		if (description) message += ` Descrição: ${description}.`
		if (brandName) message += ` Marca: ${brandName}.`
		if (categoryName) message += ` Categoria: ${categoryName}.`
		if (barcode) message += ` Código de barras: ${barcode}.`

		return {
			success: true,
			message,
			kitId: kit.kitProductId,
			kitName: kitName,
		}
	} catch (error) {
		return {
			success: false,
			message: `Erro ao criar kit: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
		}
	}
}

/**
 * Ver detalhes de um kit
 */
export async function getProductKitDetails(args: { kitName: string }) {
	try {
		const { kitName } = args

		// Buscar o produto kit
		const kitProduct = await prisma.product.findFirst({
			where: {
				name: { contains: kitName, mode: "insensitive" },
				isKit: true,
			},
			select: { id: true },
		})

		if (!kitProduct) {
			return {
				success: false,
				message: `Kit "${kitName}" não encontrado. Use listProductKits para ver todos os kits disponíveis.`,
			}
		}

		const kit = await productKitService.getProductKitWithDetails(kitProduct.id)

		if (!kit) {
			return {
				success: false,
				message: "Kit não encontrado.",
			}
		}

		// Buscar informações adicionais
		const [nutrition, stock, price] = await Promise.all([
			productKitService.calculateKitNutritionalInfo(kitProduct.id).catch(() => null),
			productKitService.checkKitStockAvailability(kitProduct.id).catch(() => null),
			productKitService.calculateKitPrice(kitProduct.id).catch(() => null),
		])

		let message = `**${kit.kitProduct.name}**\n`
		if (kit.description) {
			message += `${kit.description}\n`
		}

		// Informações adicionais do kit
		if (kit.brand?.name) {
			message += `Marca: ${kit.brand.name}\n`
		}
		if (kit.category?.name) {
			message += `Categoria: ${kit.category.name}\n`
		}
		if (kit.barcode) {
			message += `Código de Barras: ${kit.barcode}\n`
		}
		message += "\n"

		message += `**Produtos inclusos (${kit.items.length}):**\n`
		kit.items.forEach((item) => {
			message += `• ${item.quantity}x ${item.product.name}`
			if (item.product.brand) {
				message += ` (${item.product.brand.name})`
			}
			message += "\n"
		})

		if (stock) {
			message += `\n**Disponibilidade:**\n`
			message += `• Kits disponíveis: ${stock.availableQuantity}\n`
			if (stock.limitingProduct) {
				message += `• Produto limitante: ${stock.limitingProduct.name}\n`
			}
		}

		if (price) {
			message += `\n**Análise de Preços:**\n`
			message += `• Soma dos produtos separados: R$ ${price.totalPrice.toFixed(2)}\n`

			if (price.kitRegisteredPrice) {
				message += `• Preço do kit registrado: R$ ${price.kitRegisteredPrice.toFixed(2)}`
				if (price.kitPriceMarketName) {
					message += ` (${price.kitPriceMarketName})`
				}
				message += "\n"

				const savings = price.totalPrice - price.kitRegisteredPrice
				const savingsPercent = (savings / price.totalPrice) * 100

				if (savings > 0) {
					message += `• ✅ Economia: R$ ${savings.toFixed(2)} (${savingsPercent.toFixed(1)}%)\n`
					message += `• 💡 Vale a pena comprar o kit!\n`
				} else if (savings < 0) {
					message += `• ⚠️ Mais caro: R$ ${Math.abs(savings).toFixed(2)} (${Math.abs(savingsPercent).toFixed(1)}%)\n`
					message += `• 💡 Melhor comprar os produtos separados!\n`
				} else {
					message += `• Mesmo preço dos produtos separados\n`
				}
			} else {
				message += `• 💡 Registre o preço do kit no mercado para ver se vale a pena!\n`
			}
		}

		if (nutrition) {
			message += `\n**Informações Nutricionais (kit completo):**\n`
			message += `• Calorias: ${nutrition.calories} kcal\n`
			message += `• Proteínas: ${nutrition.proteins}g\n`
			message += `• Carboidratos: ${nutrition.carbohydrates}g\n`
		}

		return {
			success: true,
			message,
			kit: {
				id: kit.kitProductId,
				name: kit.kitProduct.name,
				description: kit.description,
				barcode: kit.barcode,
				brand: kit.brand?.name,
				category: kit.category?.name,
				products: kit.items.map((item) => ({
					name: item.product.name,
					quantity: item.quantity,
				})),
				stock: stock
					? {
						available: stock.availableQuantity,
						limitingProduct: stock.limitingProduct?.name,
					}
					: null,
				nutrition: nutrition
					? {
						calories: nutrition.calories,
						proteins: nutrition.proteins,
						carbohydrates: nutrition.carbohydrates,
					}
					: null,
				price: price
					? {
						total: price.totalPrice,
						kitPrice: price.kitRegisteredPrice,
						savings: price.kitRegisteredPrice ? price.totalPrice - price.kitRegisteredPrice : null,
					}
					: null,
			},
		}
	} catch (error) {
		return {
			success: false,
			message: `Erro ao buscar detalhes do kit: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
		}
	}
}

/**
 * Verificar estoque disponível de um kit
 */
export async function checkKitStock(args: { kitName: string }) {
	try {
		const { kitName } = args

		// Buscar o produto kit
		const kitProduct = await prisma.product.findFirst({
			where: {
				name: { contains: kitName, mode: "insensitive" },
				isKit: true,
			},
			select: { id: true, name: true },
		})

		if (!kitProduct) {
			return {
				success: false,
				message: `Kit "${kitName}" não encontrado.`,
			}
		}

		const stock = await productKitService.checkKitStockAvailability(kitProduct.id)

		let message = `**${kitProduct.name}**\n\n`
		message += `**Disponibilidade de Estoque:**\n`
		message += `• Kits disponíveis: ${stock.availableQuantity}\n`

		if (stock.availableQuantity === 0) {
			message += `\n❌ Sem estoque suficiente para montar nenhum kit.\n`
		} else if (stock.availableQuantity <= 3) {
			message += `\n⚠️ Estoque baixo! Apenas ${stock.availableQuantity} kit(s) disponível(is).\n`
		} else {
			message += `\n✅ Estoque OK! Você pode montar ${stock.availableQuantity} kits completos.\n`
		}

		if (stock.limitingProduct) {
			message += `\n**Produto limitante:**\n`
			message += `• ${stock.limitingProduct.name}\n`
			message += `• Disponível: ${stock.limitingProduct.availableQuantity}\n`
			message += `• Necessário: ${stock.limitingProduct.requiredQuantity} por kit\n`
		}

		message += `\n**Estoque por produto:**\n`
		stock.itemsStock.forEach((item) => {
			const status = item.isAvailable ? "✅" : "❌"
			message += `${status} ${item.productName}: ${item.availableQuantity} (necessário: ${item.requiredQuantity})\n`
		})

		return {
			success: true,
			message,
			stock: {
				available: stock.availableQuantity,
				limitingProduct: stock.limitingProduct,
				items: stock.itemsStock,
			},
		}
	} catch (error) {
		return {
			success: false,
			message: `Erro ao verificar estoque do kit: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
		}
	}
}

/**
 * Calcular economia de um kit
 */
export async function calculateKitSavings(args: { kitName: string; paidPrice?: number; marketName?: string }) {
	try {
		const { kitName, paidPrice, marketName } = args

		// Buscar o produto kit
		const kitProduct = await prisma.product.findFirst({
			where: {
				name: { contains: kitName, mode: "insensitive" },
				isKit: true,
			},
			select: { id: true, name: true },
		})

		if (!kitProduct) {
			return {
				success: false,
				message: `Kit "${kitName}" não encontrado.`,
			}
		}

		// Buscar mercado se fornecido
		let marketId: string | undefined
		if (marketName) {
			const market = await prisma.market.findFirst({
				where: {
					name: { contains: marketName, mode: "insensitive" },
				},
				select: { id: true },
			})
			marketId = market?.id
		}

		const priceInfo = await productKitService.calculateKitPrice(kitProduct.id, marketId)

		let message = `**${kitProduct.name}**\n\n`
		message += `**Análise de Economia:**\n\n`
		message += `💰 **Preço sugerido (produtos separados):** R$ ${priceInfo.totalPrice.toFixed(2)}\n`

		if (paidPrice) {
			const savings = priceInfo.totalPrice - paidPrice
			const savingsPercent = (savings / priceInfo.totalPrice) * 100

			if (savings > 0) {
				message += `✅ **Você pagou:** R$ ${paidPrice.toFixed(2)}\n`
				message += `🎉 **Economia:** R$ ${savings.toFixed(2)} (${savingsPercent.toFixed(1)}%)\n\n`
				message += `Parabéns! Você economizou comprando o combo!\n`
			} else if (savings < 0) {
				message += `⚠️ **Você pagou:** R$ ${paidPrice.toFixed(2)}\n`
				message += `❌ **Prejuízo:** R$ ${Math.abs(savings).toFixed(2)} (${Math.abs(savingsPercent).toFixed(1)}%)\n\n`
				message += `O combo saiu mais caro que comprar separado. Da próxima vez, compare os preços!\n`
			} else {
				message += `✅ **Você pagou:** R$ ${paidPrice.toFixed(2)}\n`
				message += `Mesmo preço de comprar separado.\n`
			}
		}

		message += `\n**Detalhamento por produto:**\n`
		priceInfo.itemPrices.forEach((item) => {
			message += `• ${item.quantity}x ${item.productName}: R$ ${item.unitPrice.toFixed(
				2,
			)} = R$ ${item.totalPrice.toFixed(2)}\n`
		})

		return {
			success: true,
			message,
			suggestedPrice: priceInfo.totalPrice,
			paidPrice,
			savings: paidPrice ? priceInfo.totalPrice - paidPrice : 0,
		}
	} catch (error) {
		return {
			success: false,
			message: `Erro ao calcular economia do kit: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
		}
	}
}

/**
 * Buscar kits similares (para seleção)
 */
export async function findSimilarKits(args: { searchTerm: string; context?: any }) {
	try {
		const { searchTerm, context } = args

		const kits = await prisma.productKit.findMany({
			where: {
				isActive: true,
				OR: [
					{
						kitProduct: {
							name: { contains: searchTerm, mode: "insensitive" },
						},
					},
					{
						description: { contains: searchTerm, mode: "insensitive" },
					},
				],
			},
			include: {
				kitProduct: {
					select: {
						id: true,
						name: true,
					},
				},
				items: {
					include: {
						product: {
							select: {
								name: true,
							},
						},
					},
				},
			},
			take: 5,
		})

		if (kits.length === 0) {
			return {
				success: false,
				message: `Nenhum kit encontrado com "${searchTerm}".`,
				showCards: false,
			}
		}

		if (kits.length === 1 && kits[0]) {
			return {
				success: true,
				exactMatch: true,
				kit: {
					id: kits[0].kitProductId,
					name: kits[0].kitProduct.name,
				},
				context,
			}
		}

		// Múltiplas opções - retornar cards
		return {
			success: true,
			showCards: true,
			type: "kit",
			message: `Encontrei ${kits.length} kits com "${searchTerm}". Qual você quer?`,
			options: kits.map((kit) => ({
				id: kit.kitProductId,
				name: kit.kitProduct.name,
				description: kit.description || "",
				subtitle: `${kit.items.length} produtos: ${kit.items
					.map((i) => `${i.quantity}x ${i.product.name}`)
					.join(", ")}`,
			})),
			context,
		}
	} catch (error) {
		return {
			success: false,
			message: `Erro ao buscar kits: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
		}
	}
}

/**
 * Sugerir kits baseado em produtos disponíveis no estoque
 */
export async function suggestKitsFromStock() {
	try {
		// Buscar todos os kits ativos
		const kits = await productKitService.listProductKits(false)

		if (!kits || kits.length === 0) {
			return {
				success: true,
				message: "Você ainda não tem kits cadastrados. Crie kits para combos promocionais que os mercados oferecem!",
			}
		}

		// Verificar disponibilidade de cada kit
		const kitAvailability = await Promise.all(
			kits.map(async (kit) => {
				const stock = await productKitService.checkKitStockAvailability(kit.kitProductId)
				return {
					kit,
					stock,
				}
			}),
		)

		// Filtrar kits disponíveis
		const availableKits = kitAvailability.filter((k) => k.stock.availableQuantity > 0)
		const unavailableKits = kitAvailability.filter((k) => k.stock.availableQuantity === 0)

		let message = ""

		if (availableKits.length > 0) {
			message += `✅ **Kits que você pode montar com seu estoque atual:**\n\n`
			availableKits.forEach((k, i) => {
				message += `${i + 1}. **${k.kit.kitProduct.name}** - ${k.stock.availableQuantity} kit(s) disponível(is)\n`
				message += `   Produtos: ${k.kit.items.map((item) => `${item.quantity}x ${item.product.name}`).join(", ")}\n`
				if (k.stock.limitingProduct) {
					message += `   Limitado por: ${k.stock.limitingProduct.name}\n`
				}
				message += "\n"
			})
		}

		if (unavailableKits.length > 0) {
			message += `\n❌ **Kits sem estoque suficiente:**\n\n`
			unavailableKits.forEach((k, i) => {
				message += `${i + 1}. **${k.kit.kitProduct.name}**\n`
				if (k.stock.limitingProduct) {
					message += `   Falta: ${k.stock.limitingProduct.name} (tem ${k.stock.limitingProduct.availableQuantity}, precisa ${k.stock.limitingProduct.requiredQuantity})\n`
				}
				message += "\n"
			})
		}

		if (availableKits.length === 0) {
			message += `\n💡 **Dica:** Você pode comprar os produtos que faltam para montar seus kits!`
		}

		return {
			success: true,
			message,
			available: availableKits.map((k) => ({
				name: k.kit.kitProduct.name,
				quantity: k.stock.availableQuantity,
			})),
			unavailable: unavailableKits.map((k) => ({
				name: k.kit.kitProduct.name,
				limitingProduct: k.stock.limitingProduct?.name,
			})),
		}
	} catch (error) {
		return {
			success: false,
			message: `Erro ao sugerir kits: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
		}
	}
}

/**
 * Comparar preços de kits entre mercados
 */
export async function compareKitPrices(args: { kitName: string }) {
	try {
		const { kitName } = args

		// Buscar o produto kit
		const kitProduct = await prisma.product.findFirst({
			where: {
				name: { contains: kitName, mode: "insensitive" },
				isKit: true,
			},
			select: { id: true, name: true },
		})

		if (!kitProduct) {
			return {
				success: false,
				message: `Kit "${kitName}" não encontrado.`,
			}
		}

		// Buscar preços registrados do kit em diferentes mercados
		const priceRecords = await prisma.priceRecord.findMany({
			where: {
				productId: kitProduct.id,
			},
			include: {
				market: {
					select: {
						id: true,
						name: true,
					},
				},
			},
			orderBy: {
				recordDate: "desc",
			},
			take: 20,
		})

		if (priceRecords.length === 0) {
			return {
				success: true,
				message: `Ainda não há preços registrados para o kit "${kitProduct.name}". Registre o preço quando comprar ou anotar em algum mercado!`,
			}
		}

		// Agrupar por mercado
		const byMarket = new Map<string, any[]>()
		priceRecords.forEach((record) => {
			const marketName = record.market.name
			if (!byMarket.has(marketName)) {
				byMarket.set(marketName, [])
			}
			byMarket.get(marketName)?.push(record)
		})

		let message = `**${kitProduct.name}**\n\n`
		message += `**Comparação de Preços por Mercado:**\n\n`

		const marketPrices: Array<{ market: string; avgPrice: number; lastPrice: number; count: number }> = []

		byMarket.forEach((records, marketName) => {
			const avgPrice = records.reduce((sum, r) => sum + r.price, 0) / records.length
			const lastPrice = records[0].price
			const lastDate = new Date(records[0].recordDate).toLocaleDateString("pt-BR")

			marketPrices.push({
				market: marketName,
				avgPrice,
				lastPrice,
				count: records.length,
			})

			message += `📍 **${marketName}**\n`
			message += `   Último preço: R$ ${lastPrice.toFixed(2)} (${lastDate})\n`
			message += `   Média: R$ ${avgPrice.toFixed(2)} (${records.length} registro(s))\n\n`
		})

		// Encontrar melhor preço
		const bestMarket = marketPrices.sort((a, b) => a.lastPrice - b.lastPrice)[0]

		if (!bestMarket) {
			return { error: "Nenhum mercado com preços disponíveis" }
		}

		message += `\n🏆 **Melhor opção:** ${bestMarket.market} por R$ ${bestMarket.lastPrice.toFixed(2)}`

		return {
			success: true,
			message,
			markets: marketPrices,
			bestMarket: bestMarket.market,
			bestPrice: bestMarket.lastPrice,
		}
	} catch (error) {
		return {
			success: false,
			message: `Erro ao comparar preços de kits: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
		}
	}
}

/**
 * Registra preços rapidamente e analisa se vale a pena comprar o kit
 */
export async function quickKitPriceAnalysis(args: {
	kitName: string
	marketName: string
	kitPrice: number
	itemPrices: Array<{ productName: string; price: number }>
}) {
	try {
		const { kitName, marketName, kitPrice, itemPrices } = args

		// Buscar o produto kit
		const kitProduct = await prisma.product.findFirst({
			where: {
				name: { contains: kitName, mode: "insensitive" },
				isKit: true,
			},
			select: { id: true, name: true },
		})

		if (!kitProduct) {
			return {
				success: false,
				message: `Kit "${kitName}" não encontrado.`,
			}
		}

		// Buscar mercado
		let market = await prisma.market.findFirst({
			where: {
				name: { contains: marketName, mode: "insensitive" },
			},
		})

		if (!market) {
			market = await prisma.market.create({
				data: { name: marketName },
			})
		}

		// Buscar o kit completo
		const kit = await productKitService.getProductKitWithDetails(kitProduct.id)
		if (!kit) {
			return {
				success: false,
				message: "Erro ao buscar detalhes do kit.",
			}
		}

		// Mapear preços dos itens aos produtos do kit
		const mappedItemPrices = []
		for (const item of kit.items) {
			const priceData = itemPrices.find((ip) => item.product.name.toLowerCase().includes(ip.productName.toLowerCase()))

			if (!priceData) {
				return {
					success: false,
					message: `Não encontrei o preço para o produto "${item.product.name}" no kit.`,
				}
			}

			mappedItemPrices.push({
				productId: item.product.id,
				price: priceData.price,
			})
		}

		// Executar análise rápida
		const analysis = await productKitService.quickPriceAnalysis({
			kitProductId: kitProduct.id,
			marketId: market.id,
			kitPrice,
			itemPrices: mappedItemPrices,
		})

		let message = `**Análise de Preço: ${kitProduct.name}**\n`
		message += `Mercado: ${market.name}\n\n`
		message += `💰 **Preço do Kit:** R$ ${analysis.kitPrice.toFixed(2)}\n`
		message += `🛒 **Produtos Separados:** R$ ${analysis.individualTotal.toFixed(2)}\n\n`

		if (analysis.worthIt) {
			message += `✅ **VALE A PENA!**\n`
			message += `🎉 Economia: R$ ${analysis.savings.toFixed(2)} (${analysis.savingsPercentage.toFixed(1)}%)\n\n`
			message += `${analysis.recommendation}\n`
		} else {
			message += `❌ **NÃO COMPENSA**\n`
			message += `⚠️ Diferença: R$ ${Math.abs(analysis.savings).toFixed(2)} (${Math.abs(analysis.savingsPercentage).toFixed(1)}%)\n\n`
			message += `${analysis.recommendation}\n`
		}

		message += `\n**Detalhamento:**\n`
		analysis.itemBreakdown.forEach((item) => {
			message += `• ${item.productName}: ${item.quantity}x R$ ${item.unitPrice.toFixed(2)} = R$ ${item.totalPrice.toFixed(2)}\n`
		})

		message += `\n✅ Preços registrados com sucesso no sistema!`

		return {
			success: true,
			message,
			analysis: {
				kitPrice: analysis.kitPrice,
				individualTotal: analysis.individualTotal,
				savings: analysis.savings,
				savingsPercentage: analysis.savingsPercentage,
				worthIt: analysis.worthIt,
			},
		}
	} catch (error) {
		return {
			success: false,
			message: `Erro ao analisar preços do kit: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
		}
	}
}

// Exportar todas as funções
export const kitFunctions = {
	listProductKits,
	createProductKit,
	getProductKitDetails,
	checkKitStock,
	suggestKitsFromStock,
	compareKitPrices,
	quickKitPriceAnalysis,
}
