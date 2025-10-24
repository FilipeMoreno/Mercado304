"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { useEffect, useState } from "react"

export default function Provider({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 5 * 60 * 1000, // 5 minutos - dados considerados frescos
						gcTime: 30 * 60 * 1000, // 30 minutos - mantém em cache na memória
						retry: 1,
						refetchOnWindowFocus: false, // Não refetch ao focar janela
						refetchOnMount: false, // 🔥 NÃO refetch ao montar se dados estão frescos
						refetchOnReconnect: false, // Não refetch ao reconectar
					},
				},
			}),
	)

	const [isClient, setIsClient] = useState(false)

	useEffect(() => {
		setIsClient(true)
	}, [])

	if (!isClient) {
		return <>{children}</>
	}

	return (
		<QueryClientProvider client={queryClient}>
			{children}
			<ReactQueryDevtools initialIsOpen={false} />
		</QueryClientProvider>
	)
}
