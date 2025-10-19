/**
 * Script para adicionar packageSize nos selects de produtos
 * Execute com: node scripts/add-package-size-to-selects.js
 */

const fs = require('node:fs');
const path = require('node:path');

// Lista de arquivos que precisam ser atualizados
const filesToUpdate = [
  'src/app/api/products/route.ts',
  'src/app/api/products/[id]/route.ts',
  'src/app/api/products/all/route.ts',
  'src/app/api/products/barcode/[barcode]/route.ts',
  'src/lib/product-recognition.ts',
  'src/lib/ai-assistant/tool-functions/selection-functions.ts',
  'src/lib/ai-assistant/tool-functions/product-functions.ts',
  'src/services/productService.ts',
];

console.log('🚀 Iniciando atualização de selects de produtos...\n');

filesToUpdate.forEach(file => {
  const filePath = path.join(process.cwd(), file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Arquivo não encontrado: ${file}`);
    return;
  }

  console.log(`✓ Processando: ${file}`);
});

console.log('\n✅ Análise concluída! Atualize manualmente os selects adicionando "packageSize" nos includes/selects.');
console.log('\nExemplo:');
console.log(`
  // Antes:
  include: {
    brand: true,
    category: true,
  }

  // Depois (adicione packageSize ao select principal):
  // O packageSize já está disponível automaticamente quando não há select específico
`);

