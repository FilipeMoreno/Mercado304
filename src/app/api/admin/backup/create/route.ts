import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { exec } from "node:child_process"
import { NextResponse } from "next/server"
import { promisify } from "node:util"
import { generatePrismaBackup } from "@/lib/backup-utils"

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

		// Verificar se as variáveis de ambiente estão configuradas
		if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
			return NextResponse.json(
				{
					success: false,
					error: "Credenciais do R2 não configuradas. Configure as variáveis de ambiente.",
				},
				{ status: 500 },
			)
		}

		const DATABASE_URL = process.env.PRISMA_DATABASE_URL
		if (!DATABASE_URL) {
			return NextResponse.json({ success: false, error: "URL do banco de dados não configurada" }, { status: 500 })
		}

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
			const dbUrl = new URL(DATABASE_URL)
			const host = dbUrl.hostname
			const port = dbUrl.port || "5432"
			const database = dbUrl.pathname.slice(1)
			const username = dbUrl.username
			const password = dbUrl.password

			const command = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${username} -d ${database} --no-owner --no-acl`

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
		} catch (_error) {
			console.warn("[Backup] pg_dump não disponível, usando método alternativo (Prisma)...")
			backupMethod = "prisma"

			try {
				backupData = await generatePrismaBackup()
				console.log("[Backup] Backup via Prisma gerado. Tamanho:", (backupData.length / 1024 / 1024).toFixed(2), "MB")
			} catch (prismaError) {
				console.error("[Backup] Erro ao gerar backup via Prisma:", prismaError)
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

		// Fazer upload para o R2
		try {
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
				},
			})

			await s3Client.send(uploadCommand)
			console.log("[Backup] Upload concluído com sucesso!")

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
				},
			})
		} catch (error) {
			console.error("[Backup] Erro ao enviar para R2:", error)
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
