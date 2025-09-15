import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Toaster } from "sonner"
import { ClientLayout } from "@/components/client-layout"
import { ThemeProvider } from "@/lib/theme"
import Provider from "./provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
	title: "Mercado304",
	description: "Sistema de gerenciamento de compras de mercado",
	manifest: "/manifest.json",
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: "Mercado304",
	},
}

// Novo objeto de configuração de viewport
export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
	viewportFit: "cover",
	themeColor: "#1f2937",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="pt-BR" suppressHydrationWarning>
			<body className={inter.className}>
				<SpeedInsights />
				<Analytics />
				<Provider>
					<ThemeProvider defaultTheme="system" storageKey="mercado304-theme">
						<ClientLayout>{children}</ClientLayout>
						<ReactQueryDevtools initialIsOpen={false} />
						<Toaster richColors position="top-right" />
					</ThemeProvider>
				</Provider>
			</body>
		</html>
	)
}
