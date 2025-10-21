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

export async function GET(request: Request) {
	try {
		// Verificar se a requisição vem do cron da Vercel
		const authHeader = request.headers.get("authorization")
		const cronSecret = process.env.CRON_SECRET

		if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
			console.log("[Cron Backup] Acesso não autorizado")
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		console.log("[Cron Backup] Iniciando backup automático...")

		// Chamar a API de backup
		const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
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
