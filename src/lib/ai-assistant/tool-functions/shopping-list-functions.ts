import { prisma } from "@/lib/prisma"

export const shoppingListFunctions = {
	// Shopping Lists Management
	createShoppingList: async ({ listName, items }: { listName: string; items?: string[] }) => {
		try {
			if (!items || items.length === 0) {
				const list = await prisma.shoppingList.create({
					data: { name: listName },
				})
				return {
					success: true,
					message: `Lista "${listName}" criada com sucesso (sem itens).`,
					list,
				}
			}

			const foundProducts = await prisma.product.findMany({
				where: { name: { in: items, mode: "insensitive" } },
			})

			const foundProductNames = foundProducts.map((p) => p.name.toLowerCase())
			const notFoundItems = items.filter((item) => !foundProductNames.includes(item.toLowerCase()))

			const list = await prisma.shoppingList.create({
				data: {
					name: listName,
					items: {
						create: foundProducts.map((p) => ({
							productId: p.id,
							productName: p.name,
							productUnit: p.unit,
							quantity: 1,
						})),
					},
				},
				include: { items: { include: { product: true } } },
			})

			let message = `Lista "${listName}" criada com ${foundProducts.length} itens.`
			if (notFoundItems.length > 0) {
				message += ` Produtos não encontrados: ${notFoundItems.join(", ")}.`
			}

			return { success: true, message, list }
		} catch (error) {
			return { success: false, message: `Erro ao criar lista: ${error}` }
		}
	},

	getShoppingLists: async () => {
		const lists = await prisma.shoppingList.findMany({
			include: {
				items: { include: { product: true } },
				_count: { select: { items: true } },
			},
			orderBy: { createdAt: "desc" },
		})
		return { success: true, lists }
	},

	addItemToShoppingList: async ({ listName, items }: { listName: string; items: string[] }) => {
		try {
			const list = await prisma.shoppingList.findFirst({
				where: { name: { contains: listName, mode: "insensitive" } },
			})
			if (!list)
				return {
					success: false,
					message: `Lista "${listName}" não encontrada.`,
				}

			const foundProducts = await prisma.product.findMany({
				where: { name: { in: items, mode: "insensitive" } },
			})

			if (foundProducts.length === 0) {
				return {
					success: false,
					message: `Nenhum produto encontrado: ${items.join(", ")}.`,
				}
			}

			await prisma.shoppingListItem.createMany({
				data: foundProducts.map((p) => ({
					listId: list.id,
					productId: p.id,
					productName: p.name,
					productUnit: p.unit,
					quantity: 1,
				})),
				skipDuplicates: true,
			})

			const notFoundItems = items.filter(
				(item) => !foundProducts.some((p) => p.name.toLowerCase().includes(item.toLowerCase())),
			)

			let message = `Adicionados ${foundProducts.length} itens à lista "${listName}".`
			if (notFoundItems.length > 0) {
				message += ` Produtos não encontrados: ${notFoundItems.join(", ")}.`
			}

			return { success: true, message }
		} catch (error) {
			return { success: false, message: `Erro ao adicionar itens: ${error}` }
		}
	},

	generateAutoShoppingList: async () => {
		const response = await fetch(`${process.env.NEXTAUTH_URL}/api/predictions/auto-shopping-list`)
		const data = await response.json()
		return { success: true, autoList: data }
	},

	createListFromLastPurchase: async ({ listName }: { listName: string }) => {
		try {
			// Busca a última compra
			const lastPurchase = await prisma.purchase.findFirst({
				include: {
					items: { include: { product: true } },
					market: true,
				},
				orderBy: { purchaseDate: "desc" },
			})

			if (!lastPurchase) {
				return {
					success: false,
					message: "Nenhuma compra encontrada no histórico.",
				}
			}

			// Cria a lista com os itens da última compra
			const list = await prisma.shoppingList.create({
				data: {
					name: listName,
					items: {
						create: lastPurchase.items.map((item) => ({
							productId: item.productId,
							productName: item.productName || "Produto sem nome",
							productUnit: item.productUnit || "unidade",
							quantity: item.quantity,
						})),
					},
				},
				include: { items: { include: { product: true } } },
			})

			const purchaseDate = lastPurchase.purchaseDate.toLocaleDateString('pt-BR')
			const marketName = lastPurchase.market.name

			return {
				success: true,
				message: `Lista "${listName}" criada com ${lastPurchase.items.length} itens da sua última compra no ${marketName} (${purchaseDate}).`,
				list,
				purchaseInfo: {
					date: purchaseDate,
					market: marketName,
					itemCount: lastPurchase.items.length,
				},
			}
		} catch (error) {
			return { success: false, message: `Erro ao criar lista: ${error}` }
		}
	},

	mergeDuplicateShoppingLists: async ({ sourceListName, targetListName }: { sourceListName: string; targetListName: string }) => {
		try {
			const sourceList = await prisma.shoppingList.findFirst({
				where: { name: { contains: sourceListName, mode: "insensitive" } },
				include: { items: { include: { product: true } } },
			})

			const targetList = await prisma.shoppingList.findFirst({
				where: { name: { contains: targetListName, mode: "insensitive" } },
				include: { items: { include: { product: true } } },
			})

			if (!sourceList || !targetList) {
				return {
					success: false,
					message: `Uma das listas não foi encontrada: ${!sourceList ? sourceListName : targetListName}`,
				}
			}

			// Mescla os itens, somando quantidades de produtos duplicados
			const targetProductIds = new Set(targetList.items.map(item => item.productId))
			const itemsToAdd = []
			const itemsToUpdate = []

			for (const sourceItem of sourceList.items) {
				if (targetProductIds.has(sourceItem.productId)) {
					// Produto já existe na lista de destino, somar quantidades
					const targetItem = targetList.items.find(item => item.productId === sourceItem.productId)
					if (targetItem) {
						itemsToUpdate.push({
							id: targetItem.id,
							quantity: targetItem.quantity + sourceItem.quantity,
						})
					}
				} else {
					// Produto novo, adicionar à lista
					itemsToAdd.push({
						listId: targetList.id,
						productId: sourceItem.productId,
						productName: sourceItem.productName,
						productUnit: sourceItem.productUnit,
						quantity: sourceItem.quantity,
					})
				}
			}

			// Executa as operações
			await Promise.all([
				...itemsToUpdate.map(item =>
					prisma.shoppingListItem.update({
						where: { id: item.id },
						data: { quantity: item.quantity },
					})
				),
				...(itemsToAdd.length > 0 ? [prisma.shoppingListItem.createMany({ data: itemsToAdd })] : []),
			])

			// Remove a lista de origem
			await prisma.shoppingList.delete({ where: { id: sourceList.id } })

			return {
				success: true,
				message: `Lista "${sourceListName}" mesclada com "${targetListName}". ${itemsToAdd.length} novos itens adicionados, ${itemsToUpdate.length} quantidades atualizadas.`,
				mergedItems: itemsToAdd.length + itemsToUpdate.length,
			}
		} catch (error) {
			return { success: false, message: `Erro ao mesclar listas: ${error}` }
		}
	},

	calculateListEstimatedCost: async ({ listName, marketName }: { listName: string; marketName?: string }) => {
		try {
			const list = await prisma.shoppingList.findFirst({
				where: { name: { contains: listName, mode: "insensitive" } },
				include: { items: { include: { product: true } } },
			})

			if (!list) {
				return { success: false, message: `Lista "${listName}" não encontrada.` }
			}

			let totalCost = 0
			let itemsWithPrice = 0
			let itemsWithoutPrice = 0
			const itemDetails = []

			for (const item of list.items) {
				// Busca o preço mais recente do produto
				const priceQuery: any = {
					productId: item.productId,
				}

				if (marketName) {
					priceQuery.market = { name: { contains: marketName, mode: "insensitive" } }
				}

				const latestPrice = await prisma.purchase.findFirst({
					where: {
						items: { some: priceQuery },
					},
					include: {
						items: {
							where: { productId: item.productId },
							include: { product: true }
						},
						market: true,
					},
					orderBy: { purchaseDate: "desc" },
				})

				if (latestPrice && latestPrice.items[0]) {
					const unitPrice = latestPrice.items[0].unitPrice
					const itemCost = unitPrice * item.quantity
					totalCost += itemCost
					itemsWithPrice++

					itemDetails.push({
						product: item.product?.name || 'Produto não encontrado',
						quantity: item.quantity,
						unitPrice,
						totalPrice: itemCost,
						market: latestPrice.market.name,
						lastUpdate: latestPrice.purchaseDate.toLocaleDateString('pt-BR'),
					})
				} else {
					itemsWithoutPrice++
					itemDetails.push({
						product: item.product?.name || 'Produto não encontrado',
						quantity: item.quantity,
						unitPrice: null,
						totalPrice: null,
						market: null,
						lastUpdate: null,
					})
				}
			}

			const coverage = itemsWithPrice / list.items.length * 100

			return {
				success: true,
				message: `Custo estimado da lista "${listName}": R$ ${totalCost.toFixed(2)} (${coverage.toFixed(1)}% dos itens com preço conhecido)`,
				totalCost: totalCost,
				itemsWithPrice,
				itemsWithoutPrice,
				coverage: coverage,
				itemDetails,
				marketFilter: marketName || "Todos os mercados",
			}
		} catch (error) {
			return { success: false, message: `Erro ao calcular custo: ${error}` }
		}
	},
}
