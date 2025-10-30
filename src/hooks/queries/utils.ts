import type { QueryClient } from "@tanstack/react-query"

export async function invalidateRefetchFamily(queryClient: QueryClient, keyPrefix: string | readonly unknown[]) {
	await queryClient.invalidateQueries({ queryKey: Array.isArray(keyPrefix) ? keyPrefix : [keyPrefix], exact: false })
	await queryClient.refetchQueries({ queryKey: Array.isArray(keyPrefix) ? keyPrefix : [keyPrefix], exact: false })
}


