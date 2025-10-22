import { S3Client } from "@aws-sdk/client-s3"
import { NextResponse } from "next/server"
import { applyRetentionPolicy, DEFAULT_RETENTION_POLICY, generateRetentionReport } from "@/lib/backup-retention"

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

		// Opcionalmente permitir política customizada
		const body = await request.json().catch(() => ({}))
		const customPolicy = body.policy || DEFAULT_RETENTION_POLICY

		console.log("[Retention] Aplicando política de retenção manual...")
		console.log("[Retention] Política:", JSON.stringify(customPolicy, null, 2))

		// Aplicar política de retenção
		const result = await applyRetentionPolicy(s3Client, R2_BUCKET_NAME, customPolicy)

		// Gerar relatório
		const report = generateRetentionReport(result)

		console.log("[Retention] Política aplicada com sucesso")
		console.log(report)

		return NextResponse.json({
			success: true,
			message: "Política de retenção aplicada com sucesso",
			result: {
				backupsKept: result.kept.length,
				backupsDeleted: result.deleted.length,
				spaceSaved: `${((result.totalSizeBefore - result.totalSizeAfter) / 1024 / 1024).toFixed(2)} MB`,
				totalSizeBefore: `${(result.totalSizeBefore / 1024 / 1024).toFixed(2)} MB`,
				totalSizeAfter: `${(result.totalSizeAfter / 1024 / 1024).toFixed(2)} MB`,
				errors: result.errors,
				deletedFiles: result.deleted,
				policy: customPolicy,
			},
			report,
		})
	} catch (error) {
		console.error("[Retention] Erro ao aplicar política:", error)
		return NextResponse.json(
			{
				success: false,
				error: "Erro ao aplicar política de retenção",
				details: error instanceof Error ? error.message : "Erro desconhecido",
			},
			{ status: 500 },
		)
	}
}

export async function GET() {
	try {
		// Retornar política atual
		return NextResponse.json({
			success: true,
			currentPolicy: DEFAULT_RETENTION_POLICY,
			description: {
				dailyRetentionDays: "Manter backups diários pelos últimos X dias",
				weeklyRetentionWeeks: "Manter backups semanais pelas últimas X semanas",
				monthlyRetentionMonths: "Manter backups mensais pelos últimos X meses",
				maxTotalSize: "Tamanho máximo total dos backups (em bytes)",
				maxBackupCount: "Número máximo de backups a manter",
			},
		})
	} catch (error) {
		console.error("[Retention] Erro ao obter política:", error)
		return NextResponse.json(
			{
				success: false,
				error: "Erro ao obter política de retenção",
			},
			{ status: 500 },
		)
	}
}
