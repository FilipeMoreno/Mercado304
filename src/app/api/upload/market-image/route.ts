import { PutObjectCommand } from "@aws-sdk/client-s3"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { R2_BUCKET_NAME, R2_PUBLIC_URL, r2Client } from "@/lib/r2-client"

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData()
		const file = formData.get("image") as File

		if (!file) {
			return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
		}

		// Validar tipo de arquivo
		if (!file.type.startsWith("image/")) {
			return NextResponse.json({ error: "Arquivo deve ser uma imagem" }, { status: 400 })
		}

		// Validar tamanho (máximo 5MB)
		if (file.size > 5 * 1024 * 1024) {
			return NextResponse.json({ error: "Arquivo deve ter no máximo 5MB" }, { status: 400 })
		}

		// Gerar nome único para o arquivo
		const timestamp = Date.now()
		const randomString = Math.random().toString(36).substring(2, 15)
		const fileExtension = file.name.split(".").pop()
		const fileName = `markets/market_${timestamp}_${randomString}.${fileExtension}`

		// Converter arquivo para buffer
		const bytes = await file.arrayBuffer()
		const buffer = Buffer.from(bytes)

		// Upload para o R2
		const command = new PutObjectCommand({
			Bucket: R2_BUCKET_NAME,
			Key: fileName,
			Body: buffer,
			ContentType: file.type,
			CacheControl: "public, max-age=31536000", // Cache por 1 ano
		})

		await r2Client.send(command)

		// Retornar URL pública da imagem
		const imageUrl = `${R2_PUBLIC_URL}/${fileName}`

		return NextResponse.json({ imageUrl })
	} catch (error) {
		console.error("Erro no upload:", error)
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
	}
}
