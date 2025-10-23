import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-server"
import { prisma } from "@/lib/prisma"

// Interface para a resposta da Cosmos API
interface CosmosProduct {
	avg_price?: number
	brand?: {
		name: string
		picture?: string
	}
	description: string
	gpc?: {
		code: string
		description: string
	}
	gross_weight?: number
	gtin: number
	height?: number
	length?: number
	max_price?: number
	ncm?: {
		code: string
		description: string
		full_description: string
	}
	net_weight?: number
	price?: string
	thumbnail?: string
	width?: number
}

// Interface para nossa resposta padronizada
interface GTINResponse {
	gtin: string
	name: string
	brand?: string | undefined
	grossWeight?: number | undefined
	netWeight?: number | undefined
	height?: number | undefined
	length?: number | undefined
	width?: number | undefined
	avgPrice?: number | undefined
	maxPrice?: number | undefined
	thumbnail?: string | undefined
	imageUrl?: string | undefined // Nossa imagem salva no R2
	gpc?: {
		code: string
		description: string
	} | undefined
	ncm?: {
		code: string
		description: string
		fullDescription: string
	} | undefined
	cached: boolean
	source: 'cache' | 'api'
}

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ code: string }> }
) {
	try {
		const session = await getSession()
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
		}

		const { code } = await params
		
		// Validar se é um código válido (8, 12, 13 ou 14 dígitos)
		if (!code || !/^\d{8,14}$/.test(code)) {
			return NextResponse.json(
				{ error: "Código GTIN/EAN inválido. Deve ter entre 8 e 14 dígitos." },
				{ status: 400 }
			)
		}

		// Primeiro, verificar se já temos esse produto em cache
		const cachedProduct = await prisma.gTINCache.findUnique({
			where: { gtin: code }
		})

		// Se está em cache e não expirou (7 dias), retornar do cache
		const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 dias em ms
		if (cachedProduct && (Date.now() - cachedProduct.createdAt.getTime()) < CACHE_DURATION) {
			const response = {
				gtin: cachedProduct.gtin,
				name: cachedProduct.name,
				brand: cachedProduct.brand || undefined,
				grossWeight: cachedProduct.grossWeight || undefined,
				netWeight: cachedProduct.netWeight || undefined,
				height: cachedProduct.height || undefined,
				length: cachedProduct.length || undefined,
				width: cachedProduct.width || undefined,
				avgPrice: cachedProduct.avgPrice || undefined,
				maxPrice: cachedProduct.maxPrice || undefined,
				thumbnail: cachedProduct.thumbnail || undefined,
				imageUrl: cachedProduct.imageUrl || undefined,
				gpc: cachedProduct.gpcCode ? {
					code: cachedProduct.gpcCode,
					description: cachedProduct.gpcDescription || ''
				} : undefined,
				ncm: cachedProduct.ncmCode ? {
					code: cachedProduct.ncmCode,
					description: cachedProduct.ncmDescription || '',
					fullDescription: cachedProduct.ncmFullDescription || ''
				} : undefined,
				cached: true,
				source: 'cache'
			}

			return NextResponse.json(response)
		}

		// Se não está em cache ou expirou, consultar a API Cosmos
		console.log(`[GTIN] Consultando API Cosmos para ${code}`)
		
		const cosmosResponse = await fetch(`https://api.cosmos.bluesoft.com.br/gtins/${code}.json`, {
			headers: {
				'User-Agent': 'Cosmos-API-Request',
				'Content-Type': 'application/json',
				'X-Cosmos-Token': process.env.COSMOS_API_TOKEN || 'dWBVeSPAN8fMZIQGbHNIbQ'
			}
		})

		if (cosmosResponse.status === 404) {
			return NextResponse.json(
				{ error: "Produto não encontrado na base de dados" },
				{ status: 404 }
			)
		}

		if (cosmosResponse.status === 429) {
			console.error('[GTIN] Rate limit excedido na API Cosmos')
			return NextResponse.json(
				{ error: "Limite de consultas excedido. Tente novamente mais tarde." },
				{ status: 429 }
			)
		}

		if (!cosmosResponse.ok) {
			console.error(`[GTIN] Erro na API Cosmos: ${cosmosResponse.status}`)
			return NextResponse.json(
				{ error: "Erro ao consultar base de dados externa" },
				{ status: 500 }
			)
		}

		const cosmosData: CosmosProduct = await cosmosResponse.json()

		// Processar e salvar no cache
		const thumbnailUrl = `https://cdn-cosmos.bluesoft.com.br/products/${code}`
		
		// Usar sempre a URL da Cosmos (a verificação de existência é feita no frontend)
		const imageUrl = thumbnailUrl
		
		console.log(`[GTIN] Salvando produto ${cosmosData.description} no cache`)

		// Salvar no cache
		const cacheData = {
			gtin: code,
			name: cosmosData.description,
			brand: cosmosData.brand?.name || null,
			grossWeight: cosmosData.gross_weight || null,
			netWeight: cosmosData.net_weight || null,
			height: cosmosData.height || null,
			length: cosmosData.length || null,
			width: cosmosData.width || null,
			avgPrice: cosmosData.avg_price || null,
			maxPrice: cosmosData.max_price || null,
			thumbnail: thumbnailUrl,
			imageUrl,
			gpcCode: cosmosData.gpc?.code || null,
			gpcDescription: cosmosData.gpc?.description || null,
			ncmCode: cosmosData.ncm?.code || null,
			ncmDescription: cosmosData.ncm?.description || null,
			ncmFullDescription: cosmosData.ncm?.full_description || null,
		}

		await prisma.gTINCache.upsert({
			where: { gtin: code },
			create: cacheData,
			update: cacheData
		})

		// Preparar resposta
		const response: GTINResponse = {
			gtin: code,
			name: cosmosData.description,
			brand: cosmosData.brand?.name,
			grossWeight: cosmosData.gross_weight,
			netWeight: cosmosData.net_weight,
			height: cosmosData.height,
			length: cosmosData.length,
			width: cosmosData.width,
			avgPrice: cosmosData.avg_price,
			maxPrice: cosmosData.max_price,
			thumbnail: thumbnailUrl,
			imageUrl: imageUrl || undefined,
			gpc: cosmosData.gpc ? {
				code: cosmosData.gpc.code,
				description: cosmosData.gpc.description
			} : undefined,
			ncm: cosmosData.ncm ? {
				code: cosmosData.ncm.code,
				description: cosmosData.ncm.description,
				fullDescription: cosmosData.ncm.full_description
			} : undefined,
			cached: false,
			source: 'api'
		}

		return NextResponse.json(response)

	} catch (error) {
		console.error("[GTIN] Erro interno:", error)
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 }
		)
	}
}