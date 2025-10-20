import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { NextResponse } from "next/server"

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "mercado304-backups"

const s3Client = new S3Client({
	region: "auto",
	endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId: R2_ACCESS_KEY_ID || "",
		secretAccessKey: R2_SECRET_ACCESS_KEY || "",
	},
})

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)
		const key = searchParams.get("key")

		if (!key) {
			return NextResponse.json({ error: "Parâmetro 'key' é obrigatório" }, { status: 400 })
		}

		if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
			return NextResponse.json({ error: "Credenciais do R2 não configuradas" }, { status: 500 })
		}

		const command = new GetObjectCommand({
			Bucket: R2_BUCKET_NAME,
			Key: key,
		})

		const response = await s3Client.send(command)

		if (!response.Body) {
			return NextResponse.json({ error: "Backup não encontrado" }, { status: 404 })
		}

		// Converter stream para string
		const backupData = await response.Body.transformToString()

		// Retornar como download
		const fileName = key.split("/").pop() || "backup.sql"

		return new NextResponse(backupData, {
			headers: {
				"Content-Type": "application/sql",
				"Content-Disposition": `attachment; filename="${fileName}"`,
			},
		})
	} catch (error) {
		console.error("[Backup Download] Erro:", error)
		return NextResponse.json(
			{
				error: "Erro ao baixar backup",
				details: error instanceof Error ? error.message : "Erro desconhecido",
			},
			{ status: 500 },
		)
	}
}
