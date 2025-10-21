import { NextResponse } from "next/server"
import { backupProgressState } from "@/lib/backup-progress-state"

export async function GET() {
	try {
		const progress = backupProgressState.current
		const elapsedTime = progress.startTime > 0 ? Date.now() - progress.startTime : 0

		return NextResponse.json({
			success: true,
			progress: {
				...progress,
				elapsedTime,
			},
		})
	} catch (error) {
		console.error("[Backup Progress] Erro:", error)
		return NextResponse.json(
			{
				success: false,
				error: "Erro ao obter progresso do backup",
			},
			{ status: 500 },
		)
	}
}
