import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Toaster } from "sonner"
import { ClientLayout } from "@/components/client-layout"
import { PWASplashWrapper } from "@/components/pwa-splash-wrapper"
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
			<head>
				{/* PWA Meta Tags */}
				<meta name="mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-status-bar-style" content="default" />
				<meta name="apple-mobile-web-app-title" content="Mercado304" />
				<meta name="application-name" content="Mercado304" />
				<meta name="msapplication-TileColor" content="#3b82f6" />
				<meta name="msapplication-config" content="/browserconfig.xml" />
				{/* Splash Screen for iOS */}
				<link rel="apple-touch-startup-image" href="/icon-512x512.png" />
			</head>
			<body className={inter.className}>
				<SpeedInsights />
				<Analytics />
				<Provider>
					<ThemeProvider defaultTheme="system" storageKey="mercado304-theme">
						<PWASplashWrapper>
							<ClientLayout>{children}</ClientLayout>
						</PWASplashWrapper>
						<ReactQueryDevtools initialIsOpen={false} />
						<Toaster richColors position="top-right" />
					</ThemeProvider>
				</Provider>
			</body>
		</html>
	)
}
