import { exec } from "node:child_process"
import { promisify } from "node:util"
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { NextResponse } from "next/server"
import { resetBackupProgress, updateBackupProgress, updateBackupProgressWithAutoReset } from "@/lib/backup-progress-state"
import { generatePrismaBackup } from "@/lib/backup-utils"
import { generateIntegrityReport } from "@/lib/backup-integrity"
import { applyRetentionPolicy, DEFAULT_RETENTION_POLICY } from "@/lib/backup-retention"

const execAsync = promisify(exec)

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

export const maxDuration = 300 // 5 minutos de timeout

export async function POST(request: Request) {
	try {
		const { searchParams } = new URL(request.url)
		const isManual = searchParams.get("manual") === "true"

		// Resetar e iniciar progresso
		resetBackupProgress()
		updateBackupProgress({
			status: "creating",
			progress: 0,
			currentStep: "Inicializando backup...",
			startTime: Date.now(),
			estimatedTime: 30000, // 30 segundos estimados inicialmente
		})

		// Verificar se as variáveis de ambiente estão configuradas
		if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
			updateBackupProgressWithAutoReset({
				status: "error",
				progress: 0,
				currentStep: "Erro: Credenciais do R2 não configuradas",
				error: "Credenciais do R2 não configuradas",
			})
			return NextResponse.json(
				{
					success: false,
					error: "Credenciais do R2 não configuradas. Configure as variáveis de ambiente.",
				},
				{ status: 500 },
			)
		}

		const DATABASE_URL = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL
		if (!DATABASE_URL) {
			updateBackupProgressWithAutoReset({
				status: "error",
				progress: 0,
				currentStep: "Erro: URL do banco de dados não configurada",
				error: "URL do banco de dados não configurada",
			})
			return NextResponse.json({ success: false, error: "URL do banco de dados não configurada" }, { status: 500 })
		}

		updateBackupProgress({
			progress: 10,
			currentStep: "Preparando backup...",
		})

		// Gerar nome do arquivo de backup
		const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
		const backupFileName = `backup-${timestamp}.sql`

		console.log("[Backup] Iniciando backup do banco de dados...")
		console.log("[Backup] Arquivo:", backupFileName)

		// Gerar dump do PostgreSQL
		let backupData: string
		let backupMethod = "pg_dump"

		try {
			// Tentar usar pg_dump primeiro
			updateBackupProgress({
				progress: 20,
				currentStep: "Exportando dados do banco (pg_dump)...",
			})

			const dbUrl = new URL(DATABASE_URL)
			const host = dbUrl.hostname
			const port = dbUrl.port || "5432"
			const database = dbUrl.pathname.slice(1)
			const username = dbUrl.username
			const password = dbUrl.password

			const command = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${username} -d ${database} -Fp --no-owner --no-acl`

			console.log("[Backup] Tentando usar pg_dump...")
			const { stdout, stderr } = await execAsync(command, {
				maxBuffer: 50 * 1024 * 1024, // 50MB buffer
				timeout: 240000, // 4 minutos
			})

			if (stderr && !stderr.includes("WARNING")) {
				console.warn("[Backup] Avisos do pg_dump:", stderr)

				
			}

			backupData = stdout
			console.log("[Backup] pg_dump bem-sucedido. Tamanho:", (backupData.length / 1024 / 1024).toFixed(2), "MB")

			updateBackupProgress({
				progress: 60,
				currentStep: `Backup gerado (${(backupData.length / 1024 / 1024).toFixed(2)} MB)`,
			})
		} catch (_error) {
			console.warn("[Backup] pg_dump não disponível, usando método alternativo (Prisma)...")
			backupMethod = "prisma"

			updateBackupProgress({
				progress: 20,
				currentStep: "Exportando dados via Prisma...",
			})

			try {
				backupData = await generatePrismaBackup()
				console.log("[Backup] Backup via Prisma gerado. Tamanho:", (backupData.length / 1024 / 1024).toFixed(2), "MB")

				updateBackupProgress({
					progress: 60,
					currentStep: `Backup gerado via Prisma (${(backupData.length / 1024 / 1024).toFixed(2)} MB)`,
				})
			} catch (prismaError) {
				console.error("[Backup] Erro ao gerar backup via Prisma:", prismaError)
				updateBackupProgressWithAutoReset({
					status: "error",
					progress: 0,
					currentStep: "Erro ao gerar backup",
					error: prismaError instanceof Error ? prismaError.message : "Erro desconhecido",
				})
				return NextResponse.json(
					{
						success: false,
						error: "Erro ao gerar backup do banco de dados",
						details: prismaError instanceof Error ? prismaError.message : "Erro desconhecido",
					},
					{ status: 500 },
				)
			}
		}

		// Verificar integridade do backup
		updateBackupProgress({
			progress: 65,
			currentStep: "Verificando integridade do backup...",
		})

		console.log("[Backup] Verificando integridade...")
		// Usar verificação simplificada para evitar timeouts do pool de conexões
		const integrityReport = await generateIntegrityReport(backupData, true)
		
		if (!integrityReport.isValid) {
			console.error("[Backup] Falha na verificação de integridade:", integrityReport.validationErrors)
			updateBackupProgressWithAutoReset({
				status: "error",
				progress: 0,
				currentStep: "Falha na verificação de integridade",
				error: `Backup inválido: ${integrityReport.validationErrors.join(", ")}`,
			})
			return NextResponse.json(
				{
					success: false,
					error: "Backup falhou na verificação de integridade",
					details: integrityReport.validationErrors,
				},
				{ status: 500 },
			)
		}

		console.log("[Backup] Integridade verificada ✓")
		console.log("[Backup] - Registros:", integrityReport.recordCount)
		console.log("[Backup] - Checksum:", `${integrityReport.checksum.substring(0, 16)}...`)
		console.log("[Backup] - Tabelas:", integrityReport.tables.length)

		// Fazer upload para o R2
		try {
			updateBackupProgress({
				status: "uploading",
				progress: 70,
				currentStep: "Enviando backup para Cloudflare R2...",
			})

			console.log("[Backup] Enviando para R2...")
			const uploadCommand = new PutObjectCommand({
				Bucket: R2_BUCKET_NAME,
				Key: `backups/${backupFileName}`,
				Body: backupData,
				ContentType: "application/sql",
				Metadata: {
					timestamp: new Date().toISOString(),
					type: isManual ? "manual" : "automatic",
					size: backupData.length.toString(),
					method: backupMethod,
					checksum: integrityReport.checksum,
					recordCount: integrityReport.recordCount.toString(),
					tablesCount: integrityReport.tables.length.toString(),
					validated: "true",
				},
			})

			await s3Client.send(uploadCommand)
			console.log("[Backup] Upload concluído com sucesso!")

			// Aplicar política de retenção (somente para backups automáticos)
			if (!isManual) {
				updateBackupProgress({
					progress: 90,
					currentStep: "Aplicando política de retenção...",
				})

				try {
					console.log("[Backup] Aplicando política de retenção...")
					const retentionResult = await applyRetentionPolicy(s3Client, R2_BUCKET_NAME, DEFAULT_RETENTION_POLICY)
					
					console.log("[Backup] Política de retenção aplicada:")
					console.log("[Backup] - Backups mantidos:", retentionResult.kept.length)
					console.log("[Backup] - Backups deletados:", retentionResult.deleted.length)
					console.log("[Backup] - Espaço liberado:", ((retentionResult.totalSizeBefore - retentionResult.totalSizeAfter) / 1024 / 1024).toFixed(2), "MB")
					
					if (retentionResult.errors.length > 0) {
						console.warn("[Backup] Erros na política de retenção:", retentionResult.errors)
					}
				} catch (retentionError) {
					console.warn("[Backup] Erro ao aplicar política de retenção (não crítico):", retentionError)
					// Não falhar o backup por erro de retenção
				}
			}

			updateBackupProgressWithAutoReset({
				status: "completed",
				progress: 100,
				currentStep: "Backup concluído com sucesso!",
				backupInfo: {
					fileName: backupFileName,
					size: backupData.length,
					sizeFormatted: `${(backupData.length / 1024 / 1024).toFixed(2)} MB`,
					checksum: integrityReport.checksum,
					recordCount: integrityReport.recordCount,
					validated: true,
				},
			})

			return NextResponse.json({
				success: true,
				message: "Backup criado e enviado para R2 com sucesso",
				backup: {
					fileName: backupFileName,
					size: backupData.length,
					sizeFormatted: `${(backupData.length / 1024 / 1024).toFixed(2)} MB`,
					timestamp: new Date().toISOString(),
					location: `r2://${R2_BUCKET_NAME}/backups/${backupFileName}`,
					type: isManual ? "manual" : "automatic",
					method: backupMethod,
					integrity: {
						checksum: integrityReport.checksum,
						recordCount: integrityReport.recordCount,
						tablesCount: integrityReport.tables.length,
						validated: true,
						isValid: integrityReport.isValid,
					},
				},
			})
		} catch (error) {
			console.error("[Backup] Erro ao enviar para R2:", error)
			updateBackupProgressWithAutoReset({
				status: "error",
				progress: 0,
				currentStep: "Erro ao enviar backup para R2",
				error: error instanceof Error ? error.message : "Erro desconhecido",
			})
			return NextResponse.json(
				{
					success: false,
					error: "Erro ao enviar backup para o R2",
					details: error instanceof Error ? error.message : "Erro desconhecido",
				},
				{ status: 500 },
			)
		}
	} catch (error) {
		console.error("[Backup] Erro geral:", error)
		updateBackupProgressWithAutoReset({
			status: "error",
			progress: 0,
			currentStep: "Erro ao criar backup",
			error: error instanceof Error ? error.message : "Erro desconhecido",
		})
		return NextResponse.json(
			{
				success: false,
				error: "Erro ao criar backup",
				details: error instanceof Error ? error.message : "Erro desconhecido",
			},
			{ status: 500 },
		)
	}
}
