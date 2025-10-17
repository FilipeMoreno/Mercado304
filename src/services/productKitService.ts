/**
 * Product Kit Service
 *
 * Serviço para gerenciar kits de produtos, incluindo:
 * - Criação e atualização de kits
 * - Cálculo de informações nutricionais agregadas
 * - Gestão de estoque considerando os produtos individuais
 * - Cálculo de preços baseados nos itens do kit
 */

import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

// ============================================
// TYPES
// ============================================

export type ProductKitWithItems = Prisma.ProductKitGetPayload<{
	include: {
		kitProduct: {
			include: {
				category: true
				brand: true
				nutritionalInfo: true
			}
		}
		brand: true
		category: true
		items: {
			include: {
				product: {
					include: {
						category: true
						brand: true
						nutritionalInfo: true
						stockItems: true
					}
				}
			}
		}
	}
}>

export interface CreateProductKitInput {
	kitProductId: string
	description?: string
	barcode?: string
	brandId?: string
	categoryId?: string
	items: {
		productId: string
		quantity: number
	}[]
}

export interface AggregatedNutritionalInfo {
	servingSize: string
	servingsPerPackage: number
	calories: number
	proteins: number
	totalFat: number
	saturatedFat: number
	transFat: number
	carbohydrates: number
	totalSugars: number
	addedSugars: number
	fiber: number
	sodium: number
	// Vitaminas
	vitaminA?: number
	vitaminC?: number
	vitaminD?: number
	// Minerais
	calcium?: number
	iron?: number
	magnesium?: number
	potassium?: number
	// Outros
	caffeine?: number
	cholesterol?: number
	// Alérgenos combinados
	allergensContains: string[]
	allergensMayContain: string[]
}

export interface KitStockInfo {
	isAvailable: boolean
	availableQuantity: number // Quantidade de kits completos disponíveis
	limitingProduct?: {
		id: string
		name: string
		availableQuantity: number
		requiredQuantity: number
	}
	itemsStock: {
		productId: string
		productName: string
		requiredQuantity: number
		availableQuantity: number
		isAvailable: boolean
	}[]
}

// ============================================
// KIT MANAGEMENT
// ============================================

/**
 * Cria um novo kit de produtos
 */
export async function createProductKit(input: CreateProductKitInput) {
	// Validar que o produto existe e ainda não é um kit
	const kitProduct = await prisma.product.findUnique({
		where: { id: input.kitProductId },
	})

	if (!kitProduct) {
		throw new Error("Produto não encontrado")
	}

	if (kitProduct.isKit) {
		throw new Error("Este produto já é um kit")
	}

	// Validar que todos os produtos dos itens existem
	const productIds = input.items.map((item) => item.productId)
	const products = await prisma.product.findMany({
		where: { id: { in: productIds } },
	})

	if (products.length !== productIds.length) {
		throw new Error("Alguns produtos dos itens não foram encontrados")
	}

	// Criar o kit e seus itens em uma transação
	return await prisma.$transaction(async (tx) => {
		// Marcar o produto como kit
		await tx.product.update({
			where: { id: input.kitProductId },
			data: { isKit: true },
		})

		// Criar o kit
		const kit = await tx.productKit.create({
			data: {
				kitProductId: input.kitProductId,
				description: input.description,
				barcode: input.barcode,
				brandId: input.brandId,
				categoryId: input.categoryId,
				items: {
					create: input.items.map((item) => ({
						productId: item.productId,
						quantity: item.quantity,
					})),
				},
			},
			include: {
				kitProduct: true,
				brand: true,
				category: true,
				items: {
					include: {
						product: true,
					},
				},
			},
		})

		return kit
	})
}

/**
 * Atualiza um kit completo (descrição, barcode, brand, category, status e items)
 */
export async function updateProductKit(
	kitId: string,
	data: {
		description?: string
		barcode?: string
		brandId?: string
		categoryId?: string
		isActive?: boolean
		items?: { productId: string; quantity: number }[]
	},
) {
	// Se tiver items, validar que todos os produtos existem
	if (data.items) {
		const productIds = data.items.map((item) => item.productId)
		const products = await prisma.product.findMany({
			where: { id: { in: productIds } },
		})

		if (products.length !== productIds.length) {
			throw new Error("Alguns produtos não foram encontrados")
		}
	}

	return await prisma.$transaction(async (tx) => {
		// Atualizar campos do kit
		const updateData: any = {}
		if (data.description !== undefined) updateData.description = data.description
		if (data.barcode !== undefined) updateData.barcode = data.barcode
		if (data.brandId !== undefined) updateData.brandId = data.brandId
		if (data.categoryId !== undefined) updateData.categoryId = data.categoryId
		if (data.isActive !== undefined) updateData.isActive = data.isActive

		await tx.productKit.update({
			where: { id: kitId },
			data: updateData,
		})

		// Se tiver items, atualizar
		if (data.items) {
			// Remover todos os itens existentes
			await tx.productKitItem.deleteMany({
				where: { kitId },
			})

			// Criar os novos itens
			await tx.productKitItem.createMany({
				data: data.items.map((item) => ({
					kitId,
					productId: item.productId,
					quantity: item.quantity,
				})),
			})
		}

		// Retornar o kit atualizado completo
		return await tx.productKit.findUnique({
			where: { id: kitId },
			include: {
				kitProduct: {
					include: {
						category: true,
						brand: true,
						nutritionalInfo: true,
					},
				},
				brand: true,
				category: true,
				items: {
					include: {
						product: {
							include: {
								category: true,
								brand: true,
								nutritionalInfo: true,
								stockItems: true,
							},
						},
					},
				},
			},
		})
	})
}

/**
 * Atualiza os itens de um kit (deprecated - use updateProductKit)
 */
export async function updateProductKitItems(kitId: string, items: { productId: string; quantity: number }[]) {
	return updateProductKit(kitId, { items })
}

/**
 * Busca um kit com todos os seus dados
 */
export async function getProductKitWithDetails(kitProductId: string): Promise<ProductKitWithItems | null> {
	return await prisma.productKit.findUnique({
		where: { kitProductId },
		include: {
			kitProduct: {
				include: {
					category: true,
					brand: true,
					nutritionalInfo: true,
				},
			},
			brand: true,
			category: true,
			items: {
				include: {
					product: {
						include: {
							category: true,
							brand: true,
							nutritionalInfo: true,
							stockItems: true,
						},
					},
				},
			},
		},
	})
}

/**
 * Lista todos os kits ativos
 */
export async function listProductKits(includeInactive = false) {
	return await prisma.productKit.findMany({
		where: includeInactive ? {} : { isActive: true },
		include: {
			kitProduct: {
				include: {
					category: true,
					brand: true,
				},
			},
			brand: true,
			category: true,
			items: {
				include: {
					product: {
						include: {
							category: true,
							brand: true,
						},
					},
				},
			},
		},
		orderBy: {
			createdAt: "desc",
		},
	})
}

// ============================================
// NUTRITIONAL INFORMATION
// ============================================

/**
 * Calcula as informações nutricionais agregadas de um kit
 * Soma os valores de todos os produtos considerando suas quantidades
 */
export async function calculateKitNutritionalInfo(kitProductId: string): Promise<AggregatedNutritionalInfo | null> {
	const kit = await getProductKitWithDetails(kitProductId)

	if (!kit) {
		return null
	}

	// Inicializar valores zerados
	const aggregated: AggregatedNutritionalInfo = {
		servingSize: "1 kit",
		servingsPerPackage: 1,
		calories: 0,
		proteins: 0,
		totalFat: 0,
		saturatedFat: 0,
		transFat: 0,
		carbohydrates: 0,
		totalSugars: 0,
		addedSugars: 0,
		fiber: 0,
		sodium: 0,
		allergensContains: [],
		allergensMayContain: [],
	}

	const allergensContainsSet = new Set<string>()
	const allergensMayContainSet = new Set<string>()

	// Somar os valores de cada produto no kit
	for (const kitItem of kit.items) {
		const product = kitItem.product
		const nutritionalInfo = product.nutritionalInfo
		const quantity = kitItem.quantity

		if (!nutritionalInfo) continue

		// Somar valores nutricionais multiplicados pela quantidade
		aggregated.calories += (nutritionalInfo.calories || 0) * quantity
		aggregated.proteins += (nutritionalInfo.proteins || 0) * quantity
		aggregated.totalFat += (nutritionalInfo.totalFat || 0) * quantity
		aggregated.saturatedFat += (nutritionalInfo.saturatedFat || 0) * quantity
		aggregated.transFat += (nutritionalInfo.transFat || 0) * quantity
		aggregated.carbohydrates += (nutritionalInfo.carbohydrates || 0) * quantity
		aggregated.totalSugars += (nutritionalInfo.totalSugars || 0) * quantity
		aggregated.addedSugars += (nutritionalInfo.addedSugars || 0) * quantity
		aggregated.fiber += (nutritionalInfo.fiber || 0) * quantity
		aggregated.sodium += (nutritionalInfo.sodium || 0) * quantity

		// Vitaminas
		if (nutritionalInfo.vitaminA) {
			aggregated.vitaminA = (aggregated.vitaminA || 0) + nutritionalInfo.vitaminA * quantity
		}
		if (nutritionalInfo.vitaminC) {
			aggregated.vitaminC = (aggregated.vitaminC || 0) + nutritionalInfo.vitaminC * quantity
		}
		if (nutritionalInfo.vitaminD) {
			aggregated.vitaminD = (aggregated.vitaminD || 0) + nutritionalInfo.vitaminD * quantity
		}

		// Minerais
		if (nutritionalInfo.calcium) {
			aggregated.calcium = (aggregated.calcium || 0) + nutritionalInfo.calcium * quantity
		}
		if (nutritionalInfo.iron) {
			aggregated.iron = (aggregated.iron || 0) + nutritionalInfo.iron * quantity
		}
		if (nutritionalInfo.magnesium) {
			aggregated.magnesium = (aggregated.magnesium || 0) + nutritionalInfo.magnesium * quantity
		}
		if (nutritionalInfo.potassium) {
			aggregated.potassium = (aggregated.potassium || 0) + nutritionalInfo.potassium * quantity
		}

		// Outros
		if (nutritionalInfo.caffeine) {
			aggregated.caffeine = (aggregated.caffeine || 0) + nutritionalInfo.caffeine * quantity
		}
		if (nutritionalInfo.cholesterol) {
			aggregated.cholesterol = (aggregated.cholesterol || 0) + nutritionalInfo.cholesterol * quantity
		}

		// Alérgenos - combinar todos os produtos
		nutritionalInfo.allergensContains.forEach((allergen) => {
			allergensContainsSet.add(allergen)
		})
		nutritionalInfo.allergensMayContain.forEach((allergen) => {
			allergensMayContainSet.add(allergen)
		})
	}

	// Converter sets para arrays
	aggregated.allergensContains = Array.from(allergensContainsSet)
	aggregated.allergensMayContain = Array.from(allergensMayContainSet)

	return aggregated
}

// ============================================
// STOCK MANAGEMENT
// ============================================

/**
 * Verifica a disponibilidade em estoque de um kit
 * Calcula quantos kits completos podem ser montados com o estoque atual
 */
export async function checkKitStockAvailability(kitProductId: string): Promise<KitStockInfo> {
	const kit = await getProductKitWithDetails(kitProductId)

	if (!kit) {
		throw new Error("Kit não encontrado")
	}

	const itemsStock: KitStockInfo["itemsStock"] = []
	let minAvailableKits = Number.POSITIVE_INFINITY
	let limitingProduct: KitStockInfo["limitingProduct"] | undefined

	// Verificar estoque de cada item do kit
	for (const kitItem of kit.items) {
		const product = kitItem.product
		const requiredQuantity = kitItem.quantity

		// Calcular estoque total do produto
		const totalStock = product.stockItems.reduce((sum, stockItem) => sum + stockItem.quantity, 0)

		// Calcular quantos kits podem ser feitos com este produto
		const possibleKits = Math.floor(totalStock / requiredQuantity)

		itemsStock.push({
			productId: product.id,
			productName: product.name,
			requiredQuantity,
			availableQuantity: totalStock,
			isAvailable: totalStock >= requiredQuantity,
		})

		// Atualizar o produto limitante
		if (possibleKits < minAvailableKits) {
			minAvailableKits = possibleKits
			limitingProduct = {
				id: product.id,
				name: product.name,
				availableQuantity: totalStock,
				requiredQuantity,
			}
		}
	}

	// Se não há itens, nenhum kit disponível
	if (kit.items.length === 0) {
		minAvailableKits = 0
	}

	return {
		isAvailable: minAvailableKits > 0,
		availableQuantity: Math.max(0, minAvailableKits),
		limitingProduct,
		itemsStock,
	}
}

/**
 * Remove do estoque os produtos necessários para montar um kit
 * Deve ser chamado quando um kit é vendido/usado
 */
export async function consumeKitFromStock(kitProductId: string, quantity: number, reason?: string) {
	const kit = await getProductKitWithDetails(kitProductId)

	if (!kit) {
		throw new Error("Kit não encontrado")
	}

	// Verificar disponibilidade
	const stockInfo = await checkKitStockAvailability(kitProductId)

	if (!stockInfo.isAvailable || stockInfo.availableQuantity < quantity) {
		throw new Error(
			`Estoque insuficiente. Disponível: ${stockInfo.availableQuantity} kits. ` +
				`Produto limitante: ${stockInfo.limitingProduct?.name}`,
		)
	}

	// Consumir estoque de cada item em uma transação
	return await prisma.$transaction(async (tx) => {
		const movements = []

		for (const kitItem of kit.items) {
			const product = kitItem.product
			const quantityToConsume = kitItem.quantity * quantity

			// Buscar itens de estoque deste produto (FIFO - primeiro a entrar, primeiro a sair)
			const stockItems = await tx.stockItem.findMany({
				where: {
					productId: product.id,
					quantity: { gt: 0 },
				},
				orderBy: {
					addedDate: "asc",
				},
			})

			let remainingToConsume = quantityToConsume

			for (const stockItem of stockItems) {
				if (remainingToConsume <= 0) break

				const consumeFromThisItem = Math.min(stockItem.quantity, remainingToConsume)

				// Atualizar quantidade do item de estoque
				await tx.stockItem.update({
					where: { id: stockItem.id },
					data: {
						quantity: stockItem.quantity - consumeFromThisItem,
					},
				})

				// Registrar movimento
				await tx.stockMovement.create({
					data: {
						stockItemId: stockItem.id,
						type: "SAIDA",
						quantity: consumeFromThisItem,
						reason: reason || `Consumo de kit: ${kit.kitProduct.name}`,
						notes: `Kit: ${kit.kitProduct.name} (${quantity} unidade(s))`,
					},
				})

				movements.push({
					productId: product.id,
					productName: product.name,
					quantity: consumeFromThisItem,
				})

				remainingToConsume -= consumeFromThisItem
			}

			// Se ainda há quantidade para consumir, algo deu errado
			if (remainingToConsume > 0) {
				throw new Error(`Estoque insuficiente para o produto ${product.name}`)
			}
		}

		return {
			success: true,
			kitsConsumed: quantity,
			movements,
		}
	})
}

/**
 * Adiciona kits ao estoque (adicionando os produtos individuais)
 * Útil quando você compra kits e quer separar os produtos
 */
export async function addKitToStock(kitProductId: string, quantity: number, location?: string, unitCost?: number) {
	const kit = await getProductKitWithDetails(kitProductId)

	if (!kit) {
		throw new Error("Kit não encontrado")
	}

	// Calcular custo unitário de cada produto se fornecido
	const costPerKit = unitCost || 0

	return await prisma.$transaction(async (tx) => {
		const movements = []

		for (const kitItem of kit.items) {
			const product = kitItem.product
			const quantityToAdd = kitItem.quantity * quantity

			// Criar ou atualizar item de estoque
			const stockItem = await tx.stockItem.create({
				data: {
					productId: product.id,
					quantity: quantityToAdd,
					location,
					// Dividir o custo proporcionalmente (simplificado)
					unitCost: costPerKit > 0 ? costPerKit / kit.items.length : undefined,
				},
			})

			// Registrar movimento
			await tx.stockMovement.create({
				data: {
					stockItemId: stockItem.id,
					type: "ENTRADA",
					quantity: quantityToAdd,
					reason: `Entrada de kit: ${kit.kitProduct.name}`,
					notes: `Kit: ${kit.kitProduct.name} (${quantity} unidade(s))`,
				},
			})

			movements.push({
				productId: product.id,
				productName: product.name,
				quantity: quantityToAdd,
			})
		}

		return {
			success: true,
			kitsAdded: quantity,
			movements,
		}
	})
}

// ============================================
// PRICE CALCULATION
// ============================================

/**
 * Calcula o preço sugerido de um kit baseado nos preços individuais dos produtos
 * Busca o preço mais recente de registros de preço OU compras
 * Também busca o preço registrado do próprio kit
 */
export async function calculateKitPrice(kitProductId: string, marketId?: string) {
	const kit = await getProductKitWithDetails(kitProductId)

	if (!kit) {
		throw new Error("Kit não encontrado")
	}

	// Buscar preço registrado do próprio kit (do kitProduct)
	const kitPriceRecord = await prisma.priceRecord.findFirst({
		where: {
			productId: kitProductId,
			...(marketId && { marketId }),
		},
		orderBy: {
			recordDate: "desc",
		},
		include: {
			market: true,
		},
	})

	const kitPurchaseItem = await prisma.purchaseItem.findFirst({
		where: {
			productId: kitProductId,
			...(marketId && {
				purchase: {
					marketId,
				},
			}),
		},
		include: {
			purchase: {
				include: {
					market: true,
				},
			},
		},
		orderBy: {
			createdAt: "desc",
		},
	})

	// Determinar preço registrado do kit
	let kitRegisteredPrice: number | null = null
	let kitPriceSource: string | null = null
	let kitPriceDate: Date | null = null
	let kitPriceMarketName: string | null = null

	if (kitPriceRecord && kitPurchaseItem) {
		if (kitPriceRecord.recordDate > kitPurchaseItem.purchase.purchaseDate) {
			kitRegisteredPrice = kitPriceRecord.price
			kitPriceSource = "price_record"
			kitPriceDate = kitPriceRecord.recordDate
			kitPriceMarketName = kitPriceRecord.market.name
		} else {
			kitRegisteredPrice = kitPurchaseItem.unitPrice
			kitPriceSource = "purchase"
			kitPriceDate = kitPurchaseItem.purchase.purchaseDate
			kitPriceMarketName = kitPurchaseItem.purchase.market.name
		}
	} else if (kitPriceRecord) {
		kitRegisteredPrice = kitPriceRecord.price
		kitPriceSource = "price_record"
		kitPriceDate = kitPriceRecord.recordDate
		kitPriceMarketName = kitPriceRecord.market.name
	} else if (kitPurchaseItem) {
		kitRegisteredPrice = kitPurchaseItem.unitPrice
		kitPriceSource = "purchase"
		kitPriceDate = kitPurchaseItem.purchase.purchaseDate
		kitPriceMarketName = kitPurchaseItem.purchase.market.name
	}

	// Calcular preço dos produtos individuais
	let totalPrice = 0
	const itemPrices = []

	for (const kitItem of kit.items) {
		const product = kitItem.product
		const quantity = kitItem.quantity

		// Buscar último preço de PriceRecord
		const priceRecord = await prisma.priceRecord.findFirst({
			where: {
				productId: product.id,
				...(marketId && { marketId }),
			},
			orderBy: {
				recordDate: "desc",
			},
		})

		// Buscar último preço de PurchaseItem
		const purchaseItem = await prisma.purchaseItem.findFirst({
			where: {
				productId: product.id,
				...(marketId && {
					purchase: {
						marketId,
					},
				}),
			},
			include: {
				purchase: true,
			},
			orderBy: {
				createdAt: "desc",
			},
		})

		// Usar o preço mais recente entre PriceRecord e PurchaseItem
		let unitPrice = 0
		let priceSource = "none"
		let priceDate: Date | null = null

		if (priceRecord && purchaseItem) {
			// Comparar datas e usar o mais recente
			if (priceRecord.recordDate > purchaseItem.purchase.purchaseDate) {
				unitPrice = priceRecord.price
				priceSource = "price_record"
				priceDate = priceRecord.recordDate
			} else {
				unitPrice = purchaseItem.unitPrice
				priceSource = "purchase"
				priceDate = purchaseItem.purchase.purchaseDate
			}
		} else if (priceRecord) {
			unitPrice = priceRecord.price
			priceSource = "price_record"
			priceDate = priceRecord.recordDate
		} else if (purchaseItem) {
			unitPrice = purchaseItem.unitPrice
			priceSource = "purchase"
			priceDate = purchaseItem.purchase.purchaseDate
		}

		const itemTotal = unitPrice * quantity
		totalPrice += itemTotal

		itemPrices.push({
			productId: product.id,
			productName: product.name,
			quantity,
			unitPrice,
			totalPrice: itemTotal,
			priceSource,
			priceDate,
		})
	}

	return {
		totalPrice,
		itemPrices,
		kitRegisteredPrice,
		kitPriceSource,
		kitPriceDate,
		kitPriceMarketName,
	}
}

/**
 * Compara o preço do kit com a soma dos preços individuais
 * Retorna análise se compensa comprar o kit ou não
 */
export async function compareKitPrices(kitProductId: string, kitPrice: number, marketId?: string) {
	const kit = await getProductKitWithDetails(kitProductId)

	if (!kit) {
		throw new Error("Kit não encontrado")
	}

	// Calcular preço dos produtos individuais
	const individualPrices = await calculateKitPrice(kitProductId, marketId)

	const totalIndividual = individualPrices.totalPrice
	const totalKit = kitPrice
	const savings = totalIndividual - totalKit
	const savingsPercentage = totalIndividual > 0 ? (savings / totalIndividual) * 100 : 0
	const worthIt = savings > 0

	return {
		kitPrice: totalKit,
		individualTotal: totalIndividual,
		savings,
		savingsPercentage,
		worthIt,
		recommendation: worthIt
			? `Vale a pena! Você economiza R$ ${savings.toFixed(2)} (${savingsPercentage.toFixed(1)}%) comprando o kit.`
			: savings < 0
				? `Não compensa. Sai mais barato comprar os produtos separados. Diferença: R$ ${Math.abs(savings).toFixed(2)}.`
				: "Os preços são equivalentes.",
		itemBreakdown: individualPrices.itemPrices,
	}
}

/**
 * Registra preços rapidamente para análise de kit
 * Útil para quando está no mercado e quer registrar os preços e ver análise instantânea
 */
export async function quickPriceAnalysis(input: {
	kitProductId: string
	marketId: string
	kitPrice: number
	itemPrices: {
		productId: string
		price: number
	}[]
}) {
	const kit = await getProductKitWithDetails(input.kitProductId)

	if (!kit) {
		throw new Error("Kit não encontrado")
	}

	// Registrar todos os preços em uma transação
	await prisma.$transaction(async (tx) => {
		// Registrar preço do kit (kitProduct)
		await tx.priceRecord.create({
			data: {
				productId: input.kitProductId,
				marketId: input.marketId,
				price: input.kitPrice,
			},
		})

		// Registrar preços dos itens individuais
		for (const itemPrice of input.itemPrices) {
			await tx.priceRecord.create({
				data: {
					productId: itemPrice.productId,
					marketId: input.marketId,
					price: itemPrice.price,
				},
			})
		}
	})

	// Calcular análise com os novos preços
	const analysis = await compareKitPrices(input.kitProductId, input.kitPrice, input.marketId)

	return analysis
}

// ============================================
// UTILITIES
// ============================================

/**
 * Verifica se um produto é um kit
 */
export async function isProductKit(productId: string): Promise<boolean> {
	const product = await prisma.product.findUnique({
		where: { id: productId },
		select: { isKit: true },
	})

	return product?.isKit || false
}

/**
 * Desativa um kit (sem deletar)
 */
export async function deactivateKit(kitId: string) {
	return await prisma.productKit.update({
		where: { id: kitId },
		data: { isActive: false },
	})
}

/**
 * Ativa um kit
 */
export async function activateKit(kitId: string) {
	return await prisma.productKit.update({
		where: { id: kitId },
		data: { isActive: true },
	})
}

/**
 * Deleta um kit permanentemente (e o produto associado)
 */
export async function deleteProductKit(kitId: string) {
	return await prisma.$transaction(async (tx) => {
		// Buscar o kit para pegar o kitProductId
		const kit = await tx.productKit.findUnique({
			where: { id: kitId },
			select: { kitProductId: true },
		})

		if (!kit) {
			throw new Error("Kit não encontrado")
		}

		// Deletar o kit (cascade deleta os items)
		await tx.productKit.delete({
			where: { id: kitId },
		})

		// Deletar o produto do kit também
		// O cascade do Prisma vai deletar tudo relacionado (PriceRecords, etc)
		await tx.product.delete({
			where: { id: kit.kitProductId },
		})

		return { success: true }
	})
}

/**
 * Verifica se um produto está vinculado a algum kit
 */
export async function checkProductInKits(productId: string) {
	// Verificar se é um produto kit
	const asKitProduct = await prisma.productKit.findUnique({
		where: { kitProductId: productId },
		include: {
			kitProduct: {
				select: {
					name: true,
				},
			},
		},
	})

	// Verificar se está em algum kit como item
	const inKitItems = await prisma.productKitItem.findMany({
		where: { productId },
		include: {
			kit: {
				include: {
					kitProduct: {
						select: {
							name: true,
						},
					},
				},
			},
		},
	})

	return {
		isKitProduct: !!asKitProduct,
		kitProductDetails: asKitProduct
			? {
					kitId: asKitProduct.id,
					kitName: asKitProduct.kitProduct.name,
				}
			: null,
		isInKits: inKitItems.length > 0,
		kits: inKitItems.map((item) => ({
			kitId: item.kit.id,
			kitName: item.kit.kitProduct.name,
			quantity: item.quantity,
		})),
	}
}
