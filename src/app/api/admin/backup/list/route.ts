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
		// Verificar configuração do R2
		console.log("[Backup List] Verificando credenciais do R2...")
		console.log("[Backup List] R2_ACCOUNT_ID:", R2_ACCOUNT_ID ? "✓ Configurado" : "✗ Não configurado")
		console.log("[Backup List] R2_ACCESS_KEY_ID:", R2_ACCESS_KEY_ID ? "✓ Configurado" : "✗ Não configurado")
		console.log("[Backup List] R2_SECRET_ACCESS_KEY:", R2_SECRET_ACCESS_KEY ? "✓ Configurado" : "✗ Não configurado")
		console.log("[Backup List] R2_BUCKET_NAME:", R2_BUCKET_NAME)

		if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
			console.error("[Backup List] Credenciais do R2 não configuradas")
			return NextResponse.json(
				{
					success: false,
					error:
						"Credenciais do R2 não configuradas. Configure as variáveis de ambiente R2_ACCOUNT_ID, R2_ACCESS_KEY_ID e R2_SECRET_ACCESS_KEY.",
					details: "Verifique a documentação em ENV_VARIABLES.md",
				},
				{ status: 500 },
			)
		}

		console.log("[Backup List] Listando objetos no bucket:", R2_BUCKET_NAME)

		const command = new ListObjectsV2Command({
			Bucket: R2_BUCKET_NAME,
			Prefix: "backups/",
		})

		const response = await s3Client.send(command)

		console.log("[Backup List] Resposta do R2:")
		console.log("[Backup List] - Total de objetos:", response.Contents?.length || 0)
		console.log("[Backup List] - Bucket:", response.Name)
		console.log("[Backup List] - Prefix:", response.Prefix)

		const backups = (response.Contents || [])
			.filter((item) => {
				const isSQL = item.Key?.endsWith(".sql")
				if (!isSQL && item.Key) {
					console.log("[Backup List] Ignorando arquivo não-SQL:", item.Key)
				}
				return isSQL
			})
			.map((item) => {
				const backup = {
					key: item.Key || "",
					fileName: item.Key?.replace("backups/", "") || "",
					size: item.Size || 0,
					sizeFormatted: `${((item.Size || 0) / 1024 / 1024).toFixed(2)} MB`,
					lastModified: item.LastModified?.toISOString() || "",
				}
				console.log("[Backup List] Backup encontrado:", backup.fileName, "-", backup.sizeFormatted)
				return backup
			})
			.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())

		console.log("[Backup List] Total de backups .sql:", backups.length)

		return NextResponse.json({
			success: true,
			backups,
			total: backups.length,
		})
	} catch (error) {
		console.error("[Backup List] Erro ao listar backups:", error)

		// Logs detalhados do erro
		if (error instanceof Error) {
			console.error("[Backup List] Mensagem de erro:", error.message)
			console.error("[Backup List] Stack trace:", error.stack)
		}

		// Verificar se é erro de credenciais
		const errorMessage = error instanceof Error ? error.message : String(error)
		const isCredentialError =
			errorMessage.includes("credentials") ||
			errorMessage.includes("access") ||
			errorMessage.includes("forbidden") ||
			errorMessage.includes("unauthorized")

		return NextResponse.json(
			{
				success: false,
				error: isCredentialError
					? "Erro de autenticação no R2. Verifique suas credenciais."
					: "Erro ao listar backups no R2",
				details: error instanceof Error ? error.message : "Erro desconhecido",
				hint: isCredentialError
					? "Verifique se as variáveis R2_ACCOUNT_ID, R2_ACCESS_KEY_ID e R2_SECRET_ACCESS_KEY estão corretas."
					: "Verifique os logs do servidor para mais detalhes.",
			},
			{ status: 500 },
		)
	}
}
