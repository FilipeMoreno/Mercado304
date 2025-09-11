import { SchemaType } from "@google/generative-ai";

export const tools: any = [
	{
		functionDeclarations: [
			// Dashboard & Analytics
			{
				name: "getDashboardStats",
				description:
					"Obtém estatísticas gerais do dashboard, como total gasto, número de compras e produtos.",
				parameters: { type: SchemaType.OBJECT, properties: {} },
			},
			{
				name: "getSavingsAnalysis",
				description:
					"Analisa oportunidades de economia e comparações de preços.",
				parameters: { type: SchemaType.OBJECT, properties: {} },
			},

			// Products Management
			{
				name: "createProduct",
				description:
					"Cria um novo produto no sistema. Se a marca ou categoria não existir, irá informar e solicitar confirmação para criar.",
				parameters: {
					type: SchemaType.OBJECT,
					properties: {
						name: { type: SchemaType.STRING, description: "Nome do produto." },
						brandName: {
							type: SchemaType.STRING,
							description: "Nome da marca (opcional).",
						},
						categoryName: {
							type: SchemaType.STRING,
							description: "Nome da categoria (opcional).",
						},
						barcode: {
							type: SchemaType.STRING,
							description: "Código de barras (opcional).",
						},
						description: {
							type: SchemaType.STRING,
							description: "Descrição do produto (opcional).",
						},
					},
					required: ["name"],
				},
			},
			{
				name: "searchProducts",
				description: "Busca produtos no sistema por nome ou outros filtros.",
				parameters: {
					type: SchemaType.OBJECT,
					properties: {
						search: { type: SchemaType.STRING, description: "Termo de busca." },
						categoryId: {
							type: SchemaType.STRING,
							description: "Filtrar por categoria (opcional).",
						},
						brandId: {
							type: SchemaType.STRING,
							description: "Filtrar por marca (opcional).",
						},
					},
					required: ["search"],
				},
			},
			{
				name: "getProductPriceComparison",
				description:
					"Busca e compara o preço de um produto específico em diferentes mercados.",
				parameters: {
					type: SchemaType.OBJECT,
					properties: {
						productName: {
							type: SchemaType.STRING,
							description: "O nome do produto a ser comparado.",
						},
					},
					required: ["productName"],
				},
			},
			{
				name: "getHealthyAlternatives",
				description: "Busca alternativas mais saudáveis para um produto.",
				parameters: {
					type: SchemaType.OBJECT,
					properties: {
						productName: {
							type: SchemaType.STRING,
							description: "Nome do produto para buscar alternativas.",
						},
					},
					required: ["productName"],
				},
			},
			{
				name: "getBestDayToBuy",
				description:
					"Identifica o melhor dia da semana para comprar um produto com base no histórico de preços.",
				parameters: {
					type: SchemaType.OBJECT,
					properties: {
						productName: {
							type: SchemaType.STRING,
							description: "Nome do produto.",
						},
					},
					required: ["productName"],
				},
			},

			// Markets Management
			{
				name: "createMarket",
				description: "Cria um novo mercado no sistema.",
				parameters: {
					type: SchemaType.OBJECT,
					properties: {
						name: { type: SchemaType.STRING, description: "Nome do mercado." },
						address: {
							type: SchemaType.STRING,
							description: "Endereço do mercado (opcional).",
						},
						phone: {
							type: SchemaType.STRING,
							description: "Telefone do mercado (opcional).",
						},
					},
					required: ["name"],
				},
			},
			{
				name: "getMarkets",
				description: "Lista todos os mercados cadastrados.",
				parameters: { type: SchemaType.OBJECT, properties: {} },
			},
			{
				name: "getMarketStats",
				description: "Obtém estatísticas de um mercado específico.",
				parameters: {
					type: SchemaType.OBJECT,
					properties: {
						marketName: {
							type: SchemaType.STRING,
							description: "Nome do mercado.",
						},
					},
					required: ["marketName"],
				},
			},

			// Categories & Brands
			{
				name: "createCategory",
				description: "Cria uma nova categoria de produtos.",
				parameters: {
					type: SchemaType.OBJECT,
					properties: {
						name: {
							type: SchemaType.STRING,
							description: "Nome da categoria.",
						},
						icon: {
							type: SchemaType.STRING,
							description: "Ícone da categoria (opcional).",
						},
						color: {
							type: SchemaType.STRING,
							description: "Cor da categoria (opcional).",
						},
					},
					required: ["name"],
				},
			},
			{
				name: "createBrand",
				description: "Cria uma nova marca no sistema.",
				parameters: {
					type: SchemaType.OBJECT,
					properties: {
						name: { type: SchemaType.STRING, description: "Nome da marca." },
					},
					required: ["name"],
				},
			},
			{
				name: "createProductWithBrandAndCategory",
				description:
					"Cria um produto junto com sua marca e/ou categoria se elas não existirem.",
				parameters: {
					type: SchemaType.OBJECT,
					properties: {
						productName: {
							type: SchemaType.STRING,
							description: "Nome do produto.",
						},
						brandName: {
							type: SchemaType.STRING,
							description: "Nome da marca (opcional).",
						},
						categoryName: {
							type: SchemaType.STRING,
							description: "Nome da categoria (opcional).",
						},
						barcode: {
							type: SchemaType.STRING,
							description: "Código de barras (opcional).",
						},
						description: {
							type: SchemaType.STRING,
							description: "Descrição do produto (opcional).",
						},
					},
					required: ["productName"],
				},
			},
			{
				name: "getCategories",
				description: "Lista todas as categorias disponíveis.",
				parameters: { type: SchemaType.OBJECT, properties: {} },
			},
			{
				name: "getBrands",
				description: "Lista todas as marcas disponíveis.",
				parameters: { type: SchemaType.OBJECT, properties: {} },
			},

			// Shopping Lists Management
			{
				name: "createShoppingList",
				description:
					"Cria uma nova lista de compras com um nome e uma lista de itens.",
				parameters: {
					type: SchemaType.OBJECT,
					properties: {
						listName: {
							type: SchemaType.STRING,
							description: "O nome da nova lista de compras.",
						},
						items: {
							type: SchemaType.ARRAY,
							items: { type: SchemaType.STRING },
							description:
								"Os nomes dos produtos a adicionar à lista. Pode ser vazio para criar lista sem itens.",
						},
					},
					required: ["listName"],
				},
			},
			{
				name: "getShoppingLists",
				description: "Lista todas as listas de compras.",
				parameters: { type: SchemaType.OBJECT, properties: {} },
			},
			{
				name: "addItemToShoppingList",
				description: "Adiciona itens a uma lista de compras existente.",
				parameters: {
					type: SchemaType.OBJECT,
					properties: {
						listName: {
							type: SchemaType.STRING,
							description: "Nome da lista de compras.",
						},
						items: {
							type: SchemaType.ARRAY,
							items: { type: SchemaType.STRING },
							description: "Nomes dos produtos a adicionar.",
						},
					},
					required: ["listName", "items"],
				},
			},
			{
				name: "generateAutoShoppingList",
				description:
					"Gera automaticamente uma lista de compras baseada em padrões de consumo.",
				parameters: { type: SchemaType.OBJECT, properties: {} },
			},

			// Purchases Management
			{
				name: "createPurchase",
				description: "Registra uma nova compra.",
				parameters: {
					type: SchemaType.OBJECT,
					properties: {
						marketName: {
							type: SchemaType.STRING,
							description: "Nome do mercado onde foi feita a compra.",
						},
						items: {
							type: SchemaType.ARRAY,
							items: {
								type: SchemaType.OBJECT,
								properties: {
									productName: {
										type: SchemaType.STRING,
										description: "Nome do produto.",
									},
									quantity: {
										type: SchemaType.NUMBER,
										description: "Quantidade comprada.",
									},
									unitPrice: {
										type: SchemaType.NUMBER,
										description: "Preço unitário.",
									},
								},
							},
							description: "Lista de itens comprados.",
						},
					},
					required: ["marketName", "items"],
				},
			},
			{
				name: "getPurchases",
				description: "Lista o histórico de compras.",
				parameters: {
					type: SchemaType.OBJECT,
					properties: {
						marketName: {
							type: SchemaType.STRING,
							description: "Filtrar por mercado (opcional).",
						},
						limit: {
							type: SchemaType.NUMBER,
							description: "Limite de resultados (opcional).",
						},
					},
				},
			},

			// Stock Management
			{
				name: "getStockAlerts",
				description:
					"Verifica o estoque e retorna alertas de produtos vencendo ou com quantidade baixa.",
				parameters: { type: SchemaType.OBJECT, properties: {} },
			},
			{
				name: "addToStock",
				description: "Adiciona produtos ao estoque.",
				parameters: {
					type: SchemaType.OBJECT,
					properties: {
						productName: {
							type: SchemaType.STRING,
							description: "Nome do produto.",
						},
						quantity: {
							type: SchemaType.NUMBER,
							description: "Quantidade a adicionar.",
						},
						expirationDate: {
							type: SchemaType.STRING,
							description: "Data de vencimento (YYYY-MM-DD, opcional).",
						},
						location: {
							type: SchemaType.STRING,
							description: "Local de armazenamento (opcional).",
						},
					},
					required: ["productName", "quantity"],
				},
			},
			{
				name: "removeFromStock",
				description: "Remove produtos do estoque.",
				parameters: {
					type: SchemaType.OBJECT,
					properties: {
						productName: {
							type: SchemaType.STRING,
							description: "Nome do produto.",
						},
						quantity: {
							type: SchemaType.NUMBER,
							description: "Quantidade a remover.",
						},
						reason: {
							type: SchemaType.STRING,
							description:
								"Motivo da remoção (consumo, perda, vencimento, etc.).",
						},
					},
					required: ["productName", "quantity"],
				},
			},
			{
				name: "getStockItems",
				description: "Lista todos os itens em estoque.",
				parameters: {
					type: SchemaType.OBJECT,
					properties: {
						lowStock: {
							type: SchemaType.BOOLEAN,
							description: "Mostrar apenas itens com estoque baixo.",
						},
						expiringSoon: {
							type: SchemaType.BOOLEAN,
							description: "Mostrar apenas itens vencendo em breve.",
						},
					},
				},
			},
			{
				name: "getWasteStats",
				description: "Obtém estatísticas de desperdício de alimentos.",
				parameters: { type: SchemaType.OBJECT, properties: {} },
			},
			{
				name: "getStockHistory",
				description: "Obtém histórico geral de movimentações do estoque com filtros avançados e estatísticas.",
				parameters: {
					type: SchemaType.OBJECT,
					properties: {
						search: { 
							type: SchemaType.STRING, 
							description: "Termo de busca para produto, motivo ou observações (opcional)." 
						},
						type: { 
							type: SchemaType.STRING, 
							description: "Filtrar por tipo de movimentação: ENTRADA, SAIDA, AJUSTE, VENCIMENTO, PERDA, DESPERDICIO (opcional)." 
						},
						location: { 
							type: SchemaType.STRING, 
							description: "Filtrar por localização (opcional)." 
						},
						startDate: { 
							type: SchemaType.STRING, 
							description: "Data inicial no formato YYYY-MM-DD (opcional)." 
						},
						endDate: { 
							type: SchemaType.STRING, 
							description: "Data final no formato YYYY-MM-DD (opcional)." 
						},
						limit: { 
							type: SchemaType.NUMBER, 
							description: "Limite de resultados (opcional, padrão 50)." 
						}
					}
				},
			},
			{
				name: "getWasteRecords",
				description: "Lista registros de desperdício com filtros avançados e estatísticas detalhadas da nova API dedicada.",
				parameters: {
					type: SchemaType.OBJECT,
					properties: {
						search: { 
							type: SchemaType.STRING, 
							description: "Buscar por nome do produto (opcional)." 
						},
						reason: { 
							type: SchemaType.STRING, 
							description: "Filtrar por motivo: EXPIRED, SPOILED, DAMAGED, CONTAMINATED, EXCESS, FREEZER_BURN, MOLDY, PEST_DAMAGE, POWER_OUTAGE, FORGOTTEN, OTHER (opcional)." 
						},
						startDate: { 
							type: SchemaType.STRING, 
							description: "Data inicial no formato YYYY-MM-DD (opcional)." 
						},
						endDate: { 
							type: SchemaType.STRING, 
							description: "Data final no formato YYYY-MM-DD (opcional)." 
						},
						limit: { 
							type: SchemaType.NUMBER, 
							description: "Limite de resultados (opcional, padrão 10)." 
						}
					}
				},
			},
			{
				name: "createWasteRecord",
				description: "Registra um novo desperdício de produto com rastreamento detalhado na nova API dedicada.",
				parameters: {
					type: SchemaType.OBJECT,
					properties: {
						productName: { 
							type: SchemaType.STRING, 
							description: "Nome do produto desperdiçado." 
						},
						quantity: { 
							type: SchemaType.NUMBER, 
							description: "Quantidade desperdiçada." 
						},
						unit: { 
							type: SchemaType.STRING, 
							description: "Unidade de medida (kg, litros, unidades, etc.)." 
						},
						wasteReason: { 
							type: SchemaType.STRING, 
							description: "Motivo do desperdício: EXPIRED, SPOILED, DAMAGED, CONTAMINATED, EXCESS, FREEZER_BURN, MOLDY, PEST_DAMAGE, POWER_OUTAGE, FORGOTTEN, OTHER." 
						},
						location: { 
							type: SchemaType.STRING, 
							description: "Local onde ocorreu o desperdício (opcional)." 
						},
						unitCost: { 
							type: SchemaType.NUMBER, 
							description: "Custo unitário (opcional)." 
						},
						totalValue: { 
							type: SchemaType.NUMBER, 
							description: "Valor total do desperdício (opcional)." 
						},
						notes: { 
							type: SchemaType.STRING, 
							description: "Observações adicionais (opcional)." 
						},
						category: { 
							type: SchemaType.STRING, 
							description: "Categoria do produto (opcional)." 
						},
						brand: { 
							type: SchemaType.STRING, 
							description: "Marca do produto (opcional)." 
						}
					},
					required: ["productName", "quantity", "unit", "wasteReason"]
				},
			},

			// Recipes & AI Features
			{
				name: "suggestRecipes",
				description:
					"Sugere receitas baseadas nos ingredientes disponíveis no estoque.",
				parameters: {
					type: SchemaType.OBJECT,
					properties: {
						ingredients: {
							type: SchemaType.ARRAY,
							items: { type: SchemaType.STRING },
							description: "Lista de ingredientes disponíveis (opcional).",
						},
						mealType: {
							type: SchemaType.STRING,
							description:
								"Tipo de refeição (café da manhã, almoço, jantar, lanche, opcional).",
						},
					},
				},
			},
			{
				name: "getRecipes",
				description: "Lista receitas salvas.",
				parameters: { type: SchemaType.OBJECT, properties: {} },
			},
			{
				name: "analyzeNutrition",
				description:
					"Analisa informações nutricionais de um produto ou lista de produtos.",
				parameters: {
					type: SchemaType.OBJECT,
					properties: {
						productNames: {
							type: SchemaType.ARRAY,
							items: { type: SchemaType.STRING },
							description: "Lista de produtos para análise nutricional.",
						},
					},
					required: ["productNames"],
				},
			},

			// Analytics & Predictions
			{
				name: "getConsumptionPatterns",
				description: "Analisa padrões de consumo dos produtos.",
				parameters: { type: SchemaType.OBJECT, properties: {} },
			},
			{
				name: "getPriceHistory",
				description: "Obtém histórico de preços de um produto.",
				parameters: {
					type: SchemaType.OBJECT,
					properties: {
						productName: {
							type: SchemaType.STRING,
							description: "Nome do produto.",
						},
						days: {
							type: SchemaType.NUMBER,
							description: "Número de dias para análise (opcional, padrão 30).",
						},
					},
					required: ["productName"],
				},
			},
			{
				name: "checkBestPrice",
				description:
					"Verifica o melhor preço atual de um produto entre os mercados.",
				parameters: {
					type: SchemaType.OBJECT,
					properties: {
						productName: {
							type: SchemaType.STRING,
							description: "Nome do produto.",
						},
					},
					required: ["productName"],
				},
			},

			// Sistema de Seleção com Cards
			{
				name: "findSimilarProducts",
				description:
					"Busca produtos com nomes similares para exibir cards de seleção.",
				parameters: {
					type: SchemaType.OBJECT,
					properties: {
						searchTerm: {
							type: SchemaType.STRING,
							description: "Termo de busca para produtos similares.",
						},
						context: {
							type: SchemaType.STRING,
							description:
								"Contexto da operação (ex: addToList:NomeDaLista, comparePrice, etc.)",
						},
					},
					required: ["searchTerm"],
				},
			},
			{
				name: "findSimilarMarkets",
				description:
					"Busca mercados com nomes similares para exibir cards de seleção.",
				parameters: {
					type: SchemaType.OBJECT,
					properties: {
						searchTerm: {
							type: SchemaType.STRING,
							description: "Termo de busca para mercados similares.",
						},
					},
					required: ["searchTerm"],
				},
			},
			{
				name: "findSimilarCategories",
				description:
					"Busca categorias com nomes similares para exibir cards de seleção.",
				parameters: {
					type: SchemaType.OBJECT,
					properties: {
						searchTerm: {
							type: SchemaType.STRING,
							description: "Termo de busca para categorias similares.",
						},
					},
					required: ["searchTerm"],
				},
			},
			{
				name: "findSimilarBrands",
				description:
					"Busca marcas com nomes similares para exibir cards de seleção.",
				parameters: {
					type: SchemaType.OBJECT,
					properties: {
						searchTerm: {
							type: SchemaType.STRING,
							description: "Termo de busca para marcas similares.",
						},
					},
					required: ["searchTerm"],
				},
			},
			{
				name: "findSimilarShoppingLists",
				description:
					"Busca listas de compras com nomes similares para exibir cards de seleção.",
				parameters: {
					type: SchemaType.OBJECT,
					properties: {
						searchTerm: {
							type: SchemaType.STRING,
							description: "Termo de busca para listas similares.",
						},
					},
					required: ["searchTerm"],
				},
			},

			// Price Recording System
			{
				name: "recordPrice",
				description:
					"Registra o preço de um produto em um mercado específico sem registrar compra. Útil para acompanhar preços de produtos que você viu mas não comprou.",
				parameters: {
					type: SchemaType.OBJECT,
					properties: {
						productName: {
							type: SchemaType.STRING,
							description: "Nome do produto.",
						},
						marketName: {
							type: SchemaType.STRING,
							description: "Nome do mercado onde foi visto o preço.",
						},
						price: {
							type: SchemaType.NUMBER,
							description: "Preço do produto.",
						},
						notes: {
							type: SchemaType.STRING,
							description: "Observações sobre o preço (opcional).",
						},
					},
					required: ["productName", "marketName", "price"],
				},
			},
			{
				name: "getPriceRecords",
				description:
					"Lista histórico de preços registrados por produto ou mercado.",
				parameters: {
					type: SchemaType.OBJECT,
					properties: {
						productName: {
							type: SchemaType.STRING,
							description: "Filtrar por produto (opcional).",
						},
						marketName: {
							type: SchemaType.STRING,
							description: "Filtrar por mercado (opcional).",
						},
						limit: {
							type: SchemaType.NUMBER,
							description: "Limite de resultados (opcional, padrão 20).",
						},
					},
				},
			},
			{
				name: "promptChurrascoCalculator",
				description:
					"Quando o usuário expressa a intenção de calcular um churrasco, mas não fornece os números de adultos, crianças e bebedores, esta função é chamada para exibir um formulário interativo no chat.",
				parameters: { type: SchemaType.OBJECT, properties: {} },
			},
			{
				name: "calculateChurrasco",
				description:
					"Calcula as quantidades de comida e bebida para um churrasco com base no número de pessoas.",
				parameters: {
					type: SchemaType.OBJECT,
					properties: {
						adults: {
							type: SchemaType.NUMBER,
							description: "Número de adultos.",
						},
						children: {
							type: SchemaType.NUMBER,
							description: "Número de crianças.",
						},
						drinkers: {
							type: SchemaType.NUMBER,
							description: "Número de adultos que consomem bebidas alcoólicas.",
						},
						preferences: {
							type: SchemaType.STRING,
							description:
								'Preferências ou observações (ex: "mais picanha", "vegetariano").',
						},
					},
					required: ["adults", "children", "drinkers"],
				},
			},
		],
	},
];