import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function normalizeString(str: string | null | undefined): string {
	if (!str) return ""
	return str
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9\s]/g, " ") // Remove caracteres não alfanuméricos exceto espaços
		.replace(/\s+/g, " ") // Remove espaços extras
		.trim()
}
