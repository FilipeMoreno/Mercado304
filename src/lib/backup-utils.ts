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
					`INSERT INTO "StockHistory" (id, type, quantity, "productName", category, notes, "createdAt") VALUES (${escapeValue(history.id)}, ${escapeValue(history.type)}, ${history.quantity}, ${escapeValue(history.productName)}, ${escapeValue(history.category)}, ${escapeValue(history.notes)}, ${escapeValue(history.createdAt)}) ON CONFLICT (id) DO NOTHING;`
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
					`INSERT INTO "StockMovement" (id, "stockItemId", type, quantity, notes, "createdAt") VALUES (${escapeValue(movement.id)}, ${escapeValue(movement.stockItemId)}, ${escapeValue(movement.type)}, ${movement.quantity}, ${escapeValue(movement.notes)}, ${escapeValue(movement.createdAt)}) ON CONFLICT (id) DO NOTHING;`
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
					`INSERT INTO "WasteRecord" (id, "productId", "productName", category, quantity, unit, "estimatedCost", reason, "reasonDetails", location, "userId", "createdAt", "updatedAt") VALUES (${escapeValue(waste.id)}, ${escapeValue(waste.productId)}, ${escapeValue(waste.productName)}, ${escapeValue(waste.category)}, ${waste.quantity}, ${escapeValue(waste.unit)}, ${escapeNumber(waste.estimatedCost)}, ${escapeValue(waste.reason)}, ${escapeValue(waste.reasonDetails)}, ${escapeValue(waste.location)}, ${escapeValue(waste.userId)}, ${escapeValue(waste.createdAt)}, ${escapeValue(waste.updatedAt)}) ON CONFLICT (id) DO NOTHING;`
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
					`INSERT INTO "ExpirationAlert" (id, "stockItemId", "productId", "alertType", "expirationDate", "isRead", "createdAt") VALUES (${escapeValue(alert.id)}, ${escapeValue(alert.stockItemId)}, ${escapeValue(alert.productId)}, ${escapeValue(alert.alertType)}, ${escapeValue(alert.expirationDate)}, ${alert.isRead}, ${escapeValue(alert.createdAt)}) ON CONFLICT (id) DO NOTHING;`
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
					`INSERT INTO "NutritionalInfo" (id, "productId", "servingSize", calories, protein, carbohydrates, "totalFat", "saturatedFat", "transFat", fiber, sodium, sugars, allergens, ingredients, "createdAt", "updatedAt") VALUES (${escapeValue(info.id)}, ${escapeValue(info.productId)}, ${escapeValue(info.servingSize)}, ${escapeNumber(info.calories)}, ${escapeNumber(info.protein)}, ${escapeNumber(info.carbohydrates)}, ${escapeNumber(info.totalFat)}, ${escapeNumber(info.saturatedFat)}, ${escapeNumber(info.transFat)}, ${escapeNumber(info.fiber)}, ${escapeNumber(info.sodium)}, ${escapeNumber(info.sugars)}, ${escapeValue(info.allergens)}, ${escapeValue(info.ingredients)}, ${escapeValue(info.createdAt)}, ${escapeValue(info.updatedAt)}) ON CONFLICT (id) DO NOTHING;`
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
					`INSERT INTO "Recipe" (id, name, description, ingredients, instructions, "prepTime", "cookTime", servings, difficulty, rating, "isCooked", "cookedAt", "createdAt", "updatedAt") VALUES (${escapeValue(recipe.id)}, ${escapeValue(recipe.name)}, ${escapeValue(recipe.description)}, ${escapeValue(recipe.ingredients)}, ${escapeValue(recipe.instructions)}, ${escapeNumber(recipe.prepTime)}, ${escapeNumber(recipe.cookTime)}, ${escapeNumber(recipe.servings)}, ${escapeValue(recipe.difficulty)}, ${escapeNumber(recipe.rating)}, ${recipe.isCooked}, ${escapeValue(recipe.cookedAt)}, ${escapeValue(recipe.createdAt)}, ${escapeValue(recipe.updatedAt)}) ON CONFLICT (id) DO NOTHING;`
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
					`INSERT INTO "SyncJob" (id, status, "startedAt", "completedAt", "totalProducts", "syncedProducts", "failedProducts", error, "createdAt", "updatedAt") VALUES (${escapeValue(job.id)}, ${escapeValue(job.status)}, ${escapeValue(job.startedAt)}, ${escapeValue(job.completedAt)}, ${escapeNumber(job.totalProducts)}, ${escapeNumber(job.syncedProducts)}, ${escapeNumber(job.failedProducts)}, ${escapeValue(job.error)}, ${escapeValue(job.createdAt)}, ${escapeValue(job.updatedAt)}) ON CONFLICT (id) DO NOTHING;`
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
					`INSERT INTO session (id, "expiresAt", token, "ipAddress", "userAgent", "userId", "impersonatedBy", "activeOrganizationId", "createdAt", "updatedAt") VALUES (${escapeValue(session.id)}, ${escapeValue(session.expiresAt)}, ${escapeValue(session.token)}, ${escapeValue(session.ipAddress)}, ${escapeValue(session.userAgent)}, ${escapeValue(session.userId)}, ${escapeValue(session.impersonatedBy)}, ${escapeValue(session.activeOrganizationId)}, ${escapeValue(session.createdAt)}, ${escapeValue(session.updatedAt)}) ON CONFLICT (id) DO NOTHING;`
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
					`INSERT INTO passkey (id, name, "publicKey", "userId", "webauthnUserID", counter, "deviceType", backed_up, transports, "createdAt") VALUES (${escapeValue(passkey.id)}, ${escapeValue(passkey.name)}, ${escapeValue(passkey.publicKey)}, ${escapeValue(passkey.userId)}, ${escapeValue(passkey.webauthnUserID)}, ${passkey.counter}, ${escapeValue(passkey.deviceType)}, ${passkey.backed_up}, ${escapeValue(passkey.transports)}, ${escapeValue(passkey.createdAt)}) ON CONFLICT (id) DO NOTHING;`
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
					`INSERT INTO "twoFactor" (id, secret, "backupCodes", "userId", "createdAt", "updatedAt") VALUES (${escapeValue(tf.id)}, ${escapeValue(tf.secret)}, ${escapeValue(tf.backupCodes)}, ${escapeValue(tf.userId)}, ${escapeValue(tf.createdAt)}, ${escapeValue(tf.updatedAt)}) ON CONFLICT (id) DO NOTHING;`
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
					`INSERT INTO "ChurrascoCalculation" (id, "userId", adults, children, drinkers, preferences, result, "createdAt", "updatedAt") VALUES (${escapeValue(calc.id)}, ${escapeValue(calc.userId)}, ${calc.adults}, ${calc.children}, ${calc.drinkers}, ${escapeValue(calc.preferences)}, ${escapeValue(JSON.stringify(calc.result))}, ${escapeValue(calc.createdAt)}, ${escapeValue(calc.updatedAt)}) ON CONFLICT (id) DO NOTHING;`
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
					`INSERT INTO "ProductKit" ("productId", description, "categoryId", "brandId", "createdAt", "updatedAt") VALUES (${escapeValue(kit.productId)}, ${escapeValue(kit.description)}, ${escapeValue(kit.categoryId)}, ${escapeValue(kit.brandId)}, ${escapeValue(kit.createdAt)}, ${escapeValue(kit.updatedAt)}) ON CONFLICT ("productId") DO NOTHING;`
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
					`INSERT INTO "ProductKitItem" (id, "kitProductId", "itemProductId", quantity, "createdAt", "updatedAt") VALUES (${escapeValue(item.id)}, ${escapeValue(item.kitProductId)}, ${escapeValue(item.itemProductId)}, ${item.quantity}, ${escapeValue(item.createdAt)}, ${escapeValue(item.updatedAt)}) ON CONFLICT (id) DO NOTHING;`
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
					`INSERT INTO "twoFactorEmailCode" (id, code, "userId", "expiresAt", "createdAt", "updatedAt") VALUES (${escapeValue(code.id)}, ${escapeValue(code.code)}, ${escapeValue(code.userId)}, ${escapeValue(code.expiresAt)}, ${escapeValue(code.createdAt)}, ${escapeValue(code.updatedAt)}) ON CONFLICT (id) DO NOTHING;`
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
					`INSERT INTO "trustedDevice" (id, "userId", "deviceId", "deviceName", "deviceType", "ipAddress", "lastUsedAt", "expiresAt", "createdAt", "updatedAt") VALUES (${escapeValue(device.id)}, ${escapeValue(device.userId)}, ${escapeValue(device.deviceId)}, ${escapeValue(device.deviceName)}, ${escapeValue(device.deviceType)}, ${escapeValue(device.ipAddress)}, ${escapeValue(device.lastUsedAt)}, ${escapeValue(device.expiresAt)}, ${escapeValue(device.createdAt)}, ${escapeValue(device.updatedAt)}) ON CONFLICT (id) DO NOTHING;`
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

