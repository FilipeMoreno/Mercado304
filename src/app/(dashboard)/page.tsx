import API_BASE_URL from "@/lib/api";
import { DashboardClient } from "./dashboard-client";

async function fetchDashboardData() {
	try {
		const [statsRes, savingsRes, temporalRes, consumptionRes, expirationRes] =
			await Promise.all([
				fetch(`${API_BASE_URL}/dashboard/stats`, { cache: "no-store" }),
				fetch(`${API_BASE_URL}/savings`, { cache: "no-store" }),
				fetch(`${API_BASE_URL}/temporal-comparison`, { cache: "no-store" }),
				fetch(`${API_BASE_URL}/predictions/consumption-patterns`, {
					cache: "no-store",
				}),
				fetch(`${API_BASE_URL}/stock/expiration-alerts`, { cache: "no-store" }),
			]);

		if (
			!statsRes.ok ||
			!savingsRes.ok ||
			!temporalRes.ok ||
			!consumptionRes.ok ||
			!expirationRes.ok
		) {
			console.error("Uma ou mais chamadas à API falharam");
			return {
				stats: null,
				savingsData: null,
				temporalData: null,
				consumptionData: null,
				expirationData: null,
			};
		}

		const [stats, savingsData, temporalData, consumptionData, expirationData] =
			await Promise.all([
				statsRes.json(),
				savingsRes.json(),
				temporalRes.json(),
				consumptionRes.json(),
				expirationRes.json(),
			]);

		return {
			stats,
			savingsData,
			temporalData,
			consumptionData,
			expirationData,
		};
	} catch (error) {
		console.error("Erro ao buscar dados do dashboard:", error);
		return {
			stats: null,
			savingsData: null,
			temporalData: null,
			consumptionData: null,
			expirationData: null,
		};
	}
}

export default async function Home() {
	const initialData = await fetchDashboardData();
	return <DashboardClient initialData={initialData} />;
}
