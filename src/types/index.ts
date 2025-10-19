export interface Market {
	id: string
	name: string
	legalName?: string // Nome de registro/razão social
	location?: string
	createdAt: Date
	updatedAt: Date
}

export interface Brand {
	id: string
	name: string
	createdAt: Date
	updatedAt: Date
	_count?: {
		products: number
	}
}

export interface Category {
	id: string
	name: string
	icon?: string
	color?: string
	isFood?: boolean
	createdAt: Date
	updatedAt: Date
}

export interface Product {
	id: string
	name: string
	barcode?: string
	categoryId?: string
	brandId?: string
	unit: string
	packageSize?: string // Peso/Volume do produto (ex: "2L", "500g", "1kg")
	// Controle de estoque
	hasStock?: boolean
	minStock?: number
	maxStock?: number
	// Controle de validade
	hasExpiration?: boolean
	defaultShelfLifeDays?: number
	createdAt: Date
	updatedAt: Date
	category?: Category
	brand?: Brand
	nutritionalInfo?: NutritionalInfo
}

export interface Purchase {
	id: string
	marketId: string
	totalAmount: number
	totalDiscount?: number
	finalAmount: number
	purchaseDate: Date
	paymentMethod: PaymentMethod
	createdAt: Date
	updatedAt: Date
	market?: Market
	items?: PurchaseItem[]
}

export interface RecentPurchase {
	id: string
	marketId: string
	totalAmount: number
	totalDiscount?: number
	finalAmount: number
	purchaseDate: Date
	paymentMethod: PaymentMethod
	createdAt: Date
	updatedAt: Date
	market?: {
		id: string
		name: string
		location?: string
	}
	items?: PurchaseItem[]
}

export enum PaymentMethod {
	MONEY = "MONEY", // Dinheiro
	DEBIT = "DEBIT", // Cartão de Débito
	CREDIT = "CREDIT", // Cartão de Crédito
	PIX = "PIX", // PIX
	VOUCHER = "VOUCHER", // Vale Alimentação/Refeição
	CHECK = "CHECK", // Cheque
	OTHER = "OTHER", // Outros
}

export interface PurchaseItem {
	id: string
	purchaseId: string
	productId?: string
	quantity: number
	unitPrice: number
	unitDiscount?: number
	totalPrice: number
	totalDiscount?: number
	finalPrice: number
	productName?: string
	productUnit?: string
	productCategory?: string
	brandName?: string
	createdAt: Date
	product?: Product
}

export interface ShoppingList {
	id: string
	name: string
	isActive: boolean
	createdAt: Date
	updatedAt: Date
	items?: ShoppingListItem[]
}

export interface ShoppingListItem {
	id: string
	listId: string
	productId: string
	quantity: number
	isChecked: boolean
	createdAt: Date
	product?: Product
}

export interface MarketStats {
	marketId: string
	marketName: string
	totalPurchases: number
	totalSpent: number
	averagePrice: number
}

export interface ProductStats {
	productId: string
	productName: string
	totalPurchases: number
	totalQuantity: number
	averagePrice: number
	lastPurchaseDate: Date
}

export interface CategoryStats {
	categoryId: string
	categoryName: string
	icon: string
	color: string
	totalSpent: number
	totalPurchases: number
	totalQuantity: number
	averagePrice: number
}

export interface DiscountStats {
	totalDiscounts: number
	totalPurchases: number
	purchasesWithDiscounts: number
	averageDiscount: number
	discountPercentage: number
	monthlyDiscounts: Array<{ month: string; totalDiscounts: number }>
	topDiscountMarkets: Array<{
		marketId: string
		marketName: string
		totalDiscounts: number
		purchasesWithDiscounts: number
	}>
}

export interface TopProduct {
	productId: string
	productName: string
	unit: string
	totalPurchases: number
	totalQuantity: number
	averagePrice: number
}

export interface MarketComparison {
	marketId: string
	marketName: string
	totalPurchases: number
	averagePrice: number
}

export interface NutritionalInfo {
	id: string
	productId: string
	// Informações da Tabela Nutricional Obrigatórias
	servingSize?: string
	servingsPerPackage?: number
	calories?: number
	proteins?: number
	totalFat?: number
	saturatedFat?: number
	transFat?: number
	carbohydrates?: number
	totalSugars?: number
	addedSugars?: number
	lactose?: number
	galactose?: number
	fiber?: number
	sodium?: number
	// Vitaminas (valores opcionais)
	vitaminA?: number
	vitaminC?: number
	vitaminD?: number
	vitaminE?: number
	vitaminK?: number
	thiamine?: number
	riboflavin?: number
	niacin?: number
	vitaminB6?: number
	folate?: number
	vitaminB12?: number
	biotin?: number
	pantothenicAcid?: number
	// Outros nutrientes (valores opcionais)
	taurine?: number
	caffeine?: number
	alcoholContent?: number // Teor alcoólico em % (para bebidas alcoólicas)
	// Ácidos graxos e gorduras especiais (valores opcionais)
	omega3?: number // Ômega 3 em mg
	omega6?: number // Ômega 6 em g
	monounsaturatedFat?: number // Gordura monoinsaturada em g
	polyunsaturatedFat?: number // Gordura poli-insaturada em g
	cholesterol?: number // Colesterol em mg
	epa?: number // EPA em mg
	dha?: number // DHA em mg
	linolenicAcid?: number // Ácido linolênico em mg
	// Minerais (valores opcionais)
	calcium?: number
	iron?: number
	magnesium?: number
	phosphorus?: number
	potassium?: number
	zinc?: number
	copper?: number
	manganese?: number
	selenium?: number
	iodine?: number
	chromium?: number
	molybdenum?: number
	// Informações de Alérgenos
	allergensContains: string[]
	allergensMayContain: string[]
	createdAt: Date
	updatedAt: Date
}

// Enums
export enum StockMovementType {
	ENTRADA = "ENTRADA", // Adicionar ao estoque (compra)
	SAIDA = "SAIDA", // Remover do estoque (consumo)
	AJUSTE = "AJUSTE", // Ajuste manual
	VENCIMENTO = "VENCIMENTO", // Produto vencido
	PERDA = "PERDA", // Produto perdido/danificado
	DESPERDICIO = "DESPERDICIO", // Produto jogado fora
}

export enum WasteReason {
	EXPIRED = "EXPIRED", // Produto vencido
	SPOILED = "SPOILED", // Produto estragado/azedou
	DAMAGED = "DAMAGED", // Produto danificado
	CONTAMINATED = "CONTAMINATED", // Produto contaminado
	EXCESS = "EXCESS", // Produto em excesso/sobra
	FREEZER_BURN = "FREEZER_BURN", // Queimadura do freezer
	MOLDY = "MOLDY", // Produto com mofo
	PEST_DAMAGE = "PEST_DAMAGE", // Danificado por pragas
	POWER_OUTAGE = "POWER_OUTAGE", // Perda por falta de energia
	FORGOTTEN = "FORGOTTEN", // Produto esquecido
	OTHER = "OTHER", // Outros motivos
}

// Interfaces para o novo sistema
export interface WasteRecord {
	id: string
	productId?: string
	productName: string
	quantity: number
	unit: string
	wasteReason: WasteReason
	wasteDate: Date
	expirationDate?: Date
	location?: string
	unitCost?: number
	totalValue?: number
	notes?: string
	stockItemId?: string
	userId?: string
	category?: string
	brand?: string
	batchNumber?: string
	createdAt: Date
	updatedAt: Date
}

export interface StockHistory {
	id: string
	type: StockMovementType
	productId?: string
	productName?: string
	quantity: number
	reason?: string
	date: Date
	notes?: string
	location?: string
	unitCost?: number
	totalValue?: number
	purchaseItemId?: string
	userId?: string
	createdAt: Date
	updatedAt: Date
}

export interface StockItem {
	id: string
	productId: string
	quantity: number
	expirationDate?: Date
	batchNumber?: string
	location?: string
	unitCost?: number
	addedDate: Date
	lastUpdated: Date
	notes?: string
	isExpired: boolean
	isLowStock: boolean
	product?: Product
}

// Nota Paraná API Types
export interface NotaParanaCategoria {
	id: number
	qtd: number
	desc: string
}

export interface NotaParanaCategoriaResponse {
	local: string
	tempo: number
	termo: string
	regiao: string
	categorias: NotaParanaCategoria[]
}

export interface NotaParanaEstabelecimento {
	codigo: string
	nm_fan: string
	nm_emp: string
	tp_logr: string
	nm_logr: string
	nr_logr: string
	complemento: string
	bairro: string
	mun: string
	uf: string
	mesoreg: string
	microreg: string
}

export interface NotaParanaProduto {
	id: string
	local: string
	desc: string
	ncm: string
	cdanp: string
	valor_desconto: string
	valor_tabela: string
	valor: string
	datahora: string
	tempo: string
	distkm: string
	gtin: string
	nrdoc: string
	estabelecimento: NotaParanaEstabelecimento
}

export interface NotaParanaProdutosResponse {
	tempo: number
	local: string
	produtos: NotaParanaProduto[]
	total: number
	precos: {
		min: string
		max: string
	}
}