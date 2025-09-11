import { prisma } from "@/lib/prisma";

export const shoppingListFunctions = {
	// Shopping Lists Management
	createShoppingList: async ({
		listName,
		items,
	}: {
		listName: string;
		items?: string[];
	}) => {
		try {
			if (!items || items.length === 0) {
				const list = await prisma.shoppingList.create({
					data: { name: listName },
				});
				return {
					success: true,
					message: `Lista "${listName}" criada com sucesso (sem itens).`,
					list,
				};
			}

			const foundProducts = await prisma.product.findMany({
				where: { name: { in: items, mode: "insensitive" } },
			});

			const foundProductNames = foundProducts.map((p) => p.name.toLowerCase());
			const notFoundItems = items.filter(
				(item) => !foundProductNames.includes(item.toLowerCase()),
			);

			const list = await prisma.shoppingList.create({
				data: {
					name: listName,
					items: {
						create: foundProducts.map((p) => ({
							productId: p.id,
							quantity: 1,
						})),
					},
				},
				include: { items: { include: { product: true } } },
			});

			let message = `Lista "${listName}" criada com ${foundProducts.length} itens.`;
			if (notFoundItems.length > 0) {
				message += ` Produtos não encontrados: ${notFoundItems.join(", ")}.`;
			}

			return { success: true, message, list };
		} catch (error) {
			return { success: false, message: `Erro ao criar lista: ${error}` };
		}
	},

	getShoppingLists: async () => {
		const lists = await prisma.shoppingList.findMany({
			include: {
				items: { include: { product: true } },
				_count: { select: { items: true } },
			},
			orderBy: { createdAt: "desc" },
		});
		return { success: true, lists };
	},

	addItemToShoppingList: async ({
		listName,
		items,
	}: {
		listName: string;
		items: string[];
	}) => {
		try {
			const list = await prisma.shoppingList.findFirst({
				where: { name: { contains: listName, mode: "insensitive" } },
			});
			if (!list)
				return {
					success: false,
					message: `Lista "${listName}" não encontrada.`,
				};

			const foundProducts = await prisma.product.findMany({
				where: { name: { in: items, mode: "insensitive" } },
			});

			if (foundProducts.length === 0) {
				return {
					success: false,
					message: `Nenhum produto encontrado: ${items.join(", ")}.`,
				};
			}

			await prisma.shoppingListItem.createMany({
				data: foundProducts.map((p) => ({
					listId: list.id,
					productId: p.id,
					quantity: 1,
				})),
				skipDuplicates: true,
			});

			const notFoundItems = items.filter(
				(item) =>
					!foundProducts.some((p) =>
						p.name.toLowerCase().includes(item.toLowerCase()),
					),
			);

			let message = `Adicionados ${foundProducts.length} itens à lista "${listName}".`;
			if (notFoundItems.length > 0) {
				message += ` Produtos não encontrados: ${notFoundItems.join(", ")}.`;
			}

			return { success: true, message };
		} catch (error) {
			return { success: false, message: `Erro ao adicionar itens: ${error}` };
		}
	},

	generateAutoShoppingList: async () => {
		const response = await fetch(
			`${process.env.NEXTAUTH_URL}/api/predictions/auto-shopping-list`,
		);
		const data = await response.json();
		return { success: true, autoList: data };
	},
};