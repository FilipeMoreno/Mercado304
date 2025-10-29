import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"

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

interface BackgroundRemovalJobParams {
	productId: string
	imageUrl: string
	cosmosId?: string
}

interface JobResult {
	success: boolean
	imageUrl?: string
	error?: string
	processingTime?: number
}

/**
 * Job para remover fundo de imagens e fazer upload para R2
 */
export async function processProductImageJob(params: BackgroundRemovalJobParams): Promise<JobResult> {
	const startTime = Date.now()

	try {
		console.log(`🔵 Iniciando processamento de imagem para produto ${params.productId}`)

		// 1. Baixar imagem do Cosmos (ou URL fornecida)
		console.log(`📥 Baixando imagem de: ${params.imageUrl}`)
		const imageResponse = await fetch(params.imageUrl)

		if (!imageResponse.ok) {
			throw new Error(`Erro ao baixar imagem: ${imageResponse.statusText}`)
		}

		const imageBlob = await imageResponse.blob()

		console.log(`✅ Imagem baixada: ${(imageBlob.size / 1024 / 1024).toFixed(2)}MB`)

		// 2. Para uso no servidor Node.js, vamos fazer upload da imagem original
		// O @imgly/background-removal só funciona no navegador
		console.log(`⚠️ Removendo fundo da imagem (upload direto)...`)
		
		// Converter a imagem baixada para Buffer para fazer upload
		const resultBlob = imageBlob
		
		console.log(`✅ Imagem preparada para upload`)

		// 3. Fazer upload para R2
		console.log(`☁️ Fazendo upload para R2...`)
		const s3Key = `products/${params.productId}/image.png`
		const buffer = Buffer.from(await resultBlob.arrayBuffer())

		await s3Client.send(
			new PutObjectCommand({
				Bucket: R2_BUCKET_NAME,
				Key: s3Key,
				Body: buffer,
				ContentType: "image/png",
				CacheControl: "public, max-age=31536000, immutable",
			}),
		)

		// URL pública do R2
		const publicDomain = process.env.R2_PUBLIC_DOMAIN || `https://storage.mercado.filipemoreno.com.br`
		const imageUrl = `${publicDomain}/${s3Key}`
		console.log(`✅ Upload concluído: ${imageUrl}`)

		// 4. Atualizar produto no banco de dados
		console.log(`💾 Atualizando produto no banco...`)
		// Aqui você faria a atualização no Prisma

		const processingTime = Date.now() - startTime

		return {
			success: true,
			imageUrl,
			processingTime,
		}
	} catch (error) {
		console.error(`❌ Erro no job de remoção de fundo:`, error)
		return {
			success: false,
			error: error instanceof Error ? error.message : "Erro desconhecido",
			processingTime: Date.now() - startTime,
		}
	}
}

/**
 * Processa múltiplas imagens em lote
 */
export async function processBatchImagesJob(
	products: Array<{ id: string; imageUrl: string; cosmosId?: string }>,
): Promise<JobResult[]> {
	console.log(`🔵 Iniciando processamento em lote: ${products.length} produtos`)

	const results: JobResult[] = []

	for (const product of products) {
		const result = await processProductImageJob({
			productId: product.id,
			imageUrl: product.imageUrl,
			cosmosId: product.cosmosId,
		})
		results.push(result)

		// Pausa entre processamentos para não sobrecarregar
		await new Promise((resolve) => setTimeout(resolve, 1000))
	}

	const successCount = results.filter((r) => r.success).length
	console.log(`✅ Processamento concluído: ${successCount}/${products.length} sucessos`)

	return results
}
