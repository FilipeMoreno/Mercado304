import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

interface LocationData {
	city?: string
	region?: string
	country?: string
}

/**
 * Busca localização do IP com cache em banco de dados
 */
export async function getLocationFromIP(ip: string): Promise<string> {
	if (!ip || ip === "IP não disponível" || ip === "::1" || ip.startsWith("127.")) {
		return "Localização não disponível"
	}

	try {
		// Verificar cache primeiro
		const cached = await prisma.ipLocation.findUnique({
			where: { ip },
		})

		// Se existe cache válido, retornar
		if (cached && cached.expiresAt > new Date()) {
			return cached.location
		}

		// Se cache expirou, deletar
		if (cached) {
			await prisma.ipLocation.delete({ where: { ip } })
		}

		// Buscar de APIs externas com fallback
		const location = await fetchLocationFromAPIs(ip)

		// Salvar no cache
		if (location !== "Localização não disponível") {
			const expiresAt = new Date()
			expiresAt.setDate(expiresAt.getDate() + 30) // 30 dias

			await prisma.ipLocation.create({
				data: {
					ip,
					city: location.split(",")[0]?.trim() || null,
					region: location.split(",")[1]?.trim() || null,
					country: location.split(",")[2]?.trim() || null,
					location,
					expiresAt,
				},
			})
		}

		return location
	} catch (error) {
		console.error("Erro ao buscar localização:", error)
		return "Localização não disponível"
	}
}

/**
 * Tenta buscar localização de múltiplas APIs com fallback
 */
async function fetchLocationFromAPIs(ip: string): Promise<string> {
	// API 1: ip-api.com (45 req/min grátis)
	try {
		const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city`, {
			next: { revalidate: 3600 },
		})

		if (response.ok) {
			const data = await response.json()
			if (data.status === "success") {
				return formatLocation(data.city, data.regionName, data.country)
			}
		}
	} catch (error) {
		console.warn("ip-api.com falhou, tentando próxima API")
	}

	// API 2: ipapi.co (1000 req/dia grátis)
	try {
		const response = await fetch(`https://ipapi.co/${ip}/json/`, {
			next: { revalidate: 3600 },
		})

		if (response.ok) {
			const data = await response.json()
			if (!data.error) {
				return formatLocation(data.city, data.region, data.country_name)
			}
		}
	} catch (error) {
		console.warn("ipapi.co falhou, tentando próxima API")
	}

	// API 3: ipwhois.app (10000 req/mês grátis)
	try {
		const response = await fetch(`http://ipwho.is/${ip}`, {
			next: { revalidate: 3600 },
		})

		if (response.ok) {
			const data = await response.json()
			if (data.success) {
				return formatLocation(data.city, data.region, data.country)
			}
		}
	} catch (error) {
		console.warn("ipwhois.app falhou")
	}

	// API 4: ip-api.io (1000 req/dia grátis)
	try {
		const response = await fetch(`https://ip-api.io/json/${ip}`, {
			next: { revalidate: 3600 },
		})

		if (response.ok) {
			const data = await response.json()
			return formatLocation(data.city, data.region_name, data.country_name)
		}
	} catch (error) {
		console.warn("ip-api.io falhou")
	}

	return "Localização não disponível"
}

/**
 * Formata a localização de forma consistente
 */
function formatLocation(city?: string, region?: string, country?: string): string {
	const parts: string[] = []

	if (city) parts.push(city)
	if (region && region !== city) parts.push(region)
	if (country) parts.push(country)

	return parts.length > 0 ? parts.join(", ") : "Localização não disponível"
}

/**
 * Limpa cache de IPs expirados (executar periodicamente)
 */
export async function cleanExpiredIpCache() {
	try {
		const result = await prisma.ipLocation.deleteMany({
			where: {
				expiresAt: {
					lt: new Date(),
				},
			},
		})
		console.log(`${result.count} registros de IP cache expirados foram removidos`)
	} catch (error) {
		console.error("Erro ao limpar cache de IPs:", error)
	}
}

/**
 * Obtém estatísticas de localização de um usuário
 */
export async function getUserLocationStats(userId: string) {
	const audits = await prisma.securityAudit.findMany({
		where: {
			userId,
			location: { not: null },
		},
		select: {
			location: true,
			createdAt: true,
		},
		orderBy: { createdAt: "desc" },
		take: 50,
	})

	// Contar localizações únicas
	const locationCounts = audits.reduce((acc, audit) => {
		if (audit.location) {
			acc[audit.location] = (acc[audit.location] || 0) + 1
		}
		return acc
	}, {} as Record<string, number>)

	// Ordenar por frequência
	const sortedLocations = Object.entries(locationCounts)
		.sort(([, a], [, b]) => b - a)
		.map(([location, count]) => ({ location, count }))

	return {
		totalLocations: sortedLocations.length,
		mostCommon: sortedLocations[0],
		allLocations: sortedLocations,
	}
}
