import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "mercado304"

const s3Client = new S3Client({
	region: "auto",
	endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId: R2_ACCESS_KEY_ID || "",
		secretAccessKey: R2_SECRET_ACCESS_KEY || "",
	},
})

/**
 * POST /api/jobs/background-removal-worker
 * Worker para processar remoção de fundo no servidor Node.js
 * Usa uma abordagem diferente do @imgly/background-removal
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const { productId, imageUrl } = body

		if (!productId || !imageUrl) {
			return NextResponse.json({ success: false, error: "Parâmetros inválidos" }, { status: 400 })
		}

		console.log(`🔵 Iniciando processamento para produto ${productId}`)

		// Baixar imagem
		console.log(`📥 Baixando imagem de: ${imageUrl}`)
		const imageResponse = await fetch(imageUrl)

		if (!imageResponse.ok) {
			throw new Error(`Erro ao baixar imagem: ${imageResponse.statusText}`)
		}

		const imageBlob = await imageResponse.blob()
		console.log(`✅ Imagem baixada: ${(imageBlob.size / 1024 / 1024).toFixed(2)}MB`)

		// Converter blob para base64 ou usar método alternativo
		// Para uso no servidor, vamos usar uma abordagem diferente
		const arrayBuffer = await imageBlob.arrayBuffer()
		const buffer = Buffer.from(arrayBuffer)

		// Por enquanto, vamos fazer upload da imagem original sem remover fundo
		// TODO: Implementar remoção de fundo usando biblioteca compatível com Node.js
		console.log(`⚠️ Remoção de fundo desabilitada (requer execução no navegador)`)

		const s3Key = `products/${productId}/image-no-background.png`
		await s3Client.send(
			new PutObjectCommand({
				Bucket: R2_BUCKET_NAME,
				Key: s3Key,
				Body: buffer,
				ContentType: imageBlob.type || "image/png",
				CacheControl: "public, max-age=31536000, immutable",
			}),
		)

		const publicDomain = process.env.R2_PUBLIC_DOMAIN || `https://pub-${R2_ACCOUNT_ID}.r2.dev`
		const finalImageUrl = `${publicDomain}/${s3Key}`
		console.log(`✅ Upload concluído: ${finalImageUrl}`)

		return NextResponse.json({
			success: true,
			imageUrl: finalImageUrl,
			processingTime: 0,
			warning: "Remoção de fundo não aplicada (requer execução no navegador)",
		})
	} catch (error) {
		console.error("❌ Erro no worker:", error)
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Erro desconhecido",
			},
			{ status: 500 },
		)
	}
}


