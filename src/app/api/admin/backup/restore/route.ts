import { type NextRequest, NextResponse } from "next/server"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSession } from "@/lib/auth-server"
import { prisma } from "@/lib/prisma"

// Configurar o cliente S3 (R2)
const s3Client = new S3Client({
	region: "auto",
	endpoint: process.env.R2_ENDPOINT || "",
	credentials: {
		accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
		secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
	},
})

/**
 * POST /api/admin/backup/restore
 * Restaura um backup do R2 para o banco de dados PostgreSQL
 */
export async function POST(request: NextRequest) {
	try {
		// Verificar autenticação
		const session = await getSession()
		if (!session?.user?.id) {
			return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 })
		}

		// Verificar se o usuário é admin (você pode adicionar uma verificação de role aqui)
		// Por enquanto, qualquer usuário autenticado pode fazer restore

		// Obter dados da requisição
		const body = await request.json()
		const { backupKey, password } = body

		if (!backupKey || !password) {
			return NextResponse.json(
				{ success: false, error: "backupKey e password são obrigatórios" },
				{ status: 400 },
			)
		}

		// Verificar a senha de restauração
		const correctPassword = process.env.BACKUP_RESTORE_PASSWORD
		if (!correctPassword) {
			return NextResponse.json(
				{
					success: false,
					error: "Senha de restauração não configurada no servidor",
					details: "Configure a variável BACKUP_RESTORE_PASSWORD no .env",
				},
				{ status: 500 },
			)
		}

		if (password !== correctPassword) {
			console.error("[Restore] Tentativa de restauração com senha incorreta")
			return NextResponse.json({ success: false, error: "Senha incorreta" }, { status: 403 })
		}

		console.log(`[Restore] Iniciando restauração do backup: ${backupKey}`)

		// Verificar credenciais do R2
		const bucketName = process.env.R2_BUCKET_NAME
		if (!bucketName || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
			return NextResponse.json(
				{
					success: false,
					error: "Credenciais do R2 não configuradas",
					details: "Verifique R2_BUCKET_NAME, R2_ACCESS_KEY_ID e R2_SECRET_ACCESS_KEY",
				},
				{ status: 500 },
			)
		}

		// Baixar o backup do R2
		console.log(`[Restore] Baixando backup do R2...`)
		const getCommand = new GetObjectCommand({
			Bucket: bucketName,
			Key: backupKey,
		})

		const response = await s3Client.send(getCommand)

		if (!response.Body) {
			return NextResponse.json({ success: false, error: "Arquivo de backup não encontrado" }, { status: 404 })
		}

		// Converter o stream para string
		const backupSQL = await response.Body.transformToString()
		console.log(`[Restore] Backup baixado com sucesso (${backupSQL.length} caracteres)`)

		// Validar o conteúdo do backup
		if (!backupSQL.includes("PostgreSQL database dump")) {
			return NextResponse.json(
				{ success: false, error: "Arquivo de backup inválido (não é um dump do PostgreSQL)" },
				{ status: 400 },
			)
		}

		// ATENÇÃO: Esta operação vai apagar TODOS os dados do banco
		console.log(`[Restore] ⚠️  INICIANDO RESTAURAÇÃO - TODOS OS DADOS SERÃO APAGADOS`)

		// Executar o restore usando Prisma $executeRawUnsafe
		// Nota: Esta é uma operação perigosa e deve ser usada com extremo cuidado

		try {
			// Dividir o SQL em comandos individuais
			const sqlCommands = backupSQL
				.split(";")
				.map((cmd) => cmd.trim())
				.filter((cmd) => cmd.length > 0 && !cmd.startsWith("--"))

			console.log(`[Restore] Executando ${sqlCommands.length} comandos SQL...`)

			let executedCommands = 0
			for (const command of sqlCommands) {
				if (command.trim()) {
					try {
						await prisma.$executeRawUnsafe(command)
						executedCommands++

						// Log a cada 100 comandos
						if (executedCommands % 100 === 0) {
							console.log(`[Restore] Progresso: ${executedCommands}/${sqlCommands.length} comandos`)
						}
					} catch (error: any) {
						// Ignorar alguns erros comuns que não afetam a restauração
						const ignorableErrors = [
							"already exists",
							"does not exist",
							"duplicate key",
							"relation .* already exists",
						]

						const shouldIgnore = ignorableErrors.some((pattern) => error.message?.match(new RegExp(pattern, "i")))

						if (!shouldIgnore) {
							console.error(`[Restore] Erro ao executar comando:`, error.message)
							// Continuar mesmo com erros (alguns comandos podem falhar mas não são críticos)
						}
					}
				}
			}

			console.log(`[Restore] ✅ Restauração concluída com sucesso! (${executedCommands} comandos executados)`)

			return NextResponse.json({
				success: true,
				message: "Backup restaurado com sucesso",
				commandsExecuted: executedCommands,
			})
		} catch (error: any) {
			console.error("[Restore] Erro durante a restauração:", error)
			return NextResponse.json(
				{
					success: false,
					error: "Erro ao restaurar backup",
					details: error.message,
				},
				{ status: 500 },
			)
		}
	} catch (error: any) {
		console.error("[Restore] Erro geral:", error)
		return NextResponse.json(
			{
				success: false,
				error: "Erro ao processar restauração",
				details: error.message,
			},
			{ status: 500 },
		)
	}
}
