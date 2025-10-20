import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3"
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

export async function GET() {
	try {
		if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
			return NextResponse.json(
				{
					success: false,
					error: "Credenciais do R2 não configuradas",
				},
				{ status: 500 },
			)
		}

		const command = new ListObjectsV2Command({
			Bucket: R2_BUCKET_NAME,
			Prefix: "backups/",
		})

		const response = await s3Client.send(command)

		const backups = (response.Contents || [])
			.filter((item) => item.Key?.endsWith(".sql"))
			.map((item) => ({
				key: item.Key || "",
				fileName: item.Key?.replace("backups/", "") || "",
				size: item.Size || 0,
				sizeFormatted: `${((item.Size || 0) / 1024 / 1024).toFixed(2)} MB`,
				lastModified: item.LastModified?.toISOString() || "",
			}))
			.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())

		return NextResponse.json({
			success: true,
			backups,
			total: backups.length,
		})
	} catch (error) {
		console.error("[Backup List] Erro:", error)
		return NextResponse.json(
			{
				success: false,
				error: "Erro ao listar backups",
				details: error instanceof Error ? error.message : "Erro desconhecido",
			},
			{ status: 500 },
		)
	}
}
