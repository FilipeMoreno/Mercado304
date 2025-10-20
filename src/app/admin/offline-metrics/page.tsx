import type { Metadata } from "next"
import { OfflineMetricsDashboard } from "@/components/offline-metrics-dashboard"

export const metadata: Metadata = {
	title: "Métricas Offline | Mercado304",
	description: "Dashboard de métricas do sistema offline",
}

export default function OfflineMetricsPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Métricas do Sistema Offline</h1>
				<p className="text-muted-foreground mt-2">
					Monitore o desempenho e o uso do cache offline
				</p>
			</div>

			<OfflineMetricsDashboard />
		</div>
	)
}

