import { getAllProductPrices } from "@/lib/price-utils"
import { prisma } from "@/lib/prisma"

export const productFunctions = {
	// Products Management
	createProduct: async ({ name, brandName, categoryName, barcode, description }: any) => {
		try {
			let brandId = null
			let categoryId = null

			// Validar e buscar marca se fornecida
			if (brandName) {
				const brand = await prisma.brand.findFirst({
					where: { name: { equals: brandName, mode: "insensitive" } },
				})
				if (!brand) {
					return {
						success: false,
						message: `A marca "${brandName}" não existe no sistema. Deseja criar esta marca primeiro?`,
						missingBrand: brandName,
					}
				}
				brandId = brand.id
			}

			// Validar e buscar categoria se fornecida
			if (categoryName) {
				const category = await prisma.category.findFirst({
					where: { name: { equals: categoryName, mode: "insensitive" } },
				})
				if (!category) {
					return {
						success: false,
						message: `A categoria "${categoryName}" não existe no sistema. Deseja criar esta categoria primeiro?`,
						missingCategory: categoryName,
					}
				}
				categoryId = category.id
			}

			const product = await prisma.product.create({
				data: { name, brandId, categoryId, barcode },
				include: { brand: true, category: true },
			})

			return {
				success: true,
				message: `Produto "${name}" criado com sucesso.`,
				product,
			}
		} catch (error) {
			return { success: false, message: `Erro ao criar produto: ${error}` }
		}
	},

	searchProducts: async ({ search, categoryId, brandId, sortBy = "name", sortOrder = "asc" }: any) => {
		// Configurar ordenação
		let orderBy: any = { name: "asc" }

		switch (sortBy) {
			case "name":
				orderBy = { name: sortOrder === "desc" ? "desc" : "asc" }
				break
			case "date":
				orderBy = { createdAt: sortOrder === "desc" ? "desc" : "asc" }
				break
			case "category":
				orderBy = { category: { name: sortOrder === "desc" ? "desc" : "asc" } }
				break
			case "brand":
				orderBy = { brand: { name: sortOrder === "desc" ? "desc" : "asc" } }
				break
			default:
				orderBy = { name: "asc" }
		}

		const products = await prisma.product.findMany({
			where: {
				name: { contains: search, mode: "insensitive" },
				...(categoryId && { categoryId }),
				...(brandId && { brandId }),
			},
			include: { brand: true, category: true },
			orderBy,
			take: 10,
		})

		return {
			success: true,
			products,
			sortInfo: {
				sortBy,
				sortOrder,
				message: `Produtos ordenados por ${sortBy} (${sortOrder})`,
			},
		}
	},

	getProductPriceComparison: async ({ productName }: { productName: string }) => {
		const product = await prisma.product.findFirst({
			where: { name: { contains: productName, mode: "insensitive" } },
		})
		if (!product)
			return {
				success: false,
				message: `Produto "${productName}" não encontrado.`,
			}

		// Buscar preços de todos os mercados (compras + registros)
		const allPrices = await getAllProductPrices(product.id)

		const pricesByMarket = allPrices.reduce((acc: any, item) => {
			if (item.price !== null) {
				acc[item.marketName] = {
					price: item.price,
					date: item.lastUpdate,
					source: item.source,
					formatted: `R$ ${item.price.toFixed(2)}`,
				}
			}
			return acc
		}, {})

		return { success: true, product: product.name, prices: pricesByMarket }
	},

	getHealthyAlternatives: async ({ productName }: { productName: string }) => {
		const response = await fetch(`${process.env.NEXTAUTH_URL}/api/products/healthy-alternatives`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ productName }),
		})
		const data = await response.json()
		return { success: true, alternatives: data.alternatives }
	},

	getBestDayToBuy: async ({ productName }: { productName: string }) => {
		const response = await fetch(`${process.env.NEXTAUTH_URL}/api/products/best-day-to-buy`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ productName }),
		})
		const data = await response.json()
		return { success: true, recommendation: data }
	},

	createProductWithBrandAndCategory: async ({ productName, brandName, categoryName, barcode, description }: any) => {
		try {
			let brandId = null
			let categoryId = null

			// Criar marca se fornecida e não existir
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

			// Criar categoria se fornecida e não existir
			if (categoryName) {
				let category = await prisma.category.findFirst({
					where: { name: { equals: categoryName, mode: "insensitive" } },
				})
				if (!category) {
					category = await prisma.category.create({
						data: { name: categoryName, icon: "📦", color: "#6b7280" },
					})
				}
				categoryId = category.id
			}

			// Criar produto
			const product = await prisma.product.create({
				data: { name: productName, brandId, categoryId, barcode },
				include: { brand: true, category: true },
			})

			let finalMessage = `Produto "${productName}" criado com sucesso.`
			if (brandName) finalMessage += ` Marca: ${brandName}.`
			if (categoryName) finalMessage += ` Categoria: ${categoryName}.`

			return { success: true, message: finalMessage, product }
		} catch (error) {
			return { success: false, message: `Erro ao criar produto: ${error}` }
		}
	},

	getMostExpensiveProducts: async ({
		limit = 10,
		sortBy = "price",
		sortOrder = "desc",
	}: {
		limit?: number
		sortBy?: string
		sortOrder?: string
	} = {}) => {
		try {
			// Configurar ordenação
			let orderBy: any = { unitPrice: "desc" }

			switch (sortBy) {
				case "price":
					orderBy = { unitPrice: sortOrder === "asc" ? "asc" : "desc" }
					break
				case "date":
					orderBy = { purchase: { purchaseDate: sortOrder === "asc" ? "asc" : "desc" } }
					break
				case "product":
					orderBy = { product: { name: sortOrder === "asc" ? "asc" : "desc" } }
					break
				case "market":
					orderBy = { purchase: { market: { name: sortOrder === "asc" ? "asc" : "desc" } } }
					break
				default:
					orderBy = { unitPrice: "desc" }
			}

			// Busca os produtos com os preços mais altos baseado nas compras mais recentes
			const expensiveProducts = await prisma.purchaseItem.findMany({
				include: {
					product: {
						include: {
							brand: true,
							category: true,
						},
					},
					purchase: {
						include: {
							market: true,
						},
					},
				},
				orderBy,
				take: limit,
				distinct: ["productId"], // Evita produtos duplicados
			})

			if (expensiveProducts.length === 0) {
				return {
					success: false,
					message: "Nenhum produto com preço registrado foi encontrado.",
				}
			}

			const formattedProducts = expensiveProducts.map((item) => ({
				product: item.product?.name || "Produto não encontrado",
				brand: item.product?.brand?.name || "Sem marca",
				category: item.product?.category?.name || "Sem categoria",
				price: item.unitPrice,
				market: item.purchase.market.name,
				purchaseDate: item.purchase.purchaseDate.toLocaleDateString("pt-BR"),
			}))

			const mostExpensive = formattedProducts[0]

			if (!mostExpensive) {
				return { error: "Nenhum produto encontrado" }
			}

			return {
				success: true,
				message: `O produto mais caro registrado é "${mostExpensive.product}" (${mostExpensive.brand}) por R$ ${mostExpensive.price.toFixed(2)} no ${mostExpensive.market}.`,
				mostExpensive,
				topProducts: formattedProducts,
				sortInfo: {
					sortBy,
					sortOrder,
					message: `Produtos ordenados por ${sortBy} (${sortOrder})`,
				},
			}
		} catch (error) {
			return { success: false, message: `Erro ao buscar produtos mais caros: ${error}` }
		}
	},
}
