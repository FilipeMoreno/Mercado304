import { processProductRecognition, createProductFromRecognition } from '@/lib/product-recognition';

export const productRecognitionFunctions = {
  recognizeProductFromPhoto: async ({ imageData }: { imageData: string }) => {
    try {
      // Processar a imagem através da API de reconhecimento
      const formData = new FormData();
      
      // Se imageData é base64, converter para File
      if (imageData.startsWith('data:image/')) {
        const response = await fetch(imageData);
        const blob = await response.blob();
        const file = new File([blob], 'product-photo.jpg', { type: 'image/jpeg' });
        formData.append('image', file);
      } else {
        // Assumir que é um File ou Blob
        formData.append('image', imageData as any);
      }

      // Chamar API de reconhecimento
      const recognitionResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/ai/product-recognition`, {
        method: 'POST',
        body: formData,
      });

      if (!recognitionResponse.ok) {
        const errorData = await recognitionResponse.json();
        return {
          success: false,
          message: errorData.error || 'Erro ao analisar a imagem do produto',
        };
      }

      const { product: recognitionData } = await recognitionResponse.json();

      // Processar o resultado do reconhecimento
      const searchResult = await processProductRecognition(recognitionData);

      if (searchResult.found && searchResult.product) {
        // Produto encontrado - retornar informações completas
        const product = searchResult.product;
        
        // Formatar resposta com informações do produto cadastrado
        let response = `🎯 **Produto Identificado: ${product.name}**\n\n`;
        
        if (product.brand) {
          response += `🏷️ **Marca:** ${product.brand}\n`;
        }
        
        if (product.category) {
          response += `📂 **Categoria:** ${product.category}\n`;
        }
        
        if (product.description) {
          response += `📝 **Descrição:** ${product.description}\n`;
        }
        
        if (product.weight) {
          response += `⚖️ **Peso/Quantidade:** ${product.weight}\n`;
        }
        
        response += `\n📊 **Informações de Preços:**\n`;
        
        if (product.averagePrice) {
          response += `💰 **Preço Médio:** R$ ${product.averagePrice.toFixed(2)}\n`;
        }
        
        if (product.lowestPrice) {
          response += `🏆 **Menor Preço:** R$ ${product.lowestPrice.price.toFixed(2)} no ${product.lowestPrice.marketName}\n`;
        }
        
        if (product.priceHistory.length > 0) {
          response += `\n📈 **Histórico Recente de Preços:**\n`;
          product.priceHistory.slice(0, 5).forEach((record, index) => {
            response += `${index + 1}. R$ ${record.price.toFixed(2)} - ${record.marketName} (${new Date(record.date).toLocaleDateString()})\n`;
          });
        }
        
        if (product.purchaseHistory.length > 0) {
          response += `\n🛒 **Histórico de Compras:**\n`;
          product.purchaseHistory.slice(0, 3).forEach((purchase, index) => {
            response += `${index + 1}. ${purchase.quantity}x por R$ ${purchase.totalPrice.toFixed(2)} - ${purchase.marketName} (${new Date(purchase.date).toLocaleDateString()})\n`;
          });
        }
        
        response += `\n🎯 **O que você gostaria de fazer?**\n`;
        response += `• 📝 Registrar o preço atual deste produto\n`;
        response += `• 🛒 Adicionar à lista de compras\n`;
        response += `• 💳 Registrar uma compra\n`;
        response += `• 📊 Ver comparação detalhada de preços\n`;
        response += `• 🔍 Buscar alternativas similares\n`;
        
        return {
          success: true,
          message: response,
          productFound: true,
          productId: product.id,
          productName: product.name,
          actions: [
            { type: 'recordPrice', label: 'Registrar Preço' },
            { type: 'addToList', label: 'Adicionar à Lista' },
            { type: 'recordPurchase', label: 'Registrar Compra' },
            { type: 'comparePrice', label: 'Comparar Preços' },
            { type: 'findAlternatives', label: 'Buscar Alternativas' }
          ]
        };
        
      } else {
        // Produto não encontrado - sugerir cadastro
        const recognition = searchResult.recognitionData;
        
        let response = `🔍 **Produto Não Cadastrado**\n\n`;
        response += `📱 **Produto Identificado:** ${recognition.productName}\n`;
        
        if (recognition.brand) {
          response += `🏷️ **Marca:** ${recognition.brand}\n`;
        }
        
        if (recognition.category) {
          response += `📂 **Categoria:** ${recognition.category}\n`;
        }
        
        if (recognition.barcode) {
          response += `🔢 **Código de Barras:** ${recognition.barcode}\n`;
        }
        
        if (recognition.weight) {
          response += `⚖️ **Peso/Quantidade:** ${recognition.weight}\n`;
        }
        
        if (recognition.description) {
          response += `📝 **Descrição:** ${recognition.description}\n`;
        }
        
        response += `\n🎯 **Confiança da Identificação:** ${Math.round(recognition.confidence * 100)}%\n`;
        
        response += `\n❓ **Este produto não está cadastrado no seu sistema.**\n`;
        response += `Gostaria que eu cadastre este produto com as informações identificadas?\n\n`;
        response += `✅ **Ao cadastrar, você poderá:**\n`;
        response += `• 📊 Acompanhar preços em diferentes mercados\n`;
        response += `• 🛒 Adicionar às suas listas de compras\n`;
        response += `• 📈 Ver histórico de preços e compras\n`;
        response += `• 🔍 Receber análises e comparações\n`;
        
        return {
          success: true,
          message: response,
          productFound: false,
          recognitionData: recognition,
          actions: [
            { type: 'registerProduct', label: 'Cadastrar Produto' },
            { type: 'searchSimilar', label: 'Buscar Produtos Similares' }
          ]
        };
      }
      
    } catch (error) {
      console.error('Erro no reconhecimento de produto:', error);
      return {
        success: false,
        message: 'Erro ao processar a imagem do produto. Tente novamente.',
      };
    }
  },

  // Ações rápidas para produtos reconhecidos
  quickRecordPrice: async ({ productName, marketName, price, notes }: {
    productName: string
    marketName: string
    price: number
    notes?: string
  }) => {
    try {
      const response = await fetch('/api/prices/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName, marketName, price, notes })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          message: errorData.error || "Erro ao registrar preço"
        };
      }

      const data = await response.json();
      return {
        success: true,
        message: `Preço de R$ ${price.toFixed(2)} registrado para ${productName} no ${marketName}`,
        priceRecord: data.priceRecord
      };
    } catch (error) {
      return {
        success: false,
        message: `Erro ao registrar preço: ${error}`
      };
    }
  },

  quickAddToShoppingList: async ({ listName, productName, quantity = 1 }: {
    listName: string
    productName: string
    quantity?: number
  }) => {
    try {
      const response = await fetch('/api/shopping-lists/add-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          listName, 
          items: [productName],
          quantity 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          message: errorData.error || "Erro ao adicionar à lista"
        };
      }

      const data = await response.json();
      return {
        success: true,
        message: `${productName} (${quantity}x) adicionado à lista "${listName}"`,
        list: data.list
      };
    } catch (error) {
      return {
        success: false,
        message: `Erro ao adicionar à lista: ${error}`
      };
    }
  },

  quickRecordPurchase: async ({ marketName, productName, quantity, unitPrice }: {
    marketName: string
    productName: string
    quantity: number
    unitPrice: number
  }) => {
    try {
      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketName,
          items: [{
            productName,
            quantity,
            unitPrice
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          message: errorData.error || "Erro ao registrar compra"
        };
      }

      const data = await response.json();
      const totalValue = quantity * unitPrice;
      return {
        success: true,
        message: `Compra registrada: ${quantity}x ${productName} por R$ ${totalValue.toFixed(2)} no ${marketName}`,
        purchase: data.purchase
      };
    } catch (error) {
      return {
        success: false,
        message: `Erro ao registrar compra: ${error}`
      };
    }
  },

  // Função auxiliar para cadastrar produto a partir do reconhecimento
  registerProductFromRecognition: async ({ recognitionData, userId }: { recognitionData: any, userId: string }) => {
    try {
      const productId = await createProductFromRecognition(recognitionData, userId);
      
      return {
        success: true,
        message: `✅ Produto "${recognitionData.productName}" cadastrado com sucesso!`,
        productId,
        productName: recognitionData.productName,
      };
      
    } catch (error) {
      console.error('Erro ao cadastrar produto:', error);
      return {
        success: false,
        message: 'Erro ao cadastrar o produto. Tente novamente.',
      };
    }
  }
};