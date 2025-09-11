"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";

export default function Provider({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(() => new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 1 * 60 * 1000, // 1 minute
				gcTime: 5 * 60 * 1000, // 5 minutes
				retry: 1,
				refetchOnWindowFocus: false,
			},
		},
	}));
	return (
		<QueryClientProvider client={queryClient}>
			<SessionProvider>
				{children}
			</SessionProvider>
		</QueryClientProvider>
	);
}
