import { prisma } from "@/lib/prisma";
import { parseContext, normalizeProductName } from "../utils";

export const selectionFunctions = {
	// Sistema de Seleção com Cards
	findSimilarProducts: async ({
		searchTerm,
		context,
	}: {
		searchTerm: string;
		context?: string;
	}) => {
		const normalizedSearch = normalizeProductName(searchTerm);
		
		// Primeira busca: exata por nome normalizado
		let products = await prisma.product.findMany({
			where: {
				OR: [
					{ name: { equals: searchTerm, mode: "insensitive" } },
					{ name: { contains: searchTerm, mode: "insensitive" } },
				]
			},
			include: { brand: true, category: true },
			take: 10,
			orderBy: { name: "asc" },
		});

		// Se não encontrou resultados suficientes, busca mais ampla
		if (products.length === 0) {
			const searchWords = normalizedSearch.split(' ').filter(word => word.length > 2);
			if (searchWords.length > 0) {
				products = await prisma.product.findMany({
					where: {
						OR: searchWords.map(word => ({
							name: { contains: word, mode: "insensitive" }
						}))
					},
					include: { brand: true, category: true },
					take: 10,
					orderBy: { name: "asc" },
				});
			}
		}

		if (products.length === 0) {
			return {
				success: false,
				message: `Nenhum produto encontrado com "${searchTerm}".`,
			};
		}

		if (products.length === 1) {
			return {
				success: true,
				exactMatch: true,
				product: products[0],
				message: `Produto encontrado: ${products[0].name}`,
			};
		}

		return {
			success: true,
			showCards: true,
			cardType: "products",
			searchTerm,
			options: products.map((p) => ({
				id: p.id,
				name: p.name,
				brand: p.brand?.name,
				category: p.category?.name,
				barcode: p.barcode,
			})),
			message: `Encontrados ${products.length} produtos similares a "${searchTerm}". Escolha uma das opções:`,
			context: context
				? parseContext(context, searchTerm)
				: { action: "productSelected", searchTerm },
		};
	},

	findSimilarMarkets: async ({ searchTerm }: { searchTerm: string }) => {
		const markets = await prisma.market.findMany({
			where: {
				name: { contains: searchTerm, mode: "insensitive" },
			},
			take: 10,
			orderBy: { name: "asc" },
		});

		if (markets.length === 0) {
			return {
				success: false,
				message: `Nenhum mercado encontrado com "${searchTerm}".`,
			};
		}

		if (markets.length === 1) {
			return {
				success: true,
				exactMatch: true,
				market: markets[0],
				message: `Mercado encontrado: ${markets[0].name}`,
			};
		}

		return {
			success: true,
			showCards: true,
			cardType: "markets",
			searchTerm,
			options: markets.map((m) => ({
				id: m.id,
				name: m.name,
				location: m.location,
			})),
			message: `Encontrados ${markets.length} mercados similares a "${searchTerm}". Escolha uma das opções:`,
		};
	},

	findSimilarCategories: async ({ searchTerm }: { searchTerm: string }) => {
		const categories = await prisma.category.findMany({
			where: {
				name: { contains: searchTerm, mode: "insensitive" },
			},
			take: 10,
			orderBy: { name: "asc" },
		});

		if (categories.length === 0) {
			return {
				success: false,
				message: `Nenhuma categoria encontrada com "${searchTerm}".`,
			};
		}

		if (categories.length === 1) {
			return {
				success: true,
				exactMatch: true,
				category: categories[0],
				message: `Categoria encontrada: ${categories[0].name}`,
			};
		}

		return {
			success: true,
			showCards: true,
			cardType: "categories",
			searchTerm,
			options: categories.map((c) => ({
				id: c.id,
				name: c.name,
				icon: c.icon,
				color: c.color,
				isFood: c.isFood,
			})),
			message: `Encontradas ${categories.length} categorias similares a "${searchTerm}". Escolha uma das opções:`,
		};
	},

	findSimilarBrands: async ({ searchTerm }: { searchTerm: string }) => {
		const brands = await prisma.brand.findMany({
			where: {
				name: { contains: searchTerm, mode: "insensitive" },
			},
			include: {
				_count: { select: { products: true } },
			},
			take: 10,
			orderBy: { name: "asc" },
		});

		if (brands.length === 0) {
			return {
				success: false,
				message: `Nenhuma marca encontrada com "${searchTerm}".`,
			};
		}

		if (brands.length === 1) {
			return {
				success: true,
				exactMatch: true,
				brand: brands[0],
				message: `Marca encontrada: ${brands[0].name}`,
			};
		}

		return {
			success: true,
			showCards: true,
			cardType: "brands",
			searchTerm,
			options: brands.map((b) => ({
				id: b.id,
				name: b.name,
				productCount: b._count.products,
			})),
			message: `Encontradas ${brands.length} marcas similares a "${searchTerm}". Escolha uma das opções:`,
		};
	},

	findSimilarShoppingLists: async ({ searchTerm }: { searchTerm: string }) => {
		const lists = await prisma.shoppingList.findMany({
			where: {
				name: { contains: searchTerm, mode: "insensitive" },
				isActive: true,
			},
			include: {
				_count: { select: { items: true } },
			},
			take: 10,
			orderBy: { updatedAt: "desc" },
		});

		if (lists.length === 0) {
			return {
				success: false,
				message: `Nenhuma lista de compras encontrada com "${searchTerm}".`,
			};
		}

		if (lists.length === 1) {
			return {
				success: true,
				exactMatch: true,
				list: lists[0],
				message: `Lista encontrada: ${lists[0].name}`,
			};
		}

		return {
			success: true,
			showCards: true,
			cardType: "shopping-lists",
			searchTerm,
			options: lists.map((l) => ({
				id: l.id,
				name: l.name,
				itemCount: l._count.items,
				createdAt: l.createdAt,
				updatedAt: l.updatedAt,
			})),
			message: `Encontradas ${lists.length} listas similares a "${searchTerm}". Escolha uma das opções:`,
		};
	},
};