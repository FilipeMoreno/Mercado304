import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
	try {
		const body = await request.json()
		const { 
			shoppingListItemId,
			productData 
		} = body

		if (!shoppingListItemId || !productData) {
			return NextResponse.json({ error: "shoppingListItemId e productData são obrigatórios" }, { status: 400 })
		}

		// Buscar o item temporário
		const tempItem = await prisma.shoppingListItem.findUnique({
			where: { id: shoppingListItemId },
		})

		if (!tempItem || !tempItem.isTemporary) {
			return NextResponse.json({ error: "Item temporário não encontrado" }, { status: 404 })
		}

		// Verificar se a categoria existe ou criar uma nova
		let categoryId = productData.categoryId
		if (!categoryId && productData.categoryName) {
			const category = await prisma.category.findFirst({
				where: { name: { equals: productData.categoryName, mode: "insensitive" } }
			})

			if (category) {
				categoryId = category.id
			} else {
				const newCategory = await prisma.category.create({
					data: {
						name: productData.categoryName,
						icon: "📦",
						color: "#64748b",
						isFood: true,
					}
				})
				categoryId = newCategory.id
			}
		}

		// Verificar se a marca existe ou criar uma nova
		let brandId = productData.brandId
		if (!brandId && productData.brandName) {
			const brand = await prisma.brand.findFirst({
				where: { name: { equals: productData.brandName, mode: "insensitive" } }
			})

			if (brand) {
				brandId = brand.id
			} else {
				const newBrand = await prisma.brand.create({
					data: {
						name: productData.brandName,
					}
				})
				brandId = newBrand.id
			}
		}

		// Criar o produto permanente
		const newProduct = await prisma.product.create({
			data: {
				name: productData.name,
				barcode: productData.barcode || tempItem.tempBarcode,
				categoryId: categoryId,
				brandId: brandId,
				unit: productData.unit || tempItem.productUnit || "un",
				hasStock: productData.hasStock || false,
				minStock: productData.minStock || 0,
				maxStock: productData.maxStock || 0,
				hasExpiration: productData.hasExpiration || false,
				defaultShelfLifeDays: productData.defaultShelfLifeDays || 30,
			},
			include: {
				category: true,
				brand: true,
			}
		})

		// Atualizar o item da lista para referenciar o produto criado
		const updatedItem = await prisma.shoppingListItem.update({
			where: { id: shoppingListItemId },
			data: {
				productId: newProduct.id,
				productName: newProduct.name,
				productUnit: newProduct.unit,
				isTemporary: false,
				tempDescription: null,
				tempBarcode: null,
				tempBrand: null,
				tempCategory: null,
				tempNotes: null,
			},
			include: {
				product: {
					include: {
						brand: true,
						category: true,
					},
				},
			},
		})

		return NextResponse.json({
			product: newProduct,
			updatedItem: updatedItem,
		})
	} catch (error) {
		console.error("Erro ao converter item temporário:", error)
		return NextResponse.json({ error: "Erro ao converter item temporário" }, { status: 500 })
	}
}