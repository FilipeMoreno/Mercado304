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

// Next.js 15 optimized font loading
const inter = Inter({
	subsets: ["latin"],
	display: "swap", // Improved font loading
	preload: true, // Preload for better performance
})

export const metadata: Metadata = {
	title: {
		template: "%s | Mercado304",
		default: "Mercado304 - Sistema de Gerenciamento de Compras",
	},
	description: "Sistema inteligente de gerenciamento de compras de mercado com AI",
	manifest: "/manifest.json",
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: "Mercado304",
	},
	// Next.js 15 enhanced metadata
	openGraph: {
		title: "Mercado304",
		description: "Sistema inteligente de gerenciamento de compras",
		type: "website",
		locale: "pt_BR",
	},
	robots: {
		index: false, // Private app
		follow: false,
	},
	icons: {
		icon: "/icon-192x192.png",
		apple: "/icon-192x192.png",
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
				<link rel="icon" type="image/png" sizes="192x192" href="/icon-192x192.png" />
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
