import type { Metadata } from "next"
import { PrismaStatsDashboard } from "@/components/prisma-stats-dashboard"

export const metadata: Metadata = {
	title: "Estatísticas Prisma | Mercado304",
	description: "Dashboard de estatísticas de queries do Prisma",
}

export default function PrismaStatsPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Estatísticas do Prisma</h1>
				<p className="text-muted-foreground mt-2">
					Monitore o desempenho e uso das queries do banco de dados
				</p>
			</div>

			<PrismaStatsDashboard />
		</div>
	)
}

