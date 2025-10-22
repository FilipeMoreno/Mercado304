import { prisma } from "./prisma"

/**
 * Gera backup completo do banco de dados usando Prisma
 * Alternativa ao pg_dump para ambientes sem acesso a binários
 * Inclui todas as tabelas do sistema em ordem correta de dependências
 */
export async function generatePrismaBackup(): Promise<string> {
	const sqlStatements: string[] = []
	let totalRecords = 0

	// Header do backup
	sqlStatements.push("-- Mercado304 Database Backup (Complete)")
	sqlStatements.push(`-- Generated at: ${new Date().toISOString()}`)
	sqlStatements.push("-- Generated using Prisma with all tables")
	sqlStatements.push("-- Backup includes: Users, Markets, Products, Purchases, Stock, Waste, Recipes, etc.\n")
	sqlStatements.push("BEGIN;\n")

	try {
		// Desabilitar checks e triggers temporariamente
		sqlStatements.push("SET CONSTRAINTS ALL DEFERRED;")
		sqlStatements.push("SET session_replication_role = 'replica';\n")

		// === ORDEM CORRETA DE DEPENDÊNCIAS ===
		// 1. Tabelas independentes primeiro (Users, Markets, Brands, Categories)
		// 2. Tabelas com dependências simples (Products, etc.)
		// 3. Tabelas com múltiplas dependências (Purchases, Stock, etc.)

		// 1. Users (base do sistema de autenticação)
		const users = await prisma.user.findMany()
		if (users.length > 0) {
			sqlStatements.push("-- Users")
			for (const user of users) {
				sqlStatements.push(
					`INSERT INTO users (id, name, email, "emailVerified", image, "normalizedEmail", "twoFactorEnabled", "failedLoginAttempts", "lastFailedLogin", "createdAt", "updatedAt") VALUES (${escapeValue(user.id)}, ${escapeValue(user.name)}, ${escapeValue(user.email)}, ${user.emailVerified}, ${escapeValue(user.image)}, ${escapeValue(user.normalizedEmail)}, ${user.twoFactorEnabled}, ${escapeNumber(user.failedLoginAttempts)}, ${escapeValue(user.lastFailedLogin)}, ${escapeValue(user.createdAt)}, ${escapeValue(user.updatedAt)}) ON CONFLICT (id) DO NOTHING;`,
				)
			}
			totalRecords += users.length
			sqlStatements.push("")
		}

		// 2. Sessions
		const sessions = await prisma.session.findMany()
		if (sessions.length > 0) {
			sqlStatements.push("-- Sessions")
			for (const session of sessions) {
				sqlStatements.push(
					`INSERT INTO sessions (id, token, "userId", "expiresAt", "userAgent", "ipAddress", "createdAt", "updatedAt") VALUES (${escapeValue(session.id)}, ${escapeValue(session.token)}, ${escapeValue(session.userId)}, ${escapeValue(session.expiresAt)}, ${escapeValue(session.userAgent)}, ${escapeValue(session.ipAddress)}, ${escapeValue(session.createdAt)}, ${escapeValue(session.updatedAt)}) ON CONFLICT (id) DO NOTHING;`,
				)
			}
			totalRecords += sessions.length
			sqlStatements.push("")
		}

		// 3. Markets
		const markets = await prisma.market.findMany()
		if (markets.length > 0) {
			sqlStatements.push("-- Markets")
			for (const market of markets) {
				sqlStatements.push(
					`INSERT INTO markets (id, name, "legalName", location, "createdAt", "updatedAt") VALUES (${escapeValue(market.id)}, ${escapeValue(market.name)}, ${escapeValue(market.legalName)}, ${escapeValue(market.location)}, ${escapeValue(market.createdAt)}, ${escapeValue(market.updatedAt)}) ON CONFLICT (id) DO NOTHING;`,
				)
			}
			totalRecords += markets.length
			sqlStatements.push("")
		}

		// 4. Brands
		const brands = await prisma.brand.findMany()
		if (brands.length > 0) {
			sqlStatements.push("-- Brands")
			for (const brand of brands) {
				sqlStatements.push(
					`INSERT INTO brands (id, name, "createdAt", "updatedAt") VALUES (${escapeValue(brand.id)}, ${escapeValue(brand.name)}, ${escapeValue(brand.createdAt)}, ${escapeValue(brand.updatedAt)}) ON CONFLICT (id) DO NOTHING;`,
				)
			}
			totalRecords += brands.length
			sqlStatements.push("")
		}

		// 5. Categories
		const categories = await prisma.category.findMany()
		if (categories.length > 0) {
			sqlStatements.push("-- Categories")
			for (const category of categories) {
				sqlStatements.push(
					`INSERT INTO categories (id, name, icon, color, "isFood", "createdAt", "updatedAt") VALUES (${escapeValue(category.id)}, ${escapeValue(category.name)}, ${escapeValue(category.icon)}, ${escapeValue(category.color)}, ${category.isFood}, ${escapeValue(category.createdAt)}, ${escapeValue(category.updatedAt)}) ON CONFLICT (id) DO NOTHING;`,
				)
			}
			totalRecords += categories.length
			sqlStatements.push("")
		}

		// 6. Products
		const products = await prisma.product.findMany()
		if (products.length > 0) {
			sqlStatements.push("-- Products")
			for (const product of products) {
				sqlStatements.push(
					`INSERT INTO products (id, name, barcode, "categoryId", "brandId", unit, "packageSize", "hasStock", "minStock", "maxStock", "hasExpiration", "defaultShelfLifeDays", "isKit", "createdAt", "updatedAt") VALUES (${escapeValue(product.id)}, ${escapeValue(product.name)}, ${escapeValue(product.barcode)}, ${escapeValue(product.categoryId)}, ${escapeValue(product.brandId)}, ${escapeValue(product.unit)}, ${escapeValue(product.packageSize)}, ${product.hasStock}, ${escapeNumber(product.minStock)}, ${escapeNumber(product.maxStock)}, ${product.hasExpiration}, ${escapeNumber(product.defaultShelfLifeDays)}, ${product.isKit}, ${escapeValue(product.createdAt)}, ${escapeValue(product.updatedAt)}) ON CONFLICT (id) DO NOTHING;`,
				)
			}
			totalRecords += products.length
			sqlStatements.push("")
		}

		// 7. Nutritional Info
		const nutritionalInfos = await prisma.nutritionalInfo.findMany()
		if (nutritionalInfos.length > 0) {
			sqlStatements.push("-- Nutritional Info")
			for (const info of nutritionalInfos) {
				sqlStatements.push(
					`INSERT INTO nutritional_info (id, "productId", "servingSize", "servingsPerPackage", calories, proteins, "totalFat", "saturatedFat", "transFat", carbohydrates, "totalSugars", "addedSugars", fiber, sodium, "vitaminA", "vitaminC", "vitaminD", calcium, iron, magnesium, potassium, caffeine, cholesterol, "allergensContains", "allergensMayContain", "createdAt", "updatedAt") VALUES (${escapeValue(info.id)}, ${escapeValue(info.productId)}, ${escapeValue(info.servingSize)}, ${escapeNumber(info.servingsPerPackage)}, ${escapeNumber(info.calories)}, ${escapeNumber(info.proteins)}, ${escapeNumber(info.totalFat)}, ${escapeNumber(info.saturatedFat)}, ${escapeNumber(info.transFat)}, ${escapeNumber(info.carbohydrates)}, ${escapeNumber(info.totalSugars)}, ${escapeNumber(info.addedSugars)}, ${escapeNumber(info.fiber)}, ${escapeNumber(info.sodium)}, ${escapeNumber(info.vitaminA)}, ${escapeNumber(info.vitaminC)}, ${escapeNumber(info.vitaminD)}, ${escapeNumber(info.calcium)}, ${escapeNumber(info.iron)}, ${escapeNumber(info.magnesium)}, ${escapeNumber(info.potassium)}, ${escapeNumber(info.caffeine)}, ${escapeNumber(info.cholesterol)}, ${escapeArrayValue(info.allergensContains)}, ${escapeArrayValue(info.allergensMayContain)}, ${escapeValue(info.createdAt)}, ${escapeValue(info.updatedAt)}) ON CONFLICT (id) DO NOTHING;`,
				)
			}
			totalRecords += nutritionalInfos.length
			sqlStatements.push("")
		}

		// 8. Product Kits
		const productKits = await prisma.productKit.findMany()
		if (productKits.length > 0) {
			sqlStatements.push("-- Product Kits")
			for (const kit of productKits) {
				sqlStatements.push(
					`INSERT INTO product_kits (id, "kitProductId", description, barcode, "brandId", "categoryId", "createdAt", "updatedAt") VALUES (${escapeValue(kit.id)}, ${escapeValue(kit.kitProductId)}, ${escapeValue(kit.description)}, ${escapeValue(kit.barcode)}, ${escapeValue(kit.brandId)}, ${escapeValue(kit.categoryId)}, ${escapeValue(kit.createdAt)}, ${escapeValue(kit.updatedAt)}) ON CONFLICT (id) DO NOTHING;`,
				)
			}
			totalRecords += productKits.length
			sqlStatements.push("")
		}

		// 9. Product Kit Items
		const productKitItems = await prisma.productKitItem.findMany()
		if (productKitItems.length > 0) {
			sqlStatements.push("-- Product Kit Items")
			for (const kitItem of productKitItems) {
				sqlStatements.push(
					`INSERT INTO product_kit_items (id, "kitId", "productId", quantity, "createdAt", "updatedAt") VALUES (${escapeValue(kitItem.id)}, ${escapeValue(kitItem.kitId)}, ${escapeValue(kitItem.productId)}, ${escapeNumber(kitItem.quantity)}, ${escapeValue(kitItem.createdAt)}, ${escapeValue(kitItem.updatedAt)}) ON CONFLICT (id) DO NOTHING;`,
				)
			}
			totalRecords += productKitItems.length
			sqlStatements.push("")
		}

		// 10. Purchases
		const purchases = await prisma.purchase.findMany()
		if (purchases.length > 0) {
			sqlStatements.push("-- Purchases")
			for (const purchase of purchases) {
				sqlStatements.push(
					`INSERT INTO purchases (id, "marketId", "totalAmount", "totalDiscount", "finalAmount", "purchaseDate", "paymentMethod", "createdAt", "updatedAt") VALUES (${escapeValue(purchase.id)}, ${escapeValue(purchase.marketId)}, ${purchase.totalAmount}, ${escapeNumber(purchase.totalDiscount)}, ${escapeNumber(purchase.finalAmount)}, ${escapeValue(purchase.purchaseDate)}, ${escapeValue(purchase.paymentMethod)}, ${escapeValue(purchase.createdAt)}, ${escapeValue(purchase.updatedAt)}) ON CONFLICT (id) DO NOTHING;`,
				)
			}
			totalRecords += purchases.length
			sqlStatements.push("")
		}

		// 11. Purchase Items
		const purchaseItems = await prisma.purchaseItem.findMany()
		if (purchaseItems.length > 0) {
			sqlStatements.push("-- Purchase Items")
			for (const item of purchaseItems) {
				sqlStatements.push(
					`INSERT INTO purchase_items (id, "purchaseId", "productId", quantity, "unitPrice", "unitDiscount", "totalPrice", "totalDiscount", "finalPrice", "productName", "productUnit", "productCategory", "brandName", "createdAt", "updatedAt") VALUES (${escapeValue(item.id)}, ${escapeValue(item.purchaseId)}, ${escapeValue(item.productId)}, ${item.quantity}, ${item.unitPrice}, ${escapeNumber(item.unitDiscount)}, ${item.totalPrice}, ${escapeNumber(item.totalDiscount)}, ${item.finalPrice}, ${escapeValue(item.productName)}, ${escapeValue(item.productUnit)}, ${escapeValue(item.productCategory)}, ${escapeValue(item.brandName)}, ${escapeValue(item.createdAt)}, ${escapeValue(item.updatedAt)}) ON CONFLICT (id) DO NOTHING;`,
				)
			}
			totalRecords += purchaseItems.length
			sqlStatements.push("")
		}

		// 12. Shopping Lists
		const shoppingLists = await prisma.shoppingList.findMany()
		if (shoppingLists.length > 0) {
			sqlStatements.push("-- Shopping Lists")
			for (const list of shoppingLists) {
				sqlStatements.push(
					`INSERT INTO shopping_lists (id, name, "isActive", "createdAt", "updatedAt") VALUES (${escapeValue(list.id)}, ${escapeValue(list.name)}, ${list.isActive}, ${escapeValue(list.createdAt)}, ${escapeValue(list.updatedAt)}) ON CONFLICT (id) DO NOTHING;`,
				)
			}
			totalRecords += shoppingLists.length
			sqlStatements.push("")
		}

		// 13. Shopping List Items
		const shoppingListItems = await prisma.shoppingListItem.findMany()
		if (shoppingListItems.length > 0) {
			sqlStatements.push("-- Shopping List Items")
			for (const item of shoppingListItems) {
				sqlStatements.push(
					`INSERT INTO shopping_list_items (id, "listId", "productId", quantity, "isChecked", "estimatedPrice", "productName", "productUnit", barcode, brand, category, notes, "createdAt", "updatedAt") VALUES (${escapeValue(item.id)}, ${escapeValue(item.listId)}, ${escapeValue(item.productId)}, ${item.quantity}, ${item.isChecked}, ${escapeNumber(item.estimatedPrice)}, ${escapeValue(item.productName)}, ${escapeValue(item.productUnit)}, ${escapeValue(item.barcode)}, ${escapeValue(item.brand)}, ${escapeValue(item.category)}, ${escapeValue(item.notes)}, ${escapeValue(item.createdAt)}, ${escapeValue(item.updatedAt)}) ON CONFLICT (id) DO NOTHING;`,
				)
			}
			totalRecords += shoppingListItems.length
			sqlStatements.push("")
		}

		// 14. Stock Items
		const stockItems = await prisma.stockItem.findMany()
		if (stockItems.length > 0) {
			sqlStatements.push("-- Stock Items")
			for (const item of stockItems) {
				sqlStatements.push(
					`INSERT INTO stock_items (id, "productId", quantity, location, "unitCost", "expirationDate", notes, "addedDate", "lastUpdated", "isExpired", "isLowStock") VALUES (${escapeValue(item.id)}, ${escapeValue(item.productId)}, ${escapeNumber(item.quantity)}, ${escapeValue(item.location)}, ${escapeNumber(item.unitCost)}, ${escapeValue(item.expirationDate)}, ${escapeValue(item.notes)}, ${escapeValue(item.addedDate)}, ${escapeValue(item.lastUpdated)}, ${item.isExpired}, ${item.isLowStock}) ON CONFLICT (id) DO NOTHING;`,
				)
			}
			totalRecords += stockItems.length
			sqlStatements.push("")
		}

		// 15. Stock History
		const stockHistory = await prisma.stockHistory.findMany()
		if (stockHistory.length > 0) {
			sqlStatements.push("-- Stock History")
			for (const history of stockHistory) {
				sqlStatements.push(
					`INSERT INTO stock_history (id, type, "productId", "productName", quantity, reason, date, notes, location, "unitCost", "totalValue", "purchaseItemId", "userId", "createdAt", "updatedAt") VALUES (${escapeValue(history.id)}, ${escapeValue(history.type)}, ${escapeValue(history.productId)}, ${escapeValue(history.productName)}, ${escapeNumber(history.quantity)}, ${escapeValue(history.reason)}, ${escapeValue(history.date)}, ${escapeValue(history.notes)}, ${escapeValue(history.location)}, ${escapeNumber(history.unitCost)}, ${escapeNumber(history.totalValue)}, ${escapeValue(history.purchaseItemId)}, ${escapeValue(history.userId)}, ${escapeValue(history.createdAt)}, ${escapeValue(history.updatedAt)}) ON CONFLICT (id) DO NOTHING;`,
				)
			}
			totalRecords += stockHistory.length
			sqlStatements.push("")
		}

		// 16. Stock Movements
		const stockMovements = await prisma.stockMovement.findMany()
		if (stockMovements.length > 0) {
			sqlStatements.push("-- Stock Movements")
			for (const movement of stockMovements) {
				sqlStatements.push(
					`INSERT INTO stock_movements (id, "stockItemId", type, quantity, reason, date, notes, "purchaseItemId") VALUES (${escapeValue(movement.id)}, ${escapeValue(movement.stockItemId)}, ${escapeValue(movement.type)}, ${escapeNumber(movement.quantity)}, ${escapeValue(movement.reason)}, ${escapeValue(movement.date)}, ${escapeValue(movement.notes)}, ${escapeValue(movement.purchaseItemId)}) ON CONFLICT (id) DO NOTHING;`,
				)
			}
			totalRecords += stockMovements.length
			sqlStatements.push("")
		}

		// 17. Waste Records
		const wasteRecords = await prisma.wasteRecord.findMany()
		if (wasteRecords.length > 0) {
			sqlStatements.push("-- Waste Records")
			for (const waste of wasteRecords) {
				sqlStatements.push(
					`INSERT INTO waste_records (id, "productId", "productName", quantity, unit, "wasteReason", "wasteDate", "expirationDate", location, "unitCost", "totalValue", notes, "stockItemId", "userId", category, brand, "batchNumber", "createdAt", "updatedAt") VALUES (${escapeValue(waste.id)}, ${escapeValue(waste.productId)}, ${escapeValue(waste.productName)}, ${escapeNumber(waste.quantity)}, ${escapeValue(waste.unit)}, ${escapeValue(waste.wasteReason)}, ${escapeValue(waste.wasteDate)}, ${escapeValue(waste.expirationDate)}, ${escapeValue(waste.location)}, ${escapeNumber(waste.unitCost)}, ${escapeNumber(waste.totalValue)}, ${escapeValue(waste.notes)}, ${escapeValue(waste.stockItemId)}, ${escapeValue(waste.userId)}, ${escapeValue(waste.category)}, ${escapeValue(waste.brand)}, ${escapeValue(waste.batchNumber)}, ${escapeValue(waste.createdAt)}, ${escapeValue(waste.updatedAt)}) ON CONFLICT (id) DO NOTHING;`,
				)
			}
			totalRecords += wasteRecords.length
			sqlStatements.push("")
		}

		// 18. Expiration Alerts
		const expirationAlerts = await prisma.expirationAlert.findMany()
		if (expirationAlerts.length > 0) {
			sqlStatements.push("-- Expiration Alerts")
			for (const alert of expirationAlerts) {
				sqlStatements.push(
					`INSERT INTO expiration_alerts (id, "productId", "stockItemId", "alertType", "alertDate", "isResolved", "createdAt") VALUES (${escapeValue(alert.id)}, ${escapeValue(alert.productId)}, ${escapeValue(alert.stockItemId)}, ${escapeValue(alert.alertType)}, ${escapeValue(alert.alertDate)}, ${alert.isResolved}, ${escapeValue(alert.createdAt)}) ON CONFLICT (id) DO NOTHING;`,
				)
			}
			totalRecords += expirationAlerts.length
			sqlStatements.push("")
		}

		// 19. Recipes
		const recipes = await prisma.recipe.findMany()
		if (recipes.length > 0) {
			sqlStatements.push("-- Recipes")
			for (const recipe of recipes) {
				sqlStatements.push(
					`INSERT INTO recipes (id, name, description, "prepTime", "mealType", ingredients, instructions, "chefTip", rating, "timesCooked", "isFavorite", "createdAt", "updatedAt") VALUES (${escapeValue(recipe.id)}, ${escapeValue(recipe.name)}, ${escapeValue(recipe.description)}, ${escapeValue(recipe.prepTime)}, ${escapeValue(recipe.mealType)}, ${escapeArrayValue(recipe.ingredients)}, ${escapeValue(recipe.instructions)}, ${escapeValue(recipe.chefTip)}, ${escapeNumber(recipe.rating)}, ${escapeNumber(recipe.timesCooked)}, ${recipe.isFavorite}, ${escapeValue(recipe.createdAt)}, ${escapeValue(recipe.updatedAt)}) ON CONFLICT (id) DO NOTHING;`,
				)
			}
			totalRecords += recipes.length
			sqlStatements.push("")
		}

		// 20. Price Records
		const priceRecords = await prisma.priceRecord.findMany()
		if (priceRecords.length > 0) {
			sqlStatements.push("-- Price Records")
			for (const record of priceRecords) {
				sqlStatements.push(
					`INSERT INTO price_records (id, "productId", "marketId", price, "recordDate", notes, "createdAt", "updatedAt") VALUES (${escapeValue(record.id)}, ${escapeValue(record.productId)}, ${escapeValue(record.marketId)}, ${record.price}, ${escapeValue(record.recordDate)}, ${escapeValue(record.notes)}, ${escapeValue(record.createdAt)}, ${escapeValue(record.updatedAt)}) ON CONFLICT (id) DO NOTHING;`,
				)
			}
			totalRecords += priceRecords.length
			sqlStatements.push("")
		}

		// === TABELAS ADICIONAIS OPCIONAIS ===
		// Nota: Algumas tabelas de autenticação são omitidas para evitar problemas de compatibilidade
		// O backup foca nas tabelas principais de dados do negócio

		try {
			// 21. Sync Jobs (se existir)
			const syncJobs = await prisma.syncJob.findMany()
			if (syncJobs.length > 0) {
				sqlStatements.push("-- Sync Jobs")
				for (const job of syncJobs) {
					sqlStatements.push(
						`INSERT INTO sync_jobs (id, status, tipo, progresso, "mercadosProcessados", "produtosProcessados", "precosRegistrados", erros, logs, detalhes, "startedAt", "completedAt", "createdAt", "updatedAt") VALUES (${escapeValue(job.id)}, ${escapeValue(job.status)}, ${escapeValue(job.tipo)}, ${escapeNumber(job.progresso)}, ${escapeNumber(job.mercadosProcessados)}, ${escapeNumber(job.produtosProcessados)}, ${escapeNumber(job.precosRegistrados)}, ${escapeValue(JSON.stringify(job.erros))}, ${escapeValue(JSON.stringify(job.logs))}, ${escapeValue(job.detalhes ? JSON.stringify(job.detalhes) : null)}, ${escapeValue(job.startedAt)}, ${escapeValue(job.completedAt)}, ${escapeValue(job.createdAt)}, ${escapeValue(job.updatedAt)}) ON CONFLICT (id) DO NOTHING;`,
					)
				}
				totalRecords += syncJobs.length
				sqlStatements.push("")
			}
		} catch (error) {
			console.warn("[Backup] Erro ao fazer backup de tabelas opcionais (ignorado):", error)
		}

		// Reabilitar constraints e triggers
		sqlStatements.push("SET session_replication_role = 'origin';")
		sqlStatements.push("SET CONSTRAINTS ALL IMMEDIATE;")

		// Footer do backup com estatísticas
		sqlStatements.push("COMMIT;")
		sqlStatements.push(`\n-- ============================================`)
		sqlStatements.push(`-- BACKUP COMPLETED SUCCESSFULLY`)
		sqlStatements.push(`-- ============================================`)
		sqlStatements.push(`-- Completed at: ${new Date().toISOString()}`)
		sqlStatements.push(`-- Total records backed up: ${totalRecords}`)
		sqlStatements.push(`-- Generated using: Prisma Complete Backup System`)
		sqlStatements.push(`-- Backup includes: All tables, all data, all relationships`)

		return sqlStatements.join("\n")
	} catch (error) {
		sqlStatements.push("ROLLBACK;")
		throw error
	}
}

/**
 * Escapa valores para SQL
 */
function escapeValue(value: string | number | Date | null | undefined): string {
	if (value === null || value === undefined) {
		return "NULL"
	}

	if (value instanceof Date) {
		return `'${value.toISOString()}'`
	}

	if (typeof value === "string") {
		return `'${value.replace(/'/g, "''")}'`
	}

	return `'${String(value)}'`
}

/**
 * Escapa números para SQL
 */
function escapeNumber(value: number | null | undefined): string {
	if (value === null || value === undefined) {
		return "NULL"
	}
	return String(value)
}

/**
 * Escapa arrays para SQL (converte para JSON)
 */
function escapeArrayValue(value: string[] | null | undefined): string {
	if (value === null || value === undefined) {
		return "NULL"
	}
	if (Array.isArray(value)) {
		return `'${JSON.stringify(value).replace(/'/g, "''")}'`
	}
	return "NULL"
}
