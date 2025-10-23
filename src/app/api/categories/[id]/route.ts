import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_request: Request, { params }: { params: { id: string } }) {
	try {
		const category = await prisma.category.findUnique({
			where: { id: params.id },
			include: {
				products: {
					include: {
						brand: true,
						category: true,
					},
					orderBy: { name: "asc" },
				},
				// NOVO: Adicionar a contagem de produtos diretamente na consulta
				_count: {
					select: { products: true },
				},
			},
		})

		if (!category) {
			return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 })
		}

		return NextResponse.json(category)
	} catch (_error) {
		return NextResponse.json({ error: "Erro ao buscar categoria" }, { status: 500 })
	}
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
	try {
		const body = await request.json()
		const { name, icon, color, isFood } = body

		const category = await prisma.category.update({
			where: { id: params.id },
			data: {
				name,
				icon,
				color,
				isFood,
			},
		})

		return NextResponse.json(category)
	} catch (error: any) {
		if (error.code === "P2002") {
			return NextResponse.json({ error: "Categoria já existe" }, { status: 400 })
		}
		if (error.code === "P2025") {
			return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 })
		}
		return NextResponse.json({ error: "Erro ao atualizar categoria" }, { status: 500 })
	}
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
	try {
		const body = await request.json().catch(() => ({}))
		const { transferData } = body

		// Verificar se a categoria existe e contar produtos
		const category = await prisma.category.findUnique({
			where: { id: params.id },
			include: {
				_count: {
					select: { products: true },
				},
			},
		})

		if (!category) {
			return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 })
		}

		const hasProducts = category._count.products > 0

		// Se tem produtos, transferData é obrigatório
		if (hasProducts && !transferData) {
			return NextResponse.json(
				{ error: "Esta categoria possui produtos. Especifique como transferi-los." },
				{ status: 400 },
			)
		}

		// Processar transferência se necessário
		if (hasProducts && transferData) {
			if (transferData.mode === "transfer-all") {
				// Transferir todos os produtos para uma categoria existente
				if (!transferData.targetCategoryId) {
					return NextResponse.json({ error: "Categoria de destino não especificada" }, { status: 400 })
				}

				await prisma.product.updateMany({
					where: { categoryId: params.id },
					data: { categoryId: transferData.targetCategoryId },
				})
			} else if (transferData.mode === "create-new") {
				// Criar nova categoria e transferir todos os produtos
				if (!transferData.newCategoryName) {
					return NextResponse.json({ error: "Nome da nova categoria não especificado" }, { status: 400 })
				}

				const newCategory = await prisma.category.create({
					data: {
						name: transferData.newCategoryName,
						icon: transferData.newCategoryIcon || "📦",
						color: transferData.newCategoryColor || "#3b82f6",
						isFood: category.isFood, // Herdar tipo da categoria original
					},
				})

				await prisma.product.updateMany({
					where: { categoryId: params.id },
					data: { categoryId: newCategory.id },
				})
			} else if (transferData.mode === "individual") {
				// Transferir produtos individualmente
				if (!transferData.individualTransfers) {
					return NextResponse.json({ error: "Transferências individuais não especificadas" }, { status: 400 })
				}

				// Executar todas as transferências em paralelo
				const updates = Object.entries(transferData.individualTransfers).map(([productId, categoryId]) =>
					prisma.product.update({
						where: { id: productId },
						data: { categoryId: categoryId as string },
					}),
				)

				await Promise.all(updates)
			}
		}

		// Agora podemos deletar a categoria com segurança
		await prisma.category.delete({
			where: { id: params.id },
		})

		return NextResponse.json({ 
			success: true,
			message: hasProducts 
				? `Categoria excluída e ${category._count.products} produtos transferidos com sucesso!`
				: "Categoria excluída com sucesso!"
		})
	} catch (error: any) {
		console.error("[DeleteCategory] Erro:", error)
		if (error.code === "P2025") {
			return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 })
		}
		if (error.code === "P2003") {
			return NextResponse.json(
				{ error: "Não é possível excluir esta categoria pois ela possui produtos associados" },
				{ status: 400 },
			)
		}
		return NextResponse.json({ error: "Erro ao excluir categoria" }, { status: 500 })
	}
}
