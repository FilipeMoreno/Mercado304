import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { NextResponse } from "next/server"
import { generateIntegrityReport } from "@/lib/backup-integrity"

// Configuração do R2 da Cloudflare (compatível com S3)
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

export async function POST(request: Request) {
	try {
		// Verificar credenciais
		if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
			return NextResponse.json(
				{
					success: false,
					error: "Credenciais do R2 não configuradas",
				},
				{ status: 500 },
			)
		}

		const { key, fullValidation = false } = await request.json()

		if (!key) {
			return NextResponse.json(
				{
					success: false,
					error: "Chave do backup não fornecida",
				},
				{ status: 400 },
			)
		}

		console.log(`[Backup Validation] Validando backup: ${key}`)
		console.log(`[Backup Validation] Validação completa: ${fullValidation}`)

		// Baixar o backup do R2
		const getCommand = new GetObjectCommand({
			Bucket: R2_BUCKET_NAME,
			Key: key,
		})

		const response = await s3Client.send(getCommand)

		if (!response.Body) {
			return NextResponse.json(
				{
					success: false,
					error: "Backup não encontrado",
				},
				{ status: 404 },
			)
		}

		// Converter stream para string
		const backupContent = await response.Body.transformToString()

		// Executar validação de integridade
		const integrityReport = await generateIntegrityReport(backupContent, !fullValidation)

		console.log(`[Backup Validation] Validação concluída:`)
		console.log(`[Backup Validation] - Válido: ${integrityReport.isValid}`)
		console.log(`[Backup Validation] - Registros: ${integrityReport.recordCount}`)
		console.log(`[Backup Validation] - Tabelas: ${integrityReport.tables.length}`)
		console.log(`[Backup Validation] - Erros: ${integrityReport.validationErrors.length}`)

		return NextResponse.json({
			success: true,
			validation: {
				isValid: integrityReport.isValid,
				checksum: integrityReport.checksum,
				size: integrityReport.size,
				sizeFormatted: `${(integrityReport.size / 1024 / 1024).toFixed(2)} MB`,
				recordCount: integrityReport.recordCount,
				tablesCount: integrityReport.tables.length,
				validationErrors: integrityReport.validationErrors,
				tables: integrityReport.tables,
				validatedAt: integrityReport.createdAt,
				fullValidation,
			},
			backup: {
				key,
				lastModified: response.LastModified?.toISOString(),
				metadata: response.Metadata,
			},
		})
	} catch (error) {
		console.error("[Backup Validation] Erro ao validar backup:", error)
		return NextResponse.json(
			{
				success: false,
				error: "Erro ao validar backup",
				details: error instanceof Error ? error.message : "Erro desconhecido",
			},
			{ status: 500 },
		)
	}
}

export async function GET() {
	return NextResponse.json({
		success: true,
		message: "API de validação de backup",
		usage: {
			method: "POST",
			parameters: {
				key: "Chave do backup no R2 (ex: backups/backup-2023-01-01.sql)",
				fullValidation: "true para validação completa com banco, false para validação básica (padrão: false)",
			},
			examples: {
				basic: { key: "backups/backup-2023-01-01.sql" },
				full: { key: "backups/backup-2023-01-01.sql", fullValidation: true },
			},
		},
	})
}
