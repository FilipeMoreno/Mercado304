import { DashboardWidgetClient } from "./dashboard-widget-client"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function Home() {
	return <DashboardWidgetClient />
}
