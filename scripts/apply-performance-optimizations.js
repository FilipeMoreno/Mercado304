#!/usr/bin/env node

/**
 * Script para aplicar otimizações de performance em todas as páginas
 * do sistema Mercado304
 */

const fs = require('node:fs');
const path = require('node:path');

// Configuração das páginas para otimizar
const pagesToOptimize = [
  {
    path: 'src/app/compras/purchases-client.tsx',
    type: 'purchase',
    cardComponent: 'PurchaseCardMemo'
  },
  {
    path: 'src/app/lista/lista-client.tsx',
    type: 'shopping-list',
    cardComponent: 'ShoppingListCardMemo'
  },
  {
    path: 'src/app/receitas/receitas-client.tsx',
    type: 'recipe',
    cardComponent: 'RecipeCardMemo'
  },
  {
    path: 'src/app/precos/precos-client.tsx',
    type: 'price',
    cardComponent: 'PriceCardMemo'
  },
  {
    path: 'src/app/comparacao/comparacao-client.tsx',
    type: 'comparison',
    cardComponent: 'ComparisonCardMemo'
  },
  {
    path: 'src/app/nutricao/nutricao-client.tsx',
    type: 'nutrition',
    cardComponent: 'NutritionCardMemo'
  },
  {
    path: 'src/app/estoque/estoque-client.tsx',
    type: 'stock',
    cardComponent: 'StockCardMemo'
  },
  {
    path: 'src/app/desperdicios/desperdicios-client.tsx',
    type: 'waste',
    cardComponent: 'WasteCardMemo'
  },
  {
    path: 'src/app/churrasco/churrasco-client.tsx',
    type: 'barbecue',
    cardComponent: 'BarbecueCardMemo'
  }
];

// Template para imports otimizados
const optimizedImports = `
import { OptimizedLoading } from "@/components/ui/optimized-loading"
import { LazyWrapper } from "@/components/ui/lazy-wrapper"
import { usePerformanceMonitor } from "@/hooks/use-performance"
import { useOptimizedQuery } from "@/hooks/use-optimized-queries"
`;

// Template para loading otimizado
const optimizedLoadingTemplate = (type, skeletonCount = 8) => `
				<OptimizedLoading 
					isLoading={isLoading} 
					skeletonType="${type}" 
					skeletonCount={${skeletonCount}}
				>
					{items.length > 0 ? (
`;

// Template para card memoizado
const memoizedCardTemplate = (cardComponent) => `
							{items.map((item: any, index: number) => (
								<motion.div
									key={item.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.05 }}
								>
									<${cardComponent} 
										item={item} 
										onDelete={handleDelete}
									/>
								</motion.div>
							))}
`;

// Template para fechamento do OptimizedLoading
const closeOptimizedLoading = `
					</>
				)}
				</OptimizedLoading>
`;

// Função para aplicar otimizações
function applyOptimizations() {
  console.log('🚀 Aplicando otimizações de performance...');

  pagesToOptimize.forEach(page => {
    const filePath = path.join(process.cwd(), page.path);

    if (fs.existsSync(filePath)) {
      console.log(`📝 Otimizando: ${page.path}`);

      let content = fs.readFileSync(filePath, 'utf8');

      // Adicionar imports otimizados
      if (!content.includes('OptimizedLoading')) {
        content = content.replace(
          /import.*from "react"/,
          `$&\n${optimizedImports}`
        );
      }

      // Substituir loading state
      if (content.includes('isLoading ?')) {
        content = content.replace(
          /{isLoading \? \([\s\S]*?\) : items\.length > 0 \? \(/,
          optimizedLoadingTemplate(page.type)
        );
      }

      // Substituir cards por componentes memoizados
      if (content.includes('items.map')) {
        content = content.replace(
          /{items\.map\([\s\S]*?<\/motion\.div>\s*\)\)}/,
          memoizedCardTemplate(page.cardComponent)
        );
      }

      // Fechar OptimizedLoading
      if (content.includes('</motion.div>') && !content.includes('</OptimizedLoading>')) {
        content = content.replace(
          /(\s*<\/motion\.div>\s*$)/,
          `${closeOptimizedLoading}$1`
        );
      }

      fs.writeFileSync(filePath, content);
      console.log(`✅ Otimizado: ${page.path}`);
    } else {
      console.log(`⚠️  Arquivo não encontrado: ${page.path}`);
    }
  });

  console.log('🎉 Otimizações aplicadas com sucesso!');
}

// Executar otimizações
if (require.main === module) {
  applyOptimizations();
}

module.exports = { applyOptimizations };
