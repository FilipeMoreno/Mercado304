import { PutObjectCommand } from "@aws-sdk/client-s3"
import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-server"
import { R2_BUCKET_NAME, R2_PUBLIC_URL, r2Client } from "@/lib/r2-client"

// POST /api/upload/image - Upload image to Cloudflare R2
export async function POST(request: Request) {
	try {
		// Verificar autenticação
		const session = await getSession()
		if (!session?.user) {
			return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
		}

		// Obter tipo de entidade (folder)
		const { searchParams } = new URL(request.url)
		const folder = searchParams.get("folder") || "uploads"

		// Validar folder
		const validFolders = ["markets", "brands", "products", "uploads"]
		if (!validFolders.includes(folder)) {
			return NextResponse.json(
				{ error: "Tipo de pasta inválido" },
				{ status: 400 },
			)
		}

		// Verificar configuração do R2
		if (!R2_BUCKET_NAME || !R2_PUBLIC_URL) {
			return NextResponse.json(
				{ error: "Configuração de storage não encontrada" },
				{ status: 500 },
			)
		}

		// Obter arquivo do FormData
		const formData = await request.formData()
		const file = formData.get("file") as File
		if (!file) {
			return NextResponse.json(
				{ error: "Nenhum arquivo foi enviado" },
				{ status: 400 },
			)
		}

		// Validar tipo de arquivo
		if (!file.type.startsWith("image/")) {
			return NextResponse.json(
				{ error: "Arquivo deve ser uma imagem" },
				{ status: 400 },
			)
		}

		// Validar tamanho (máximo 5MB)
		const maxSize = 5 * 1024 * 1024 // 5MB
		if (file.size > maxSize) {
			return NextResponse.json(
				{ error: "Arquivo deve ter no máximo 5MB" },
				{ status: 400 },
			)
		}

		// Gerar nome único para o arquivo
		const timestamp = Date.now()
		const randomStr = Math.random().toString(36).substring(2, 15)
		const extension = file.name.split(".").pop()
		const entityName = folder.slice(0, -1) // Remove 's' from plural (markets -> market)
		const fileName = `${folder}/${entityName}_${timestamp}_${randomStr}.${extension}`

		// Converter arquivo para buffer
		const arrayBuffer = await file.arrayBuffer()
		const buffer = Buffer.from(arrayBuffer)

		// Upload para Cloudflare R2
		const command = new PutObjectCommand({
			Bucket: R2_BUCKET_NAME,
			Key: fileName,
			Body: buffer,
			ContentType: file.type,
			CacheControl: "public, max-age=31536000", // Cache por 1 ano
		})

		await r2Client.send(command)

		// URL pública da imagem
		const imageUrl = `${R2_PUBLIC_URL}/${fileName}`

		return NextResponse.json({ imageUrl }, { status: 201 })
	} catch (error) {
		console.error("[IMAGE_UPLOAD]", error)
		return NextResponse.json(
			{ error: "Erro ao fazer upload da imagem" },
			{ status: 500 },
		)
	}
}

// DELETE /api/upload/image - Delete image from Cloudflare R2
export async function DELETE(request: Request) {
	try {
		// Verificar autenticação
		const session = await getSession()
		if (!session?.user) {
			return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
		}

		// Verificar configuração do R2
		if (!R2_BUCKET_NAME || !R2_PUBLIC_URL) {
			return NextResponse.json(
				{ error: "Configuração de storage não encontrada" },
				{ status: 500 },
			)
		}

		// Obter URL da imagem
		const { searchParams } = new URL(request.url)
		const imageUrl = searchParams.get("url")
		if (!imageUrl) {
			return NextResponse.json(
				{ error: "URL da imagem não informada" },
				{ status: 400 },
			)
		}

		// Extrair caminho do arquivo da URL
		// URL format: https://storage.mercado.filipemoreno.com.br/brands/brand_123_abc.png
		const urlPattern = new RegExp(
			`${R2_PUBLIC_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/(.+)`,
		)
		const match = imageUrl.match(urlPattern)
		if (!match) {
			return NextResponse.json(
				{ error: "URL de imagem inválida" },
				{ status: 400 },
			)
		}

		const filePath = match[1]

		// Deletar do Cloudflare R2
		const { DeleteObjectCommand } = await import("@aws-sdk/client-s3")
		const command = new DeleteObjectCommand({
			Bucket: R2_BUCKET_NAME,
			Key: filePath,
		})

		await r2Client.send(command)

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error("[IMAGE_DELETE]", error)
		return NextResponse.json(
			{ error: "Erro ao deletar imagem" },
			{ status: 500 },
		)
	}
}
