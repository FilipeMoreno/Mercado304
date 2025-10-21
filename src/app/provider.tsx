"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { useMemo } from "react"

export default function Provider({ children }: { children: React.ReactNode }) {
	// Using useMemo instead of useState for React 19 optimization
	const queryClient = useMemo(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						// React 19 optimized cache times
						staleTime: 5 * 60 * 1000, // 5 minutos - dados considerados frescos
						gcTime: 30 * 60 * 1000, // 30 minutos - mantém em cache na memória
						retry: (failureCount, error: any) => {
							// Smarter retry logic for React 19
							if (error?.status === 404) return false
							return failureCount < 2
						},
						refetchOnWindowFocus: false, // Não refetch ao focar janela
						refetchOnMount: false, // 🔥 NÃO refetch ao montar se dados estão frescos
						refetchOnReconnect: true, // Enable reconnect refetch for better UX
						// React 19 concurrent features optimization
						networkMode: "online",
					},
					mutations: {
						// React 19 optimized mutation settings
						retry: 1,
						networkMode: "online",
					},
				},
			}),
		[],
	)

	return (
		<QueryClientProvider client={queryClient}>
			{children}
			{process.env.NODE_ENV === "development" && <ReactQueryDevtools initialIsOpen={false} position="bottom" />}
		</QueryClientProvider>
	)
}
