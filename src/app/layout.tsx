import type { Metadata, Viewport } from "next"
import { Suspense } from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import "./grid-layout.css"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Toaster } from "sonner"
import { ClientLayout } from "@/components/client-layout"
import { PWASplashWrapper } from "@/components/pwa-splash-wrapper"
import { MinimizedDialogProvider } from "@/lib/minimized-dialog-manager"
import { ThemeProvider } from "@/lib/theme"
import Provider from "./provider"
import { AnalyticsProviders } from "@/components/AnalyticsProviders"

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
			<head>
				{/* PWA Meta Tags */}
				<meta name="mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
				<meta name="apple-mobile-web-app-title" content="Mercado304" />
				<meta name="application-name" content="Mercado304" />
				<meta name="msapplication-TileColor" content="#ffffff" />
				<meta name="msapplication-config" content="/browserconfig.xml" />

				{/* PWA Icons para iOS */}
				<link rel="apple-touch-icon" href="/icon-192x192.png" />
				<link rel="icon" type="image/png" sizes="16x16" href="/favicon.ico" />
				<link rel="icon" type="image/png" sizes="32x32" href="/favicon.ico" />
				<link rel="icon" type="image/png" sizes="192x192" href="/icon-192x192.png" />
				<link rel="icon" type="image/png" sizes="512x512" href="/icon-512x512.png" />
				<link rel="manifest" href="/manifest.json" />
			</head>
			<body className={inter.className}>
				<SpeedInsights />
				<Analytics />
				<Provider>
					<Suspense fallback={null}>
						<ThemeProvider defaultTheme="system" storageKey="mercado304-theme">
							<MinimizedDialogProvider>
								<PWASplashWrapper>
									<ClientLayout>{children}</ClientLayout>
								</PWASplashWrapper>
								<ReactQueryDevtools initialIsOpen={false} />
								<Toaster richColors position="top-right" />
							</MinimizedDialogProvider>
						</ThemeProvider>
					</Suspense>
				</Provider>
			</body>
		</html>
	)
}
