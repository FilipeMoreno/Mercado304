import { auth } from "./auth";
import { headers } from "next/headers";
import { cache } from "react";

export const getSession = cache(async () => {
	return await auth.api.getSession({
		headers: await headers(),
	});
});

export const getCurrentUser = cache(async () => {
	const session = await getSession();
	return session?.user ?? null;
});

export async function requireAuth() {
	const session = await getSession();
	if (!session) {
		throw new Error("Unauthorized");
	}
	return session;
}