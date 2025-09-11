import { prisma } from "@/lib/prisma";
import { getAllProductPrices } from "@/lib/price-utils";

export const productFunctions = {
	// Products Management
	createProduct: async ({
		name,
		brandName,
		categoryName,
		barcode,
		description,
	}: any) => {
		try {
			let brandId = null;
			let categoryId = null;

			// Validar e buscar marca se fornecida
			if (brandName) {
				const brand = await prisma.brand.findFirst({
					where: { name: { equals: brandName, mode: "insensitive" } },
				});
				if (!brand) {
					return {
						success: false,
						message: `A marca "${brandName}" não existe no sistema. Deseja criar esta marca primeiro?`,
						missingBrand: brandName,
					};
				}
				brandId = brand.id;
			}

			// Validar e buscar categoria se fornecida
			if (categoryName) {
				const category = await prisma.category.findFirst({
					where: { name: { equals: categoryName, mode: "insensitive" } },
				});
				if (!category) {
					return {
						success: false,
						message: `A categoria "${categoryName}" não existe no sistema. Deseja criar esta categoria primeiro?`,
						missingCategory: categoryName,
					};
				}
				categoryId = category.id;
			}

			const product = await prisma.product.create({
				data: { name, brandId, categoryId, barcode },
				include: { brand: true, category: true },
			});

			return {
				success: true,
				message: `Produto "${name}" criado com sucesso.`,
				product,
			};
		} catch (error) {
			return { success: false, message: `Erro ao criar produto: ${error}` };
		}
	},

	searchProducts: async ({ search, categoryId, brandId }: any) => {
		const products = await prisma.product.findMany({
			where: {
				name: { contains: search, mode: "insensitive" },
				...(categoryId && { categoryId }),
				...(brandId && { brandId }),
			},
			include: { brand: true, category: true },
			take: 10,
		});
		return { success: true, products };
	},

	getProductPriceComparison: async ({
		productName,
	}: {
		productName: string;
	}) => {
		const product = await prisma.product.findFirst({
			where: { name: { contains: productName, mode: "insensitive" } },
		});
		if (!product)
			return {
				success: false,
				message: `Produto "${productName}" não encontrado.`,
			};

		// Buscar preços de todos os mercados (compras + registros)
		const allPrices = await getAllProductPrices(product.id);

		const pricesByMarket = allPrices.reduce((acc: any, item) => {
			if (item.price !== null) {
				acc[item.marketName] = {
					price: item.price,
					date: item.lastUpdate,
					source: item.source,
					formatted: `R$ ${item.price.toFixed(2)}`,
				};
			}
			return acc;
		}, {});

		return { success: true, product: product.name, prices: pricesByMarket };
	},

	getHealthyAlternatives: async ({ productName }: { productName: string }) => {
		const response = await fetch(
			`${process.env.NEXTAUTH_URL}/api/products/healthy-alternatives`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ productName }),
			},
		);
		const data = await response.json();
		return { success: true, alternatives: data.alternatives };
	},

	getBestDayToBuy: async ({ productName }: { productName: string }) => {
		const response = await fetch(
			`${process.env.NEXTAUTH_URL}/api/products/best-day-to-buy`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ productName }),
			},
		);
		const data = await response.json();
		return { success: true, recommendation: data };
	},

	createProductWithBrandAndCategory: async ({
		productName,
		brandName,
		categoryName,
		barcode,
		description,
	}: any) => {
		try {
			let brandId = null;
			let categoryId = null;

			// Criar marca se fornecida e não existir
			if (brandName) {
				let brand = await prisma.brand.findFirst({
					where: { name: { equals: brandName, mode: "insensitive" } },
				});
				if (!brand) {
					brand = await prisma.brand.create({
						data: { name: brandName },
					});
				}
				brandId = brand.id;
			}

			// Criar categoria se fornecida e não existir
			if (categoryName) {
				let category = await prisma.category.findFirst({
					where: { name: { equals: categoryName, mode: "insensitive" } },
				});
				if (!category) {
					category = await prisma.category.create({
						data: { name: categoryName, icon: "📦", color: "#6b7280" },
					});
				}
				categoryId = category.id;
			}

			// Criar produto
			const product = await prisma.product.create({
				data: { name: productName, brandId, categoryId, barcode },
				include: { brand: true, category: true },
			});

			let message = `Produto "${productName}" criado com sucesso.`;
			if (brandName) message += ` Marca: ${brandName}.`;
			if (categoryName) message += ` Categoria: ${categoryName}.`;

			return { success: true, message, product };
		} catch (error) {
			return { success: false, message: `Erro ao criar produto: ${error}` };
		}
	},
};