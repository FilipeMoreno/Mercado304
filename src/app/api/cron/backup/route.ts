// API Route para Cron Job da Vercel
// Adicione no vercel.json:
// {
//   "crons": [{
//     "path": "/api/cron/backup",
//     "schedule": "0 3 * * *"
//   }]
// }

import { NextResponse } from "next/server"

export const maxDuration = 300 // 5 minutos

/**
 * Verifica se há um backup em execução
 * Previne execuções duplicadas do cron
 */
async function checkIfBackupIsRunning(): Promise<boolean> {
	try {
		const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000"
		const response = await fetch(`${baseUrl}/api/admin/backup/progress`)
		
		if (!response.ok) {
			return false
		}
		
		const data = await response.json()
		return data.status === "creating" || data.status === "uploading"
	} catch (error) {
		console.warn("[Cron Backup] Erro ao verificar status do backup:", error)
		return false
	}
}

export async function GET(request: Request) {
	try {
		// Verificar se a requisição vem do cron da Vercel
		const authHeader = request.headers.get("authorization")
		const cronSecret = process.env.CRON_SECRET
		const userAgent = request.headers.get("user-agent")
		const forwardedFor = request.headers.get("x-forwarded-for")

		// Melhor validação de segurança
		if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
			console.log("[Cron Backup] Acesso não autorizado")
			console.log("[Cron Backup] User-Agent:", userAgent)
			console.log("[Cron Backup] IP:", forwardedFor)
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		// Verificar se já existe um backup em execução (evitar duplicatas)
		const isBackupRunning = await checkIfBackupIsRunning()
		if (isBackupRunning) {
			console.log("[Cron Backup] Backup já está em execução, pulando...")
			return NextResponse.json({ 
				success: true, 
				message: "Backup já está em execução", 
				skipped: true 
			})
		}

		console.log("[Cron Backup] Iniciando backup automático...")

		// Chamar a API de backup
		const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000"
		const backupResponse = await fetch(`${baseUrl}/api/admin/backup/create`, {
			method: "POST",
		})

		if (!backupResponse.ok) {
			const error = await backupResponse.json()
			console.error("[Cron Backup] Erro ao criar backup:", error)
			return NextResponse.json(
				{
					success: false,
					error: "Erro ao criar backup",
					details: error,
				},
				{ status: 500 },
			)
		}

		const result = await backupResponse.json()
		console.log("[Cron Backup] Backup criado com sucesso:", result.backup?.fileName)

		return NextResponse.json({
			success: true,
			message: "Backup automático criado com sucesso",
			backup: result.backup,
			timestamp: new Date().toISOString(),
		})
	} catch (error) {
		console.error("[Cron Backup] Erro:", error)
		return NextResponse.json(
			{
				success: false,
				error: "Erro ao executar backup automático",
				details: error instanceof Error ? error.message : "Erro desconhecido",
			},
			{ status: 500 },
		)
	}
}
