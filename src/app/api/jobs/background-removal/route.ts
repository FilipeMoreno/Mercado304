import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { processBatchImagesJob, processProductImageJob } from "@/lib/jobs/background-removal-job"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/jobs/background-removal
 * Processa remoção de fundo para um produto específico ou lote
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json()

		// Modo lote
		if (body.products && Array.isArray(body.products)) {
			const results = await processBatchImagesJob(body.products)

			// Atualizar produtos no banco
			for (let i = 0; i < results.length; i++) {
				const result = results[i]
				const product = body.products[i]

				if (result.success && result.imageUrl && product) {
					try {
						await prisma.product.update({
							where: { id: product.id },
							data: {
								imageUrl: result.imageUrl,
							},
						})
						console.log(`✅ Produto ${product.id} atualizado no banco`)
					} catch (error) {
						console.error(`❌ Erro ao atualizar produto ${product.id}:`, error)
					}
				}
			}

			return NextResponse.json({
				success: true,
				processed: results.filter((r) => r.success).length,
				total: results.length,
				results,
			})
		}

		// Processamento individual
		if (body.productId) {
			const result = await processProductImageJob({
				productId: body.productId,
				imageUrl: body.imageUrl,
				cosmosId: body.cosmosId,
			})

			// Atualizar produto no banco
			if (result.success && result.imageUrl) {
				try {
					await prisma.product.update({
						where: { id: body.productId },
						data: {
							imageUrl: result.imageUrl,
						},
					})
					console.log(`✅ Produto ${body.productId} atualizado no banco`)
				} catch (error) {
					console.error(`❌ Erro ao atualizar produto no banco:`, error)
				}
			}

			return NextResponse.json(result)
		}

		return NextResponse.json({ success: false, error: "Parâmetros inválidos" }, { status: 400 })
	} catch (error) {
		console.error("Erro no endpoint de background removal:", error)
		return NextResponse.json({ success: false, error: "Erro ao processar imagem" }, { status: 500 })
	}
}
