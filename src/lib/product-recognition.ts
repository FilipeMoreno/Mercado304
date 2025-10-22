import { normalizeBarcode } from "@/lib/barcode-utils"
import { prisma } from "@/lib/prisma"

export interface ProductRecognitionResult {
	productName: string
	brand: string
	barcode: string | null
	category: string
	description: string
	weight: string | null
	price: number | null
	ingredients: string[] | null
	nutritionalInfo: any | null
	confidence: number
}

export interface ProductSearchResult {
	found: boolean
	product?: {
		id: string
		name: string
		brand: string
		category: string
		barcode: string
		description?: string
		weight?: string
		priceHistory: {
			id: string
			price: number
			marketName: string
			marketId: string
			date: Date
		}[]
		purchaseHistory: {
			id: string
			quantity: number
			totalPrice: number
			marketName: string
			date: Date
		}[]
		lowestPrice?: {
			price: number
			marketName: string
			marketId: string
			date: Date
		}
		averagePrice?: number
	}
	recognitionData: ProductRecognitionResult
}

export async function searchProductByBarcode(barcode: string): Promise<any> {
	if (!barcode) return null

	const normalizedBarcode = normalizeBarcode(barcode)

	// Buscar produto pelo código de barras original ou normalizado
	const product = await prisma.product.findFirst({
		where: {
			OR: [{ barcode: barcode }, { barcode: normalizedBarcode }],
		},
		include: {
			brand: true,
			category: true,
			priceRecords: {
				include: {
					market: true,
				},
				orderBy: {
					createdAt: "desc",
				},
			},
			purchaseItems: {
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
			},
		},
	})

	return product
}

export async function processProductRecognition(
	recognitionData: ProductRecognitionResult,
): Promise<ProductSearchResult> {
	let foundProduct = null

	// Se temos um código de barras, tentar buscar o produto
	if (recognitionData.barcode) {
		foundProduct = await searchProductByBarcode(recognitionData.barcode)
	}

	if (foundProduct) {
		// Calcular estatísticas de preço
		const prices = foundProduct.priceRecords.map((record: any) => record.price)
		const averagePrice =
			prices.length > 0 ? prices.reduce((sum: number, price: number) => sum + price, 0) / prices.length : undefined

		const lowestPriceRecord = foundProduct.priceRecords.reduce((lowest: any, current: any) => {
			return !lowest || current.price < lowest.price ? current : lowest
		}, null)

		return {
			found: true,
			product: {
				id: foundProduct.id,
				name: foundProduct.name,
				brand: foundProduct.brand?.name || "",
				category: foundProduct.category?.name || "",
				barcode: foundProduct.barcode,
				description: foundProduct.description,
				weight: foundProduct.weight,
				priceHistory: foundProduct.priceRecords.map((record: any) => ({
					id: record.id,
					price: record.price,
					marketName: record.market.name,
					marketId: record.market.id,
					date: record.createdAt,
				})),
				purchaseHistory: foundProduct.purchaseItems.map((item: any) => ({
					id: item.id,
					quantity: item.quantity,
					totalPrice: item.quantity * item.unitPrice,
					marketName: item.purchase.market.name,
					date: item.purchase.createdAt,
				})),
				...(lowestPriceRecord ? {
					lowestPrice: {
						price: lowestPriceRecord.price,
						marketName: lowestPriceRecord.market.name,
						marketId: lowestPriceRecord.market.id,
						date: lowestPriceRecord.createdAt,
					}
				} : {}),
				...(averagePrice ? { averagePrice } : {}),
			},
			recognitionData,
		}
	}

	return {
		found: false,
		recognitionData,
	}
}

export async function createProductFromRecognition(
	recognitionData: ProductRecognitionResult,
	_userId: string,
): Promise<string> {
	// Buscar ou criar categoria
	let category = null
	if (recognitionData.category) {
		category = await prisma.category.findFirst({
			where: { name: { contains: recognitionData.category, mode: "insensitive" } },
		})

		if (!category) {
			category = await prisma.category.create({
				data: {
					name: recognitionData.category,
				},
			})
		}
	}

	// Buscar ou criar marca
	let brand = null
	if (recognitionData.brand) {
		brand = await prisma.brand.findFirst({
			where: { name: { contains: recognitionData.brand, mode: "insensitive" } },
		})

		if (!brand) {
			brand = await prisma.brand.create({
				data: {
					name: recognitionData.brand,
				},
			})
		}
	}

	// Criar produto
	const product = await prisma.product.create({
		data: {
			name: recognitionData.productName,
			barcode: recognitionData.barcode,
			...(category?.id ? { categoryId: category.id } : {}),
			...(brand?.id ? { brandId: brand.id } : {}),
		},
	})

	return product.id
}
