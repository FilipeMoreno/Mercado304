"use client"

import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { usePathname } from "next/navigation"
import type React from "react"
import { useEffect, useRef, useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { Sidebar } from "@/components/sidebar"
import { cn } from "@/lib/utils"
import { AiAssistantChat } from "./ai-assistant-chat"
import { OfflineIndicator, OfflineStatusBar } from "./offline-indicator"
import { OfflineSyncManager } from "./offline-sync-manager"
import { ProactiveAiInsight } from "./proactive-ai-insight"

export function ClientLayout({ children }: { children: React.ReactNode }) {
	const pathname = usePathname()
	const isAuthPage = pathname?.startsWith("/auth")
	const mainRef = useRef<HTMLDivElement>(null)
	const [isScrolledToBottom, setIsScrolledToBottom] = useState(false)

	useEffect(() => {
		const handleScroll = () => {
			const element = mainRef.current
			if (element) {
				const atBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 1
				setIsScrolledToBottom(atBottom)
			}
		}

		const element = mainRef.current
		if (element) {
			element.addEventListener("scroll", handleScroll)
			// Chamar no início para verificar a posição inicial
			handleScroll()
		}

		return () => {
			if (element) {
				element.removeEventListener("scroll", handleScroll)
			}
		}
	}, [])

	// Se for uma página de auth, não aplicar proteção nem layout principal
	if (isAuthPage) {
		return <>{children}</>
	}

	return (
		<AuthGuard>
			<div className="flex h-screen bg-accent">
				<Sidebar />
				<main ref={mainRef} className="flex-1 p-2 ml-0 md:ml-0 overflow-y-auto custom-scrollbar">
					<div
						className={cn("bg-background rounded-xl overflow-x-hidden p-4 md:p-6 min-h-full", {
							"rounded-b-none": !isScrolledToBottom,
						})}
					>
						{children}
						<ReactQueryDevtools initialIsOpen={false} />
					</div>
				</main>
				<ProactiveAiInsight />
				<AiAssistantChat />
				<OfflineIndicator />
				<OfflineStatusBar />
				<OfflineSyncManager />
			</div>
		</AuthGuard>
	)
}
