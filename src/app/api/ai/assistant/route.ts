import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api-utils';

// Função de retry com backoff exponencial
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Se é o último attempt, joga o erro
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Verifica se é um erro que vale a pena tentar novamente
      const errorMessage = lastError.message.toLowerCase();
      const retryableErrors = [
        'overloaded',
        'service unavailable',
        'rate limit',
        'timeout',
        'temporary failure',
        '503',
        '429',
        '500',
        '502',
        '504'
      ];
      
      const shouldRetry = retryableErrors.some(errorType => errorMessage.includes(errorType));
      
      if (!shouldRetry) {
        throw lastError;
      }
      
      // Calcula delay com backoff exponencial + jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      console.log(`Tentativa ${attempt + 1} falhou, tentando novamente em ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");


const tools: any = [
  {
    functionDeclarations: [
      // Dashboard & Analytics
      {
        name: 'getDashboardStats',
        description: 'Obtém estatísticas gerais do dashboard, como total gasto, número de compras e produtos.',
        parameters: { type: SchemaType.OBJECT, properties: {} }
      },
      {
        name: 'getSavingsAnalysis',
        description: 'Analisa oportunidades de economia e comparações de preços.',
        parameters: { type: SchemaType.OBJECT, properties: {} }
      },
      
      // Products Management
      {
        name: 'createProduct',
        description: 'Cria um novo produto no sistema. Se a marca ou categoria não existir, irá informar e solicitar confirmação para criar.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            name: { type: SchemaType.STRING, description: 'Nome do produto.' },
            brandName: { type: SchemaType.STRING, description: 'Nome da marca (opcional).' },
            categoryName: { type: SchemaType.STRING, description: 'Nome da categoria (opcional).' },
            barcode: { type: SchemaType.STRING, description: 'Código de barras (opcional).' },
            description: { type: SchemaType.STRING, description: 'Descrição do produto (opcional).' }
          },
          required: ['name']
        }
      },
      {
        name: 'searchProducts',
        description: 'Busca produtos no sistema por nome ou outros filtros.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            search: { type: SchemaType.STRING, description: 'Termo de busca.' },
            categoryId: { type: SchemaType.STRING, description: 'Filtrar por categoria (opcional).' },
            brandId: { type: SchemaType.STRING, description: 'Filtrar por marca (opcional).' }
          },
          required: ['search']
        }
      },
      {
        name: 'getProductPriceComparison',
        description: 'Busca e compara o preço de um produto específico em diferentes mercados.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            productName: { type: SchemaType.STRING, description: 'O nome do produto a ser comparado.' }
          },
          required: ['productName']
        }
      },
      {
        name: 'getHealthyAlternatives',
        description: 'Busca alternativas mais saudáveis para um produto.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            productName: { type: SchemaType.STRING, description: 'Nome do produto para buscar alternativas.' }
          },
          required: ['productName']
        }
      },
      {
        name: 'getBestDayToBuy',
        description: 'Identifica o melhor dia da semana para comprar um produto com base no histórico de preços.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            productName: { type: SchemaType.STRING, description: 'Nome do produto.' }
          },
          required: ['productName']
        }
      },

      // Markets Management
      {
        name: 'createMarket',
        description: 'Cria um novo mercado no sistema.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            name: { type: SchemaType.STRING, description: 'Nome do mercado.' },
            address: { type: SchemaType.STRING, description: 'Endereço do mercado (opcional).' },
            phone: { type: SchemaType.STRING, description: 'Telefone do mercado (opcional).' }
          },
          required: ['name']
        }
      },
      {
        name: 'getMarkets',
        description: 'Lista todos os mercados cadastrados.',
        parameters: { type: SchemaType.OBJECT, properties: {} }
      },
      {
        name: 'getMarketStats',
        description: 'Obtém estatísticas de um mercado específico.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            marketName: { type: SchemaType.STRING, description: 'Nome do mercado.' }
          },
          required: ['marketName']
        }
      },

      // Categories & Brands
      {
        name: 'createCategory',
        description: 'Cria uma nova categoria de produtos.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            name: { type: SchemaType.STRING, description: 'Nome da categoria.' },
            icon: { type: SchemaType.STRING, description: 'Ícone da categoria (opcional).' },
            color: { type: SchemaType.STRING, description: 'Cor da categoria (opcional).' }
          },
          required: ['name']
        }
      },
      {
        name: 'createBrand',
        description: 'Cria uma nova marca no sistema.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            name: { type: SchemaType.STRING, description: 'Nome da marca.' }
          },
          required: ['name']
        }
      },
      {
        name: 'createProductWithBrandAndCategory',
        description: 'Cria um produto junto com sua marca e/ou categoria se elas não existirem.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            productName: { type: SchemaType.STRING, description: 'Nome do produto.' },
            brandName: { type: SchemaType.STRING, description: 'Nome da marca (opcional).' },
            categoryName: { type: SchemaType.STRING, description: 'Nome da categoria (opcional).' },
            barcode: { type: SchemaType.STRING, description: 'Código de barras (opcional).' },
            description: { type: SchemaType.STRING, description: 'Descrição do produto (opcional).' }
          },
          required: ['productName']
        }
      },
      {
        name: 'getCategories',
        description: 'Lista todas as categorias disponíveis.',
        parameters: { type: SchemaType.OBJECT, properties: {} }
      },
      {
        name: 'getBrands',
        description: 'Lista todas as marcas disponíveis.',
        parameters: { type: SchemaType.OBJECT, properties: {} }
      },

      // Shopping Lists Management
      {
        name: 'createShoppingList',
        description: 'Cria uma nova lista de compras com um nome e uma lista de itens.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            listName: { type: SchemaType.STRING, description: 'O nome da nova lista de compras.' },
            items: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: 'Os nomes dos produtos a adicionar à lista. Pode ser vazio para criar lista sem itens.' }
          },
          required: ['listName']
        }
      },
      {
        name: 'getShoppingLists',
        description: 'Lista todas as listas de compras.',
        parameters: { type: SchemaType.OBJECT, properties: {} }
      },
      {
        name: 'addItemToShoppingList',
        description: 'Adiciona itens a uma lista de compras existente.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            listName: { type: SchemaType.STRING, description: 'Nome da lista de compras.' },
            items: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: 'Nomes dos produtos a adicionar.' }
          },
          required: ['listName', 'items']
        }
      },
      {
        name: 'generateAutoShoppingList',
        description: 'Gera automaticamente uma lista de compras baseada em padrões de consumo.',
        parameters: { type: SchemaType.OBJECT, properties: {} }
      },

      // Purchases Management
      {
        name: 'createPurchase',
        description: 'Registra uma nova compra.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            marketName: { type: SchemaType.STRING, description: 'Nome do mercado onde foi feita a compra.' },
            items: { 
              type: SchemaType.ARRAY, 
              items: { 
                type: SchemaType.OBJECT,
                properties: {
                  productName: { type: SchemaType.STRING, description: 'Nome do produto.' },
                  quantity: { type: SchemaType.NUMBER, description: 'Quantidade comprada.' },
                  unitPrice: { type: SchemaType.NUMBER, description: 'Preço unitário.' }
                }
              },
              description: 'Lista de itens comprados.' 
            }
          },
          required: ['marketName', 'items']
        }
      },
      {
        name: 'getPurchases',
        description: 'Lista o histórico de compras.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            marketName: { type: SchemaType.STRING, description: 'Filtrar por mercado (opcional).' },
            limit: { type: SchemaType.NUMBER, description: 'Limite de resultados (opcional).' }
          }
        }
      },

      // Stock Management
      {
        name: 'getStockAlerts',
        description: 'Verifica o estoque e retorna alertas de produtos vencendo ou com quantidade baixa.',
        parameters: { type: SchemaType.OBJECT, properties: {} }
      },
      {
        name: 'addToStock',
        description: 'Adiciona produtos ao estoque.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            productName: { type: SchemaType.STRING, description: 'Nome do produto.' },
            quantity: { type: SchemaType.NUMBER, description: 'Quantidade a adicionar.' },
            expirationDate: { type: SchemaType.STRING, description: 'Data de vencimento (YYYY-MM-DD, opcional).' },
            location: { type: SchemaType.STRING, description: 'Local de armazenamento (opcional).' }
          },
          required: ['productName', 'quantity']
        }
      },
      {
        name: 'removeFromStock',
        description: 'Remove produtos do estoque.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            productName: { type: SchemaType.STRING, description: 'Nome do produto.' },
            quantity: { type: SchemaType.NUMBER, description: 'Quantidade a remover.' },
            reason: { type: SchemaType.STRING, description: 'Motivo da remoção (consumo, perda, vencimento, etc.).' }
          },
          required: ['productName', 'quantity']
        }
      },
      {
        name: 'getStockItems',
        description: 'Lista todos os itens em estoque.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            lowStock: { type: SchemaType.BOOLEAN, description: 'Mostrar apenas itens com estoque baixo.' },
            expiringSoon: { type: SchemaType.BOOLEAN, description: 'Mostrar apenas itens vencendo em breve.' }
          }
        }
      },
      {
        name: 'getWasteStats',
        description: 'Obtém estatísticas de desperdício de alimentos.',
        parameters: { type: SchemaType.OBJECT, properties: {} }
      },

      // Recipes & AI Features
      {
        name: 'suggestRecipes',
        description: 'Sugere receitas baseadas nos ingredientes disponíveis no estoque.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            ingredients: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: 'Lista de ingredientes disponíveis (opcional).' },
            mealType: { type: SchemaType.STRING, description: 'Tipo de refeição (café da manhã, almoço, jantar, lanche, opcional).' }
          }
        }
      },
      {
        name: 'getRecipes',
        description: 'Lista receitas salvas.',
        parameters: { type: SchemaType.OBJECT, properties: {} }
      },
      {
        name: 'analyzeNutrition',
        description: 'Analisa informações nutricionais de um produto ou lista de produtos.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            productNames: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: 'Lista de produtos para análise nutricional.' }
          },
          required: ['productNames']
        }
      },

      // Analytics & Predictions
      {
        name: 'getConsumptionPatterns',
        description: 'Analisa padrões de consumo dos produtos.',
        parameters: { type: SchemaType.OBJECT, properties: {} }
      },
      {
        name: 'getPriceHistory',
        description: 'Obtém histórico de preços de um produto.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            productName: { type: SchemaType.STRING, description: 'Nome do produto.' },
            days: { type: SchemaType.NUMBER, description: 'Número de dias para análise (opcional, padrão 30).' }
          },
          required: ['productName']
        }
      },
      {
        name: 'checkBestPrice',
        description: 'Verifica o melhor preço atual de um produto entre os mercados.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            productName: { type: SchemaType.STRING, description: 'Nome do produto.' }
          },
          required: ['productName']
        }
      },

      // Sistema de Seleção com Cards
      {
        name: 'findSimilarProducts',
        description: 'Busca produtos com nomes similares para exibir cards de seleção.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            searchTerm: { type: SchemaType.STRING, description: 'Termo de busca para produtos similares.' },
            context: { type: SchemaType.STRING, description: 'Contexto da operação (ex: addToList:NomeDaLista, comparePrice, etc.)' }
          },
          required: ['searchTerm']
        }
      },
      {
        name: 'findSimilarMarkets',
        description: 'Busca mercados com nomes similares para exibir cards de seleção.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            searchTerm: { type: SchemaType.STRING, description: 'Termo de busca para mercados similares.' }
          },
          required: ['searchTerm']
        }
      },
      {
        name: 'findSimilarCategories',
        description: 'Busca categorias com nomes similares para exibir cards de seleção.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            searchTerm: { type: SchemaType.STRING, description: 'Termo de busca para categorias similares.' }
          },
          required: ['searchTerm']
        }
      },
      {
        name: 'findSimilarBrands',
        description: 'Busca marcas com nomes similares para exibir cards de seleção.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            searchTerm: { type: SchemaType.STRING, description: 'Termo de busca para marcas similares.' }
          },
          required: ['searchTerm']
        }
      },
      {
        name: 'findSimilarShoppingLists',
        description: 'Busca listas de compras com nomes similares para exibir cards de seleção.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            searchTerm: { type: SchemaType.STRING, description: 'Termo de busca para listas similares.' }
          },
          required: ['searchTerm']
        }
      }
    ]
  }
];

// Função para parsear contexto das operações
function parseContext(contextStr: string, searchTerm: string) {
  if (contextStr.startsWith('addToList:')) {
    const listName = contextStr.replace('addToList:', '');
    return { action: 'addToList', listName, searchTerm };
  }
  if (contextStr === 'comparePrice') {
    return { action: 'comparePrice', searchTerm };
  }
  if (contextStr === 'addToStock') {
    return { action: 'addToStock', searchTerm };
  }
  return { action: 'generic', searchTerm, originalContext: contextStr };
}

// Função para lidar com seleções do usuário
async function handleSelection(selectionData: any, history: any[]) {
  const { type, selectedOption, originalContext, searchTerm } = selectionData;
  
  // Baseado no contexto original, executa a ação apropriada
  if (originalContext?.action === 'addToList') {
    // Adiciona o produto selecionado à lista
    const result = await toolFunctions.addItemToShoppingList({
      listName: originalContext.listName,
      items: [selectedOption.name]
    });
    return NextResponse.json({ 
      reply: result.message || `Produto "${selectedOption.name}" adicionado à lista "${originalContext.listName}" com sucesso!`
    });
  }
  
  if (originalContext?.action === 'comparePrice') {
    // Compara preço do produto selecionado
    const result = await toolFunctions.getProductPriceComparison({
      productName: selectedOption.name
    });
    return NextResponse.json({ 
      reply: `Comparação de preços para "${selectedOption.name}":\n\n${JSON.stringify(result.prices, null, 2)}`
    });
  }
  
  // Ação padrão: apenas confirma a seleção
  return NextResponse.json({ 
    reply: `Você selecionou: "${selectedOption.name}". Como posso ajudar com essa seleção?`
  });
}

const toolFunctions = {
  // Dashboard & Analytics
  getDashboardStats: async () => {
    const [totalSpent, totalPurchases, totalProducts, totalStockItems] = await Promise.all([
      prisma.purchase.aggregate({ _sum: { totalAmount: true } }),
      prisma.purchase.count(),
      prisma.product.count(),
      prisma.stockItem.count()
    ]);
    
    return {
      success: true,
      data: {
        totalSpent: totalSpent._sum.totalAmount || 0,
        totalPurchases,
        totalProducts,
        totalStockItems
      }
    };
  },

  getSavingsAnalysis: async () => {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/savings`);
    const data = await response.json();
    return { success: true, data };
  },

  // Products Management
  createProduct: async ({ name, brandName, categoryName, barcode, description }: any) => {
    try {
      let brandId = null;
      let categoryId = null;

      // Validar e buscar marca se fornecida
      if (brandName) {
        const brand = await prisma.brand.findFirst({
          where: { name: { equals: brandName, mode: 'insensitive' } }
        });
        if (!brand) {
          return { 
            success: false, 
            message: `A marca "${brandName}" não existe no sistema. Deseja criar esta marca primeiro?`,
            missingBrand: brandName
          };
        }
        brandId = brand.id;
      }

      // Validar e buscar categoria se fornecida
      if (categoryName) {
        const category = await prisma.category.findFirst({
          where: { name: { equals: categoryName, mode: 'insensitive' } }
        });
        if (!category) {
          return { 
            success: false, 
            message: `A categoria "${categoryName}" não existe no sistema. Deseja criar esta categoria primeiro?`,
            missingCategory: categoryName
          };
        }
        categoryId = category.id;
      }

      const product = await prisma.product.create({
        data: { name, brandId, categoryId, barcode, description },
        include: { brand: true, category: true }
      });
      
      return { success: true, message: `Produto "${name}" criado com sucesso.`, product };
    } catch (error) {
      return { success: false, message: `Erro ao criar produto: ${error}` };
    }
  },

  searchProducts: async ({ search, categoryId, brandId }: any) => {
    const products = await prisma.product.findMany({
      where: {
        name: { contains: search, mode: 'insensitive' },
        ...(categoryId && { categoryId }),
        ...(brandId && { brandId })
      },
      include: { brand: true, category: true },
      take: 10
    });
    return { success: true, products };
  },

  getProductPriceComparison: async ({ productName }: { productName: string }) => {
    const product = await prisma.product.findFirst({ 
      where: { name: { contains: productName, mode: 'insensitive' } } 
    });
    if (!product) return { success: false, message: `Produto "${productName}" não encontrado.` };

    const prices = await prisma.purchaseItem.findMany({
      where: { productId: product.id },
      include: { purchase: { include: { market: true } } },
      orderBy: { purchase: { purchaseDate: 'desc' } },
      take: 50
    });
    
    const pricesByMarket = prices.reduce((acc: any, item) => {
      const marketName = item.purchase.market.name;
      if (!acc[marketName] || new Date(item.purchase.purchaseDate) > new Date(acc[marketName].date)) {
        acc[marketName] = {
          price: item.unitPrice,
          date: item.purchase.purchaseDate,
          formatted: `R$ ${item.unitPrice.toFixed(2)}`
        };
      }
      return acc;
    }, {});

    return { success: true, product: product.name, prices: pricesByMarket };
  },

  getHealthyAlternatives: async ({ productName }: { productName: string }) => {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/products/healthy-alternatives`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productName })
    });
    const data = await response.json();
    return { success: true, alternatives: data.alternatives };
  },

  getBestDayToBuy: async ({ productName }: { productName: string }) => {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/products/best-day-to-buy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productName })
    });
    const data = await response.json();
    return { success: true, recommendation: data };
  },

  // Markets Management
  createMarket: async ({ name, address, phone }: any) => {
    try {
      const market = await prisma.market.create({
        data: { name, address, phone }
      });
      return { success: true, message: `Mercado "${name}" criado com sucesso.`, market };
    } catch (error) {
      return { success: false, message: `Erro ao criar mercado: ${error}` };
    }
  },

  getMarkets: async () => {
    const markets = await prisma.market.findMany({
      orderBy: { name: 'asc' }
    });
    return { success: true, markets };
  },

  getMarketStats: async ({ marketName }: { marketName: string }) => {
    const market = await prisma.market.findFirst({
      where: { name: { contains: marketName, mode: 'insensitive' } }
    });
    if (!market) return { success: false, message: `Mercado "${marketName}" não encontrado.` };

    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/markets/${market.id}/stats`);
    const stats = await response.json();
    return { success: true, market: market.name, stats };
  },

  // Categories & Brands
  createCategory: async ({ name, icon, color }: any) => {
    try {
      const category = await prisma.category.create({
        data: { name, icon, color }
      });
      return { success: true, message: `Categoria "${name}" criada com sucesso.`, category };
    } catch (error) {
      return { success: false, message: `Erro ao criar categoria: ${error}` };
    }
  },

  createBrand: async ({ name }: any) => {
    try {
      const brand = await prisma.brand.create({
        data: { name }
      });
      return { success: true, message: `Marca "${name}" criada com sucesso.`, brand };
    } catch (error) {
      return { success: false, message: `Erro ao criar marca: ${error}` };
    }
  },

  createProductWithBrandAndCategory: async ({ productName, brandName, categoryName, barcode, description }: any) => {
    try {
      let brandId = null;
      let categoryId = null;

      // Criar marca se fornecida e não existir
      if (brandName) {
        let brand = await prisma.brand.findFirst({
          where: { name: { equals: brandName, mode: 'insensitive' } }
        });
        if (!brand) {
          brand = await prisma.brand.create({
            data: { name: brandName }
          });
        }
        brandId = brand.id;
      }

      // Criar categoria se fornecida e não existir
      if (categoryName) {
        let category = await prisma.category.findFirst({
          where: { name: { equals: categoryName, mode: 'insensitive' } }
        });
        if (!category) {
          category = await prisma.category.create({
            data: { name: categoryName, icon: '📦', color: '#6b7280' }
          });
        }
        categoryId = category.id;
      }

      // Criar produto
      const product = await prisma.product.create({
        data: { name: productName, brandId, categoryId, barcode, description },
        include: { brand: true, category: true }
      });
      
      let message = `Produto "${productName}" criado com sucesso.`;
      if (brandName) message += ` Marca: ${brandName}.`;
      if (categoryName) message += ` Categoria: ${categoryName}.`;
      
      return { success: true, message, product };
    } catch (error) {
      return { success: false, message: `Erro ao criar produto: ${error}` };
    }
  },

  getCategories: async () => {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    return { success: true, categories };
  },

  getBrands: async () => {
    const brands = await prisma.brand.findMany({
      orderBy: { name: 'asc' }
    });
    return { success: true, brands };
  },

  // Shopping Lists Management
  createShoppingList: async ({ listName, items }: { listName: string, items?: string[] }) => {
    try {
      if (!items || items.length === 0) {
        const list = await prisma.shoppingList.create({
          data: { name: listName }
        });
        return { success: true, message: `Lista "${listName}" criada com sucesso (sem itens).`, list };
      }
      
      const foundProducts = await prisma.product.findMany({ 
        where: { name: { in: items, mode: 'insensitive' } } 
      });
      
      const foundProductNames = foundProducts.map(p => p.name.toLowerCase());
      const notFoundItems = items.filter(item => 
        !foundProductNames.includes(item.toLowerCase())
      );
      
      const list = await prisma.shoppingList.create({
        data: { 
          name: listName,
          items: { create: foundProducts.map(p => ({ productId: p.id, quantity: 1 })) }
        },
        include: { items: { include: { product: true } } }
      });
      
      let message = `Lista "${listName}" criada com ${foundProducts.length} itens.`;
      if (notFoundItems.length > 0) {
        message += ` Produtos não encontrados: ${notFoundItems.join(', ')}.`;
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
        _count: { select: { items: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, lists };
  },

  addItemToShoppingList: async ({ listName, items }: { listName: string, items: string[] }) => {
    try {
      const list = await prisma.shoppingList.findFirst({
        where: { name: { contains: listName, mode: 'insensitive' } }
      });
      if (!list) return { success: false, message: `Lista "${listName}" não encontrada.` };

      const foundProducts = await prisma.product.findMany({ 
        where: { name: { in: items, mode: 'insensitive' } } 
      });

      if (foundProducts.length === 0) {
        return { success: false, message: `Nenhum produto encontrado: ${items.join(', ')}.` };
      }

      await prisma.shoppingListItem.createMany({
        data: foundProducts.map(p => ({ 
          listId: list.id, 
          productId: p.id, 
          quantity: 1 
        })),
        skipDuplicates: true
      });

      const notFoundItems = items.filter(item => 
        !foundProducts.some(p => p.name.toLowerCase().includes(item.toLowerCase()))
      );

      let message = `Adicionados ${foundProducts.length} itens à lista "${listName}".`;
      if (notFoundItems.length > 0) {
        message += ` Produtos não encontrados: ${notFoundItems.join(', ')}.`;
      }

      return { success: true, message };
    } catch (error) {
      return { success: false, message: `Erro ao adicionar itens: ${error}` };
    }
  },

  generateAutoShoppingList: async () => {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/predictions/auto-shopping-list`);
    const data = await response.json();
    return { success: true, autoList: data };
  },

  // Purchases Management
  createPurchase: async ({ marketName, items }: any) => {
    try {
      const market = await prisma.market.findFirst({
        where: { name: { contains: marketName, mode: 'insensitive' } }
      });
      if (!market) return { success: false, message: `Mercado "${marketName}" não encontrado.` };

      const totalAmount = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);

      const purchase = await prisma.purchase.create({
        data: {
          marketId: market.id,
          purchaseDate: new Date(),
          totalAmount,
          items: {
            create: await Promise.all(items.map(async (item: any) => {
              let product = await prisma.product.findFirst({
                where: { name: { contains: item.productName, mode: 'insensitive' } }
              });
              
              if (!product) {
                product = await prisma.product.create({
                  data: { name: item.productName }
                });
              }

              return {
                productId: product.id,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.quantity * item.unitPrice
              };
            }))
          }
        },
        include: { items: { include: { product: true } } }
      });

      return { success: true, message: `Compra registrada no ${marketName} com ${items.length} itens.`, purchase };
    } catch (error) {
      return { success: false, message: `Erro ao registrar compra: ${error}` };
    }
  },

  getPurchases: async ({ marketName, limit = 10 }: any) => {
    const purchases = await prisma.purchase.findMany({
      where: marketName ? {
        market: { name: { contains: marketName, mode: 'insensitive' } }
      } : undefined,
      include: { 
        market: true,
        items: { include: { product: true } },
        _count: { select: { items: true } }
      },
      orderBy: { purchaseDate: 'desc' },
      take: limit
    });
    return { success: true, purchases };
  },

  // Stock Management
  getStockAlerts: async () => {
    const [lowStockItems, expiringSoonItems, expiredItems] = await Promise.all([
      prisma.stockItem.count({ where: { isLowStock: true } }),
      prisma.stockItem.count({ 
        where: { 
          expirationDate: { 
            lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            gte: new Date()
          } 
        } 
      }),
      prisma.stockItem.count({ 
        where: { expirationDate: { lt: new Date() } } 
      })
    ]);

    return {
      success: true,
      alerts: {
        lowStockCount: lowStockItems,
        expiringSoonCount: expiringSoonItems,
        expiredCount: expiredItems
      }
    };
  },

  addToStock: async ({ productName, quantity, expirationDate, location }: any) => {
    try {
      let product = await prisma.product.findFirst({
        where: { name: { contains: productName, mode: 'insensitive' } }
      });
      
      if (!product) {
        product = await prisma.product.create({
          data: { name: productName }
        });
      }

      const stockItem = await prisma.stockItem.create({
        data: {
          productId: product.id,
          quantity,
          expirationDate: expirationDate ? new Date(expirationDate) : undefined,
          location
        },
        include: { product: true }
      });

      return { 
        success: true, 
        message: `Adicionados ${quantity} unidades de "${product.name}" ao estoque.`,
        stockItem 
      };
    } catch (error) {
      return { success: false, message: `Erro ao adicionar ao estoque: ${error}` };
    }
  },

  removeFromStock: async ({ productName, quantity, reason }: any) => {
    try {
      const product = await prisma.product.findFirst({
        where: { name: { contains: productName, mode: 'insensitive' } }
      });
      if (!product) return { success: false, message: `Produto "${productName}" não encontrado.` };

      const stockItems = await prisma.stockItem.findMany({
        where: { productId: product.id, quantity: { gt: 0 } },
        orderBy: { expirationDate: 'asc' }
      });

      let remainingToRemove = quantity;
      const updates = [];

      for (const item of stockItems) {
        if (remainingToRemove <= 0) break;
        
        const removeFromItem = Math.min(item.quantity, remainingToRemove);
        updates.push(
          prisma.stockItem.update({
            where: { id: item.id },
            data: { quantity: item.quantity - removeFromItem }
          })
        );
        remainingToRemove -= removeFromItem;
      }

      await Promise.all(updates);

      return { 
        success: true, 
        message: `Removidos ${quantity - remainingToRemove} unidades de "${product.name}" do estoque.` 
      };
    } catch (error) {
      return { success: false, message: `Erro ao remover do estoque: ${error}` };
    }
  },

  getStockItems: async ({ lowStock, expiringSoon }: any) => {
    const where: any = {};
    
    if (lowStock) where.isLowStock = true;
    if (expiringSoon) {
      where.expirationDate = {
        lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        gte: new Date()
      };
    }

    const items = await prisma.stockItem.findMany({
      where,
      include: { product: true },
      orderBy: { expirationDate: 'asc' },
      take: 50
    });

    return { success: true, items };
  },

  getWasteStats: async () => {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/stock/waste-stats`);
    const data = await response.json();
    return { success: true, wasteStats: data };
  },

  // Recipes & AI Features
  suggestRecipes: async ({ ingredients, mealType }: any) => {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/ai/suggest-recipes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredients, mealType })
    });
    const data = await response.json();
    return { success: true, recipes: data.recipes };
  },

  getRecipes: async () => {
    const recipes = await prisma.recipe.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    return { success: true, recipes };
  },

  analyzeNutrition: async ({ productNames }: { productNames: string[] }) => {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/nutrition/analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productNames })
    });
    const data = await response.json();
    return { success: true, nutritionAnalysis: data };
  },

  // Analytics & Predictions
  getConsumptionPatterns: async () => {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/predictions/consumption-patterns`);
    const data = await response.json();
    return { success: true, patterns: data };
  },

  getPriceHistory: async ({ productName, days = 30 }: any) => {
    const product = await prisma.product.findFirst({
      where: { name: { contains: productName, mode: 'insensitive' } }
    });
    if (!product) return { success: false, message: `Produto "${productName}" não encontrado.` };

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const history = await prisma.purchaseItem.findMany({
      where: {
        productId: product.id,
        purchase: { purchaseDate: { gte: startDate } }
      },
      include: { purchase: { include: { market: true } } },
      orderBy: { purchase: { purchaseDate: 'desc' } }
    });

    return { success: true, product: product.name, history };
  },

  checkBestPrice: async ({ productName }: { productName: string }) => {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/best-price-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productName })
    });
    const data = await response.json();
    return { success: true, bestPrice: data };
  },

  // Sistema de Seleção com Cards
  findSimilarProducts: async ({ searchTerm, context }: { searchTerm: string, context?: string }) => {
    const products = await prisma.product.findMany({
      where: {
        name: { contains: searchTerm, mode: 'insensitive' }
      },
      include: { brand: true, category: true },
      take: 10,
      orderBy: { name: 'asc' }
    });

    if (products.length === 0) {
      return { success: false, message: `Nenhum produto encontrado com "${searchTerm}".` };
    }

    if (products.length === 1) {
      return { 
        success: true, 
        exactMatch: true,
        product: products[0],
        message: `Produto encontrado: ${products[0].name}` 
      };
    }

    return {
      success: true,
      showCards: true,
      cardType: 'products',
      searchTerm,
      options: products.map(p => ({
        id: p.id,
        name: p.name,
        brand: p.brand?.name,
        category: p.category?.name,
        barcode: p.barcode
      })),
      message: `Encontrados ${products.length} produtos similares a "${searchTerm}". Escolha uma das opções:`,
      context: context ? parseContext(context, searchTerm) : { action: 'productSelected', searchTerm }
    };
  },

  findSimilarMarkets: async ({ searchTerm }: { searchTerm: string }) => {
    const markets = await prisma.market.findMany({
      where: {
        name: { contains: searchTerm, mode: 'insensitive' }
      },
      take: 10,
      orderBy: { name: 'asc' }
    });

    if (markets.length === 0) {
      return { success: false, message: `Nenhum mercado encontrado com "${searchTerm}".` };
    }

    if (markets.length === 1) {
      return { 
        success: true, 
        exactMatch: true,
        market: markets[0],
        message: `Mercado encontrado: ${markets[0].name}` 
      };
    }

    return {
      success: true,
      showCards: true,
      cardType: 'markets',
      searchTerm,
      options: markets.map(m => ({
        id: m.id,
        name: m.name,
        location: m.location
      })),
      message: `Encontrados ${markets.length} mercados similares a "${searchTerm}". Escolha uma das opções:`
    };
  },

  findSimilarCategories: async ({ searchTerm }: { searchTerm: string }) => {
    const categories = await prisma.category.findMany({
      where: {
        name: { contains: searchTerm, mode: 'insensitive' }
      },
      take: 10,
      orderBy: { name: 'asc' }
    });

    if (categories.length === 0) {
      return { success: false, message: `Nenhuma categoria encontrada com "${searchTerm}".` };
    }

    if (categories.length === 1) {
      return { 
        success: true, 
        exactMatch: true,
        category: categories[0],
        message: `Categoria encontrada: ${categories[0].name}` 
      };
    }

    return {
      success: true,
      showCards: true,
      cardType: 'categories',
      searchTerm,
      options: categories.map(c => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        color: c.color,
        isFood: c.isFood
      })),
      message: `Encontradas ${categories.length} categorias similares a "${searchTerm}". Escolha uma das opções:`
    };
  },

  findSimilarBrands: async ({ searchTerm }: { searchTerm: string }) => {
    const brands = await prisma.brand.findMany({
      where: {
        name: { contains: searchTerm, mode: 'insensitive' }
      },
      include: {
        _count: { select: { products: true } }
      },
      take: 10,
      orderBy: { name: 'asc' }
    });

    if (brands.length === 0) {
      return { success: false, message: `Nenhuma marca encontrada com "${searchTerm}".` };
    }

    if (brands.length === 1) {
      return { 
        success: true, 
        exactMatch: true,
        brand: brands[0],
        message: `Marca encontrada: ${brands[0].name}` 
      };
    }

    return {
      success: true,
      showCards: true,
      cardType: 'brands',
      searchTerm,
      options: brands.map(b => ({
        id: b.id,
        name: b.name,
        productCount: b._count.products
      })),
      message: `Encontradas ${brands.length} marcas similares a "${searchTerm}". Escolha uma das opções:`
    };
  },

  findSimilarShoppingLists: async ({ searchTerm }: { searchTerm: string }) => {
    const lists = await prisma.shoppingList.findMany({
      where: {
        name: { contains: searchTerm, mode: 'insensitive' },
        isActive: true
      },
      include: {
        _count: { select: { items: true } }
      },
      take: 10,
      orderBy: { updatedAt: 'desc' }
    });

    if (lists.length === 0) {
      return { success: false, message: `Nenhuma lista de compras encontrada com "${searchTerm}".` };
    }

    if (lists.length === 1) {
      return { 
        success: true, 
        exactMatch: true,
        list: lists[0],
        message: `Lista encontrada: ${lists[0].name}` 
      };
    }

    return {
      success: true,
      showCards: true,
      cardType: 'shopping-lists',
      searchTerm,
      options: lists.map(l => ({
        id: l.id,
        name: l.name,
        itemCount: l._count.items,
        createdAt: l.createdAt,
        updatedAt: l.updatedAt
      })),
      message: `Encontradas ${lists.length} listas similares a "${searchTerm}". Escolha uma das opções:`
    };
  }
};


export async function POST(request: Request) {
  try {
    const { message, history } = await request.json();

    // Verifica se é uma mensagem de seleção
    if (message.startsWith('SELEÇÃO_FEITA:')) {
      const selectionData = JSON.parse(message.replace('SELEÇÃO_FEITA:', '').trim());
      return await handleSelection(selectionData, history);
    }

    // Ensure history starts with user message and has correct format
    const validHistory = history && Array.isArray(history) ? history.filter((msg: any) => {
      return msg.role && msg.parts && (msg.role === 'user' || msg.role === 'model');
    }) : [];

    // If history exists but doesn't start with user, clear it
    if (validHistory.length > 0 && validHistory[0].role !== 'user') {
      validHistory.length = 0;
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", 
      tools,
      systemInstruction: `Você é um assistente inteligente completo para o sistema Mercado304 - um sistema de gerenciamento de compras de supermercado.

INSTRUÇÕES IMPORTANTES:
- Responda SEMPRE em português brasileiro
- Seja proativo, inteligente e útil nas suas respostas
- Use as funções disponíveis para realizar qualquer tarefa que o usuário solicitar

FUNCIONALIDADES DISPONÍVEIS:

📊 DASHBOARD & ANALYTICS:
- Estatísticas gerais (getDashboardStats)
- Análise de economia e oportunidades (getSavingsAnalysis)

🛒 PRODUTOS:
- Criar produtos (createProduct) - valida se marca/categoria existem primeiro
- Criar produto com marca/categoria (createProductWithBrandAndCategory) - cria tudo automaticamente
- Buscar produtos (searchProducts)
- Comparar preços entre mercados (getProductPriceComparison)
- Buscar alternativas saudáveis (getHealthyAlternatives)
- Melhor dia para comprar (getBestDayToBuy)
- Verificar melhor preço atual (checkBestPrice)
- Histórico de preços (getPriceHistory)

🏪 MERCADOS:
- Criar mercados (createMarket)
- Listar mercados (getMarkets)
- Estatísticas por mercado (getMarketStats)

🏷️ CATEGORIAS & MARCAS:
- Criar categorias (createCategory)
- Criar marcas (createBrand)
- Listar categorias (getCategories)
- Listar marcas (getBrands)

📝 LISTAS DE COMPRAS:
- Criar listas (createShoppingList)
- Listar todas as listas (getShoppingLists)
- Adicionar itens às listas (addItemToShoppingList)
- Gerar lista automática baseada em padrões (generateAutoShoppingList)

💰 COMPRAS:
- Registrar compras (createPurchase)
- Listar histórico de compras (getPurchases)

📦 ESTOQUE:
- Alertas de estoque (getStockAlerts)
- Adicionar ao estoque (addToStock)
- Remover do estoque (removeFromStock)
- Listar itens em estoque (getStockItems)
- Estatísticas de desperdício (getWasteStats)

🍳 RECEITAS & IA:
- Sugerir receitas com ingredientes disponíveis (suggestRecipes)
- Listar receitas (getRecipes)
- Análise nutricional (analyzeNutrition)

📈 ANÁLISE & PREVISÕES:
- Padrões de consumo (getConsumptionPatterns)

🎯 SISTEMA DE SELEÇÃO INTELIGENTE:
- Buscar produtos similares (findSimilarProducts)
- Buscar mercados similares (findSimilarMarkets) 
- Buscar categorias similares (findSimilarCategories)
- Buscar marcas similares (findSimilarBrands)
- Buscar listas similares (findSimilarShoppingLists)

COMPORTAMENTOS INTELIGENTES:
- Se o usuário quer "criar lista X", crie lista vazia com esse nome
- Se mencionar itens, adicione automaticamente à lista
- Se produtos não existirem, informe quais não foram encontrados mas crie os que encontrar
- Seja proativo: se perguntarem sobre preços, compare automaticamente entre mercados
- Use contexto: se falarem sobre estoque, verifique alertas automaticamente
- Para receitas, considere ingredientes disponíveis no estoque automaticamente

🎯 SISTEMA DE SELEÇÃO INTELIGENTE:
Quando o usuário mencionar nomes que podem ter múltiplas opções (ex: "coca-cola" pode ser "Coca-Cola 2L", "Coca-Cola Lata", etc.):

1. SEMPRE use as funções findSimilar* primeiro:
   - findSimilarProducts para produtos
   - findSimilarMarkets para mercados
   - findSimilarCategories para categorias
   - findSimilarBrands para marcas
   - findSimilarShoppingLists para listas

2. Se encontrar múltiplas opções (showCards: true):
   - Mostre os cards de seleção formatados
   - Aguarde a escolha do usuário
   - Continue com a operação usando a opção escolhida

3. Se encontrar exata (exactMatch: true):
   - Continue normalmente com a operação

EXEMPLO DE FLUXO:
Usuário: "Adicionar coca-cola à lista Churrasco"
1. Execute findSimilarProducts("coca-cola") com contexto: { action: 'addToList', listName: 'Churrasco' }
2. Se múltiplas opções → mostre cards automaticamente
3. Frontend processará a seleção e completará a ação

Usuário: "Comparar preço da coca-cola"  
1. Execute findSimilarProducts("coca-cola") com contexto: { action: 'comparePrice' }
2. Se múltiplas opções → mostre cards automaticamente
3. Frontend processará a seleção e comparará preços

CRIAÇÃO DE PRODUTOS:
- Para criar produtos simples sem marca/categoria: use createProduct
- Para criar produtos COM marca/categoria específicas: use createProductWithBrandAndCategory (cria tudo automaticamente)
- Se createProduct falhar por marca/categoria inexistente, pergunte ao usuário se deseja criar, então use createProductWithBrandAndCategory

FLUXO RECOMENDADO para "Crie produto X da marca Y categoria Z":
1. Tente usar createProductWithBrandAndCategory diretamente (mais eficiente)
2. Isso criará automaticamente marca e categoria se não existirem

Você pode fazer TUDO que o aplicativo permite através das interfaces!`
    });
    
    const chat = model.startChat({ history: validHistory });
    
    // Usa retry para a primeira mensagem
    const result = await retryWithBackoff(
      () => chat.sendMessage(message),
      3,
      1000
    );
    
    const functionCalls = result.response.functionCalls();

    if (functionCalls && functionCalls.length > 0) {
      console.log("IA solicitou chamadas de função:", functionCalls.map(call => call.name));
      
      // Executa todas as chamadas de função
      const functionResponses = await Promise.all(
        functionCalls.map(async (call) => {
          // @ts-ignore
          const apiResponse = await toolFunctions[call.name](call.args);
          return {
            functionResponse: {
              name: call.name,
              response: apiResponse
            }
          };
        })
      );

      // Verifica se alguma função retornou dados de seleção
      let selectionData = null;
      for (const response of functionResponses) {
        if (response.functionResponse.response.showCards) {
          selectionData = response.functionResponse.response;
          break;
        }
      }
      
      // Se encontrou dados de seleção, retorna para o frontend mostrar cards
      if (selectionData) {
        return NextResponse.json({ 
          reply: selectionData.message,
          selectionData
        });
      }
      
      // Envia todas as respostas de volta para a IA com retry
      const result2 = await retryWithBackoff(
        () => chat.sendMessage(functionResponses),
        3,
        1000
      );
      
      const reply = result2.response.text();
      return NextResponse.json({ reply });
    }

    // Se não houver chamada de função, responde diretamente
    const reply = result.response.text();
    return NextResponse.json({ reply });

  } catch (error) {
    console.error('Erro na API do assistente:', error);
    
    // Trata diferentes tipos de erro com mensagens amigáveis
    let errorMessage = "Desculpe, ocorreu um erro inesperado. Tente novamente.";
    
    if (error instanceof Error) {
      const errorText = error.message.toLowerCase();
      
      if (errorText.includes('overloaded') || errorText.includes('503')) {
        errorMessage = "🔄 O assistente está sobrecarregado no momento. Tentei algumas vezes mas não consegui processar sua solicitação. Tente novamente em alguns segundos.";
      } else if (errorText.includes('rate limit') || errorText.includes('429')) {
        errorMessage = "⏱️ Muitas solicitações foram feitas recentemente. Aguarde alguns segundos e tente novamente.";
      } else if (errorText.includes('timeout')) {
        errorMessage = "⏰ A solicitação demorou muito para ser processada. Tente reformular sua pergunta ou tente novamente.";
      } else if (errorText.includes('api key') || errorText.includes('unauthorized')) {
        errorMessage = "🔑 Problema de autenticação com o serviço de IA. Entre em contato com o administrador.";
      } else if (errorText.includes('network') || errorText.includes('connection')) {
        errorMessage = "🌐 Problema de conexão. Verifique sua internet e tente novamente.";
      }
    }
    
    return NextResponse.json({ 
      reply: errorMessage,
      error: true 
    }, { status: 200 }); // Retorna 200 para não quebrar o frontend
  }
}