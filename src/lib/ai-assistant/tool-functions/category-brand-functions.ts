import { prisma } from "@/lib/prisma";

export const categoryBrandFunctions = {
	// Categories & Brands
	createCategory: async ({ name, icon, color }: any) => {
		try {
			const category = await prisma.category.create({
				data: { name, icon, color },
			});
			return {
				success: true,
				message: `Categoria "${name}" criada com sucesso.`,
				category,
			};
		} catch (error) {
			return { success: false, message: `Erro ao criar categoria: ${error}` };
		}
	},

	createBrand: async ({ name }: any) => {
		try {
			const brand = await prisma.brand.create({
				data: { name },
			});
			return {
				success: true,
				message: `Marca "${name}" criada com sucesso.`,
				brand,
			};
		} catch (error) {
			return { success: false, message: `Erro ao criar marca: ${error}` };
		}
	},

	getCategories: async () => {
		const categories = await prisma.category.findMany({
			orderBy: { name: "asc" },
		});
		return { success: true, categories };
	},

	getBrands: async () => {
		const brands = await prisma.brand.findMany({
			orderBy: { name: "asc" },
		});
		return { success: true, brands };
	},
};