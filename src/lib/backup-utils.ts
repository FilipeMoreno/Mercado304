import { prisma } from "./prisma"

/**
 * Gera backup do banco de dados usando Prisma
 * Alternativa ao pg_dump para ambientes sem acesso a binários
 */
export async function generatePrismaBackup(): Promise<string> {
	const sqlStatements: string[] = []

	// Header do backup
	sqlStatements.push("-- Mercado304 Database Backup")
	sqlStatements.push(`-- Generated at: ${new Date().toISOString()}`)
	sqlStatements.push("-- Generated using Prisma\n")
	sqlStatements.push("BEGIN;\n")

	try {
		// Desabilitar checks temporariamente
		sqlStatements.push("SET CONSTRAINTS ALL DEFERRED;\n")

		// 1. Backup de Markets
		const markets = await prisma.market.findMany()
		if (markets.length > 0) {
			sqlStatements.push("-- Markets")
			for (const market of markets) {
				sqlStatements.push(
					`INSERT INTO markets (id, name, "legalName", location, "createdAt", "updatedAt") VALUES (${escapeValue(market.id)}, ${escapeValue(market.name)}, ${escapeValue(market.legalName)}, ${escapeValue(market.location)}, ${escapeValue(market.createdAt)}, ${escapeValue(market.updatedAt)}) ON CONFLICT (id) DO NOTHING;`
				)
			}
			sqlStatements.push("")
		}

		// 2. Backup de Brands
		const brands = await prisma.brand.findMany()
		if (brands.length > 0) {
			sqlStatements.push("-- Brands")
			for (const brand of brands) {
				sqlStatements.push(
					`INSERT INTO brands (id, name, "createdAt", "updatedAt") VALUES (${escapeValue(brand.id)}, ${escapeValue(brand.name)}, ${escapeValue(brand.createdAt)}, ${escapeValue(brand.updatedAt)}) ON CONFLICT (id) DO NOTHING;`
				)
			}
			sqlStatements.push("")
		}

		// 3. Backup de Categories
		const categories = await prisma.category.findMany()
		if (categories.length > 0) {
			sqlStatements.push("-- Categories")
			for (const category of categories) {
				sqlStatements.push(
					`INSERT INTO categories (id, name, icon, color, "isFood", "createdAt", "updatedAt") VALUES (${escapeValue(category.id)}, ${escapeValue(category.name)}, ${escapeValue(category.icon)}, ${escapeValue(category.color)}, ${category.isFood}, ${escapeValue(category.createdAt)}, ${escapeValue(category.updatedAt)}) ON CONFLICT (id) DO NOTHING;`
				)
			}
			sqlStatements.push("")
		}

		// 4. Backup de Products
		const products = await prisma.product.findMany()
		if (products.length > 0) {
			sqlStatements.push("-- Products")
			for (const product of products) {
				sqlStatements.push(
					`INSERT INTO products (id, name, barcode, "categoryId", "brandId", unit, "packageSize", "hasStock", "minStock", "maxStock", "hasExpiration", "defaultShelfLifeDays", "isKit", "createdAt", "updatedAt") VALUES (${escapeValue(product.id)}, ${escapeValue(product.name)}, ${escapeValue(product.barcode)}, ${escapeValue(product.categoryId)}, ${escapeValue(product.brandId)}, ${escapeValue(product.unit)}, ${escapeValue(product.packageSize)}, ${product.hasStock}, ${escapeNumber(product.minStock)}, ${escapeNumber(product.maxStock)}, ${product.hasExpiration}, ${escapeNumber(product.defaultShelfLifeDays)}, ${product.isKit}, ${escapeValue(product.createdAt)}, ${escapeValue(product.updatedAt)}) ON CONFLICT (id) DO NOTHING;`
				)
			}
			sqlStatements.push("")
		}

		// 5. Backup de Purchases
		const purchases = await prisma.purchase.findMany()
		if (purchases.length > 0) {
			sqlStatements.push("-- Purchases")
			for (const purchase of purchases) {
				sqlStatements.push(
					`INSERT INTO purchases (id, "marketId", "totalAmount", "totalDiscount", "finalAmount", "purchaseDate", "paymentMethod", "createdAt", "updatedAt") VALUES (${escapeValue(purchase.id)}, ${escapeValue(purchase.marketId)}, ${purchase.totalAmount}, ${escapeNumber(purchase.totalDiscount)}, ${escapeNumber(purchase.finalAmount)}, ${escapeValue(purchase.purchaseDate)}, ${escapeValue(purchase.paymentMethod)}, ${escapeValue(purchase.createdAt)}, ${escapeValue(purchase.updatedAt)}) ON CONFLICT (id) DO NOTHING;`
				)
			}
			sqlStatements.push("")
		}

		// 6. Backup de PurchaseItems
		const purchaseItems = await prisma.purchaseItem.findMany()
		if (purchaseItems.length > 0) {
			sqlStatements.push("-- Purchase Items")
			for (const item of purchaseItems) {
				sqlStatements.push(
					`INSERT INTO purchase_items (id, "purchaseId", "productId", quantity, "unitPrice", "unitDiscount", "totalPrice", "totalDiscount", "finalPrice", "productName", "productUnit", "productCategory", "brandName", "createdAt", "updatedAt") VALUES (${escapeValue(item.id)}, ${escapeValue(item.purchaseId)}, ${escapeValue(item.productId)}, ${item.quantity}, ${item.unitPrice}, ${escapeNumber(item.unitDiscount)}, ${item.totalPrice}, ${escapeNumber(item.totalDiscount)}, ${item.finalPrice}, ${escapeValue(item.productName)}, ${escapeValue(item.productUnit)}, ${escapeValue(item.productCategory)}, ${escapeValue(item.brandName)}, ${escapeValue(item.createdAt)}, ${escapeValue(item.updatedAt)}) ON CONFLICT (id) DO NOTHING;`
				)
			}
			sqlStatements.push("")
		}

		// 7. Backup de ShoppingLists
		const shoppingLists = await prisma.shoppingList.findMany()
		if (shoppingLists.length > 0) {
			sqlStatements.push("-- Shopping Lists")
			for (const list of shoppingLists) {
				sqlStatements.push(
					`INSERT INTO shopping_lists (id, name, "isActive", "createdAt", "updatedAt") VALUES (${escapeValue(list.id)}, ${escapeValue(list.name)}, ${list.isActive}, ${escapeValue(list.createdAt)}, ${escapeValue(list.updatedAt)}) ON CONFLICT (id) DO NOTHING;`
				)
			}
			sqlStatements.push("")
		}

		// 8. Backup de ShoppingListItems
		const shoppingListItems = await prisma.shoppingListItem.findMany()
		if (shoppingListItems.length > 0) {
			sqlStatements.push("-- Shopping List Items")
			for (const item of shoppingListItems) {
				sqlStatements.push(
					`INSERT INTO shopping_list_items (id, "listId", "productId", quantity, "isChecked", "estimatedPrice", "productName", "productUnit", barcode, brand, category, notes, "createdAt", "updatedAt") VALUES (${escapeValue(item.id)}, ${escapeValue(item.listId)}, ${escapeValue(item.productId)}, ${item.quantity}, ${item.isChecked}, ${escapeNumber(item.estimatedPrice)}, ${escapeValue(item.productName)}, ${escapeValue(item.productUnit)}, ${escapeValue(item.barcode)}, ${escapeValue(item.brand)}, ${escapeValue(item.category)}, ${escapeValue(item.notes)}, ${escapeValue(item.createdAt)}, ${escapeValue(item.updatedAt)}) ON CONFLICT (id) DO NOTHING;`
				)
			}
			sqlStatements.push("")
		}

		// 9. Backup de PriceRecords
		const priceRecords = await prisma.priceRecord.findMany()
		if (priceRecords.length > 0) {
			sqlStatements.push("-- Price Records")
			for (const record of priceRecords) {
				sqlStatements.push(
					`INSERT INTO price_records (id, "productId", "marketId", price, "recordDate", notes, "createdAt", "updatedAt") VALUES (${escapeValue(record.id)}, ${escapeValue(record.productId)}, ${escapeValue(record.marketId)}, ${record.price}, ${escapeValue(record.recordDate)}, ${escapeValue(record.notes)}, ${escapeValue(record.createdAt)}, ${escapeValue(record.updatedAt)}) ON CONFLICT (id) DO NOTHING;`
				)
			}
			sqlStatements.push("")
		}

		// 10. Backup de StockItem
		const stockItems = await prisma.stockItem.findMany()
		if (stockItems.length > 0) {
			sqlStatements.push("-- Stock Items")
			for (const item of stockItems) {
				sqlStatements.push(
					`INSERT INTO stock_items (id, "productId", quantity, "expirationDate", location, "unitCost", "addedDate", "lastUpdated", notes, "isExpired", "isLowStock") VALUES (${escapeValue(item.id)}, ${escapeValue(item.productId)}, ${item.quantity}, ${escapeValue(item.expirationDate)}, ${escapeValue(item.location)}, ${escapeNumber(item.unitCost)}, ${escapeValue(item.addedDate)}, ${escapeValue(item.lastUpdated)}, ${escapeValue(item.notes)}, ${item.isExpired}, ${item.isLowStock}) ON CONFLICT (id) DO NOTHING;`
				)
			}
			sqlStatements.push("")
		}

		// 11. Backup de StockHistory
		const stockHistory = await prisma.stockHistory.findMany()
		if (stockHistory.length > 0) {
			sqlStatements.push("-- Stock History")
			for (const history of stockHistory) {
				sqlStatements.push(
					`INSERT INTO stock_history (id, type, "productId", "productName", quantity, reason, date, notes, location, "unitCost", "totalValue", "purchaseItemId", "userId", "createdAt", "updatedAt") VALUES (${escapeValue(history.id)}, ${escapeValue(history.type)}, ${escapeValue(history.productId)}, ${escapeValue(history.productName)}, ${history.quantity}, ${escapeValue(history.reason)}, ${escapeValue(history.date)}, ${escapeValue(history.notes)}, ${escapeValue(history.location)}, ${escapeNumber(history.unitCost)}, ${escapeNumber(history.totalValue)}, ${escapeValue(history.purchaseItemId)}, ${escapeValue(history.userId)}, ${escapeValue(history.createdAt)}, ${escapeValue(history.updatedAt)}) ON CONFLICT (id) DO NOTHING;`
				)
			}
			sqlStatements.push("")
		}

		// 12. Backup de StockMovement
		const stockMovements = await prisma.stockMovement.findMany()
		if (stockMovements.length > 0) {
			sqlStatements.push("-- Stock Movements")
			for (const movement of stockMovements) {
				sqlStatements.push(
					`INSERT INTO stock_movements (id, "stockItemId", type, quantity, reason, date, notes, "purchaseItemId") VALUES (${escapeValue(movement.id)}, ${escapeValue(movement.stockItemId)}, ${escapeValue(movement.type)}, ${movement.quantity}, ${escapeValue(movement.reason)}, ${escapeValue(movement.date)}, ${escapeValue(movement.notes)}, ${escapeValue(movement.purchaseItemId)}) ON CONFLICT (id) DO NOTHING;`
				)
			}
			sqlStatements.push("")
		}

		// 13. Backup de WasteRecord
		const wasteRecords = await prisma.wasteRecord.findMany()
		if (wasteRecords.length > 0) {
			sqlStatements.push("-- Waste Records")
			for (const waste of wasteRecords) {
				sqlStatements.push(
					`INSERT INTO waste_records (id, "productId", "productName", category, quantity, unit, "wasteReason", "wasteDate", "expirationDate", location, "unitCost", "totalValue", notes, "stockItemId", "userId", brand, "batchNumber", "createdAt", "updatedAt") VALUES (${escapeValue(waste.id)}, ${escapeValue(waste.productId)}, ${escapeValue(waste.productName)}, ${escapeValue(waste.category)}, ${waste.quantity}, ${escapeValue(waste.unit)}, ${escapeValue(waste.wasteReason)}, ${escapeValue(waste.wasteDate)}, ${escapeValue(waste.expirationDate)}, ${escapeValue(waste.location)}, ${escapeNumber(waste.unitCost)}, ${escapeNumber(waste.totalValue)}, ${escapeValue(waste.notes)}, ${escapeValue(waste.stockItemId)}, ${escapeValue(waste.userId)}, ${escapeValue(waste.brand)}, ${escapeValue(waste.batchNumber)}, ${escapeValue(waste.createdAt)}, ${escapeValue(waste.updatedAt)}) ON CONFLICT (id) DO NOTHING;`
				)
			}
			sqlStatements.push("")
		}

		// 14. Backup de ExpirationAlert
		const expirationAlerts = await prisma.expirationAlert.findMany()
		if (expirationAlerts.length > 0) {
			sqlStatements.push("-- Expiration Alerts")
			for (const alert of expirationAlerts) {
				sqlStatements.push(
					`INSERT INTO expiration_alerts (id, "stockItemId", "productId", "alertType", "alertDate", "isResolved", "createdAt") VALUES (${escapeValue(alert.id)}, ${escapeValue(alert.stockItemId)}, ${escapeValue(alert.productId)}, ${escapeValue(alert.alertType)}, ${escapeValue(alert.alertDate)}, ${alert.isResolved}, ${escapeValue(alert.createdAt)}) ON CONFLICT (id) DO NOTHING;`
				)
			}
			sqlStatements.push("")
		}

		// 15. Backup de NutritionalInfo
		const nutritionalInfo = await prisma.nutritionalInfo.findMany()
		if (nutritionalInfo.length > 0) {
			sqlStatements.push("-- Nutritional Info")
			for (const info of nutritionalInfo) {
				sqlStatements.push(
					`INSERT INTO nutritional_info (id, "productId", "servingSize", "servingsPerPackage", calories, proteins, "totalFat", "saturatedFat", "transFat", carbohydrates, "totalSugars", "addedSugars", fiber, sodium, "vitaminA", "vitaminC", "vitaminD", "vitaminE", "vitaminK", thiamine, riboflavin, niacin, "vitaminB6", folate, "vitaminB12", biotin, "pantothenicAcid", taurine, caffeine, lactose, galactose, "alcoholContent", omega3, omega6, "monounsaturatedFat", "polyunsaturatedFat", cholesterol, epa, dha, "linolenicAcid", calcium, iron, magnesium, phosphorus, potassium, zinc, copper, manganese, selenium, iodine, chromium, molybdenum, "allergensContains", "allergensMayContain", "createdAt", "updatedAt") VALUES (${escapeValue(info.id)}, ${escapeValue(info.productId)}, ${escapeValue(info.servingSize)}, ${escapeNumber(info.servingsPerPackage)}, ${escapeNumber(info.calories)}, ${escapeNumber(info.proteins)}, ${escapeNumber(info.totalFat)}, ${escapeNumber(info.saturatedFat)}, ${escapeNumber(info.transFat)}, ${escapeNumber(info.carbohydrates)}, ${escapeNumber(info.totalSugars)}, ${escapeNumber(info.addedSugars)}, ${escapeNumber(info.fiber)}, ${escapeNumber(info.sodium)}, ${escapeNumber(info.vitaminA)}, ${escapeNumber(info.vitaminC)}, ${escapeNumber(info.vitaminD)}, ${escapeNumber(info.vitaminE)}, ${escapeNumber(info.vitaminK)}, ${escapeNumber(info.thiamine)}, ${escapeNumber(info.riboflavin)}, ${escapeNumber(info.niacin)}, ${escapeNumber(info.vitaminB6)}, ${escapeNumber(info.folate)}, ${escapeNumber(info.vitaminB12)}, ${escapeNumber(info.biotin)}, ${escapeNumber(info.pantothenicAcid)}, ${escapeNumber(info.taurine)}, ${escapeNumber(info.caffeine)}, ${escapeNumber(info.lactose)}, ${escapeNumber(info.galactose)}, ${escapeNumber(info.alcoholContent)}, ${escapeNumber(info.omega3)}, ${escapeNumber(info.omega6)}, ${escapeNumber(info.monounsaturatedFat)}, ${escapeNumber(info.polyunsaturatedFat)}, ${escapeNumber(info.cholesterol)}, ${escapeNumber(info.epa)}, ${escapeNumber(info.dha)}, ${escapeNumber(info.linolenicAcid)}, ${escapeNumber(info.calcium)}, ${escapeNumber(info.iron)}, ${escapeNumber(info.magnesium)}, ${escapeNumber(info.phosphorus)}, ${escapeNumber(info.potassium)}, ${escapeNumber(info.zinc)}, ${escapeNumber(info.copper)}, ${escapeNumber(info.manganese)}, ${escapeNumber(info.selenium)}, ${escapeNumber(info.iodine)}, ${escapeNumber(info.chromium)}, ${escapeNumber(info.molybdenum)}, ${escapeValue(JSON.stringify(info.allergensContains))}, ${escapeValue(JSON.stringify(info.allergensMayContain))}, ${escapeValue(info.createdAt)}, ${escapeValue(info.updatedAt)}) ON CONFLICT (id) DO NOTHING;`
				)
			}
			sqlStatements.push("")
		}

		// 16. Backup de Recipe
		const recipes = await prisma.recipe.findMany()
		if (recipes.length > 0) {
			sqlStatements.push("-- Recipes")
			for (const recipe of recipes) {
				sqlStatements.push(
					`INSERT INTO recipes (id, name, description, "prepTime", "mealType", ingredients, instructions, "chefTip", rating, "timesCooked", "isFavorite", "createdAt", "updatedAt") VALUES (${escapeValue(recipe.id)}, ${escapeValue(recipe.name)}, ${escapeValue(recipe.description)}, ${escapeValue(recipe.prepTime)}, ${escapeValue(recipe.mealType)}, ${escapeValue(JSON.stringify(recipe.ingredients))}, ${escapeValue(recipe.instructions)}, ${escapeValue(recipe.chefTip)}, ${escapeNumber(recipe.rating)}, ${recipe.timesCooked}, ${recipe.isFavorite}, ${escapeValue(recipe.createdAt)}, ${escapeValue(recipe.updatedAt)}) ON CONFLICT (id) DO NOTHING;`
				)
			}
			sqlStatements.push("")
		}

		// 17. Backup de SyncJob
		const syncJobs = await prisma.syncJob.findMany()
		if (syncJobs.length > 0) {
			sqlStatements.push("-- Sync Jobs")
			for (const job of syncJobs) {
				sqlStatements.push(
					`INSERT INTO sync_jobs (id, status, tipo, progresso, "mercadosProcessados", "produtosProcessados", "precosRegistrados", erros, logs, detalhes, "startedAt", "completedAt", "createdAt", "updatedAt") VALUES (${escapeValue(job.id)}, ${escapeValue(job.status)}, ${escapeValue(job.tipo)}, ${job.progresso}, ${job.mercadosProcessados}, ${job.produtosProcessados}, ${job.precosRegistrados}, ${escapeValue(JSON.stringify(job.erros))}, ${escapeValue(JSON.stringify(job.logs))}, ${escapeValue(JSON.stringify(job.detalhes))}, ${escapeValue(job.startedAt)}, ${escapeValue(job.completedAt)}, ${escapeValue(job.createdAt)}, ${escapeValue(job.updatedAt)}) ON CONFLICT (id) DO NOTHING;`
				)
			}
			sqlStatements.push("")
		}

		// 18. Backup de User
		const users = await prisma.user.findMany()
		if (users.length > 0) {
			sqlStatements.push("-- Users")
			for (const user of users) {
				sqlStatements.push(
					`INSERT INTO "user" (id, email, "emailVerified", name, image, "createdAt", "updatedAt") VALUES (${escapeValue(user.id)}, ${escapeValue(user.email)}, ${user.emailVerified}, ${escapeValue(user.name)}, ${escapeValue(user.image)}, ${escapeValue(user.createdAt)}, ${escapeValue(user.updatedAt)}) ON CONFLICT (id) DO NOTHING;`
				)
			}
			sqlStatements.push("")
		}

		// 19. Backup de Session
		const sessions = await prisma.session.findMany()
		if (sessions.length > 0) {
			sqlStatements.push("-- Sessions")
			for (const session of sessions) {
				sqlStatements.push(
					`INSERT INTO session (id, "expiresAt", token, "createdAt", "updatedAt", "ipAddress", "userAgent", "userId", "loginMethod", location, "deviceName", "isRevoked", "revokedAt", "revokedReason") VALUES (${escapeValue(session.id)}, ${escapeValue(session.expiresAt)}, ${escapeValue(session.token)}, ${escapeValue(session.createdAt)}, ${escapeValue(session.updatedAt)}, ${escapeValue(session.ipAddress)}, ${escapeValue(session.userAgent)}, ${escapeValue(session.userId)}, ${escapeValue(session.loginMethod)}, ${escapeValue(session.location)}, ${escapeValue(session.deviceName)}, ${session.isRevoked}, ${escapeValue(session.revokedAt)}, ${escapeValue(session.revokedReason)}) ON CONFLICT (id) DO NOTHING;`
				)
			}
			sqlStatements.push("")
		}

		// 20. Backup de Account
		const accounts = await prisma.account.findMany()
		if (accounts.length > 0) {
			sqlStatements.push("-- Accounts")
			for (const account of accounts) {
				sqlStatements.push(
					`INSERT INTO account (id, "accountId", "providerId", "userId", "accessToken", "refreshToken", "idToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", scope, password, "createdAt", "updatedAt") VALUES (${escapeValue(account.id)}, ${escapeValue(account.accountId)}, ${escapeValue(account.providerId)}, ${escapeValue(account.userId)}, ${escapeValue(account.accessToken)}, ${escapeValue(account.refreshToken)}, ${escapeValue(account.idToken)}, ${escapeValue(account.accessTokenExpiresAt)}, ${escapeValue(account.refreshTokenExpiresAt)}, ${escapeValue(account.scope)}, ${escapeValue(account.password)}, ${escapeValue(account.createdAt)}, ${escapeValue(account.updatedAt)}) ON CONFLICT (id) DO NOTHING;`
				)
			}
			sqlStatements.push("")
		}

		// 21. Backup de Verification
		const verifications = await prisma.verification.findMany()
		if (verifications.length > 0) {
			sqlStatements.push("-- Verifications")
			for (const verification of verifications) {
				sqlStatements.push(
					`INSERT INTO verification (id, identifier, value, "expiresAt", "createdAt", "updatedAt") VALUES (${escapeValue(verification.id)}, ${escapeValue(verification.identifier)}, ${escapeValue(verification.value)}, ${escapeValue(verification.expiresAt)}, ${escapeValue(verification.createdAt)}, ${escapeValue(verification.updatedAt)}) ON CONFLICT (id) DO NOTHING;`
				)
			}
			sqlStatements.push("")
		}

		// 22. Backup de Passkey
		const passkeys = await prisma.passkey.findMany()
		if (passkeys.length > 0) {
			sqlStatements.push("-- Passkeys")
			for (const passkey of passkeys) {
				sqlStatements.push(
					`INSERT INTO passkey (id, name, "publicKey", "userId", "credentialID", counter, "deviceType", "backedUp", transports, "createdAt", aaguid) VALUES (${escapeValue(passkey.id)}, ${escapeValue(passkey.name)}, ${escapeValue(passkey.publicKey)}, ${escapeValue(passkey.userId)}, ${escapeValue(passkey.credentialID)}, ${passkey.counter}, ${escapeValue(passkey.deviceType)}, ${passkey.backedUp}, ${escapeValue(passkey.transports)}, ${escapeValue(passkey.createdAt)}, ${escapeValue(passkey.aaguid)}) ON CONFLICT (id) DO NOTHING;`
				)
			}
			sqlStatements.push("")
		}

		// 23. Backup de TwoFactor
		const twoFactors = await prisma.twoFactor.findMany()
		if (twoFactors.length > 0) {
			sqlStatements.push("-- Two Factors")
			for (const tf of twoFactors) {
				sqlStatements.push(
					`INSERT INTO "twoFactor" (id, secret, "backupCodes", "userId") VALUES (${escapeValue(tf.id)}, ${escapeValue(tf.secret)}, ${escapeValue(tf.backupCodes)}, ${escapeValue(tf.userId)}) ON CONFLICT (id) DO NOTHING;`
				)
			}
			sqlStatements.push("")
		}

		// 24. Backup de DashboardPreference
		const dashboardPrefs = await prisma.dashboardPreference.findMany()
		if (dashboardPrefs.length > 0) {
			sqlStatements.push("-- Dashboard Preferences")
			for (const pref of dashboardPrefs) {
				sqlStatements.push(
					`INSERT INTO dashboard_preferences (id, "userId", "cardOrder", "hiddenCards", "layoutStyle", "cardsPerRow", "showSummaryCard", "showMonthlyChart", "showCategoryStats", "showTopProducts", "showMarketCompare", "showRecentBuys", "showExpirationAlerts", "showReplenishment", "showSavingsCard", "showDiscountStats", "showTemporalComp", "showNutritionCard", "showPaymentStats", "showMonthlyStats", "customTitle", "customSubtitle", "widgetLayouts", "gridColumns", "createdAt", "updatedAt") VALUES (${escapeValue(pref.id)}, ${escapeValue(pref.userId)}, ${escapeValue(JSON.stringify(pref.cardOrder))}, ${escapeValue(JSON.stringify(pref.hiddenCards))}, ${escapeValue(pref.layoutStyle)}, ${pref.cardsPerRow}, ${pref.showSummaryCard}, ${pref.showMonthlyChart}, ${pref.showCategoryStats}, ${pref.showTopProducts}, ${pref.showMarketCompare}, ${pref.showRecentBuys}, ${pref.showExpirationAlerts}, ${pref.showReplenishment}, ${pref.showSavingsCard}, ${pref.showDiscountStats}, ${pref.showTemporalComp}, ${pref.showNutritionCard}, ${pref.showPaymentStats}, ${pref.showMonthlyStats}, ${escapeValue(pref.customTitle)}, ${escapeValue(pref.customSubtitle)}, ${escapeValue(JSON.stringify(pref.widgetLayouts))}, ${escapeNumber(pref.gridColumns)}, ${escapeValue(pref.createdAt)}, ${escapeValue(pref.updatedAt)}) ON CONFLICT (id) DO NOTHING;`
				)
			}
			sqlStatements.push("")
		}

		// 25. Backup de ChurrascoCalculation
		const churrascoCalcs = await prisma.churrascoCalculation.findMany()
		if (churrascoCalcs.length > 0) {
			sqlStatements.push("-- Churrasco Calculations")
			for (const calc of churrascoCalcs) {
				sqlStatements.push(
					`INSERT INTO churrasco_calculations (id, "userId", adults, children, drinkers, preferences, result, "createdAt") VALUES (${escapeValue(calc.id)}, ${escapeValue(calc.userId)}, ${calc.adults}, ${calc.children}, ${calc.drinkers}, ${escapeValue(calc.preferences)}, ${escapeValue(JSON.stringify(calc.result))}, ${escapeValue(calc.createdAt)}) ON CONFLICT (id) DO NOTHING;`
				)
			}
			sqlStatements.push("")
		}

		// 26. Backup de AssistantChatSession
		const assistantSessions = await prisma.assistantChatSession.findMany()
		if (assistantSessions.length > 0) {
			sqlStatements.push("-- Assistant Chat Sessions")
			for (const session of assistantSessions) {
				sqlStatements.push(
					`INSERT INTO "AssistantChatSession" (id, "userId", title, messages, "createdAt", "updatedAt") VALUES (${escapeValue(session.id)}, ${escapeValue(session.userId)}, ${escapeValue(session.title)}, ${escapeValue(JSON.stringify(session.messages))}, ${escapeValue(session.createdAt)}, ${escapeValue(session.updatedAt)}) ON CONFLICT (id) DO NOTHING;`
				)
			}
			sqlStatements.push("")
		}

		// 27. Backup de ProductKit
		const productKits = await prisma.productKit.findMany()
		if (productKits.length > 0) {
			sqlStatements.push("-- Product Kits")
			for (const kit of productKits) {
				sqlStatements.push(
					`INSERT INTO product_kits (id, "kitProductId", description, "isActive", barcode, "brandId", "categoryId", "createdAt", "updatedAt") VALUES (${escapeValue(kit.id)}, ${escapeValue(kit.kitProductId)}, ${escapeValue(kit.description)}, ${kit.isActive}, ${escapeValue(kit.barcode)}, ${escapeValue(kit.brandId)}, ${escapeValue(kit.categoryId)}, ${escapeValue(kit.createdAt)}, ${escapeValue(kit.updatedAt)}) ON CONFLICT (id) DO NOTHING;`
				)
			}
			sqlStatements.push("")
		}

		// 28. Backup de ProductKitItem
		const productKitItems = await prisma.productKitItem.findMany()
		if (productKitItems.length > 0) {
			sqlStatements.push("-- Product Kit Items")
			for (const item of productKitItems) {
				sqlStatements.push(
					`INSERT INTO product_kit_items (id, "kitId", "productId", quantity, "createdAt", "updatedAt") VALUES (${escapeValue(item.id)}, ${escapeValue(item.kitId)}, ${escapeValue(item.productId)}, ${item.quantity}, ${escapeValue(item.createdAt)}, ${escapeValue(item.updatedAt)}) ON CONFLICT (id) DO NOTHING;`
				)
			}
			sqlStatements.push("")
		}

		// 29. Backup de TwoFactorEmailCode
		const twoFactorEmailCodes = await prisma.twoFactorEmailCode.findMany()
		if (twoFactorEmailCodes.length > 0) {
			sqlStatements.push("-- Two Factor Email Codes")
			for (const code of twoFactorEmailCodes) {
				sqlStatements.push(
					`INSERT INTO "twoFactorEmailCode" (id, "userId", code, type, "expiresAt", "createdAt", used, "usedAt") VALUES (${escapeValue(code.id)}, ${escapeValue(code.userId)}, ${escapeValue(code.code)}, ${escapeValue(code.type)}, ${escapeValue(code.expiresAt)}, ${escapeValue(code.createdAt)}, ${code.used}, ${escapeValue(code.usedAt)}) ON CONFLICT (id) DO NOTHING;`
				)
			}
			sqlStatements.push("")
		}

		// 30. Backup de TrustedDevice
		const trustedDevices = await prisma.trustedDevice.findMany()
		if (trustedDevices.length > 0) {
			sqlStatements.push("-- Trusted Devices")
			for (const device of trustedDevices) {
				sqlStatements.push(
					`INSERT INTO "trustedDevice" (id, "userId", "userAgent", "ipAddress", "createdAt", "updatedAt") VALUES (${escapeValue(device.id)}, ${escapeValue(device.userId)}, ${escapeValue(device.userAgent)}, ${escapeValue(device.ipAddress)}, ${escapeValue(device.createdAt)}, ${escapeValue(device.updatedAt)}) ON CONFLICT (id) DO NOTHING;`
				)
			}
			sqlStatements.push("")
		}

		// 31. Backup de SecurityAudit
		const securityAudits = await prisma.securityAudit.findMany()
		if (securityAudits.length > 0) {
			sqlStatements.push("-- Security Audits")
			for (const audit of securityAudits) {
				sqlStatements.push(
					`INSERT INTO security_audit (id, "userId", "eventType", "ipAddress", "userAgent", location, metadata, "createdAt") VALUES (${escapeValue(audit.id)}, ${escapeValue(audit.userId)}, ${escapeValue(audit.eventType)}, ${escapeValue(audit.ipAddress)}, ${escapeValue(audit.userAgent)}, ${escapeValue(audit.location)}, ${escapeValue(JSON.stringify(audit.metadata))}, ${escapeValue(audit.createdAt)}) ON CONFLICT (id) DO NOTHING;`
				)
			}
			sqlStatements.push("")
		}

		// 32. Backup de SecurityNotification
		const securityNotifications = await prisma.securityNotification.findMany()
		if (securityNotifications.length > 0) {
			sqlStatements.push("-- Security Notifications")
			for (const notification of securityNotifications) {
				sqlStatements.push(
					`INSERT INTO security_notifications (id, "userId", type, title, message, "isRead", metadata, "createdAt") VALUES (${escapeValue(notification.id)}, ${escapeValue(notification.userId)}, ${escapeValue(notification.type)}, ${escapeValue(notification.title)}, ${escapeValue(notification.message)}, ${notification.isRead}, ${escapeValue(JSON.stringify(notification.metadata))}, ${escapeValue(notification.createdAt)}) ON CONFLICT (id) DO NOTHING;`
				)
			}
			sqlStatements.push("")
		}

		// 33. Backup de IpLocation
		const ipLocations = await prisma.ipLocation.findMany()
		if (ipLocations.length > 0) {
			sqlStatements.push("-- IP Locations")
			for (const ipLoc of ipLocations) {
				sqlStatements.push(
					`INSERT INTO ip_locations (ip, city, region, country, location, "createdAt", "expiresAt") VALUES (${escapeValue(ipLoc.ip)}, ${escapeValue(ipLoc.city)}, ${escapeValue(ipLoc.region)}, ${escapeValue(ipLoc.country)}, ${escapeValue(ipLoc.location)}, ${escapeValue(ipLoc.createdAt)}, ${escapeValue(ipLoc.expiresAt)}) ON CONFLICT (ip) DO NOTHING;`
				)
			}
			sqlStatements.push("")
		}

		// Footer do backup
		sqlStatements.push("COMMIT;")
		sqlStatements.push(`\n-- Backup completed at: ${new Date().toISOString()}`)

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

