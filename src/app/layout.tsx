import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/lib/theme"
import { ClientLayout } from "@/components/client-layout"
import { AppDataProvider } from "@/contexts/app-data-context"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Mercado304",
  description: "Sistema de gerenciamento de compras de mercado",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mercado304"
  },
}

// Novo objeto de configuração de viewport
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1f2937"
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          defaultTheme="system"
          storageKey="mercado304-theme"
        >
          <AppDataProvider>
            <ClientLayout>
              {children}
            </ClientLayout>
            <Toaster richColors position="top-right" />
          </AppDataProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}