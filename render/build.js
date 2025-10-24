// render/build.js
// Script de build para o worker

const { execSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

console.log('🔨 Iniciando build do worker...')

try {
  // 1. Instalar dependências
  console.log('📦 Instalando dependências...')
  execSync('npm install', { stdio: 'inherit' })

  // 2. Gerar Prisma client
  console.log('🗄️  Gerando Prisma client...')
  execSync('npx prisma generate', { stdio: 'inherit' })

  // 3. Compilar TypeScript
  console.log('⚙️  Compilando TypeScript...')
  execSync('npx tsc', { stdio: 'inherit' })

  // 4. Verificar se o arquivo foi gerado
  const workerPath = path.join(__dirname, 'dist', 'worker.js')
  if (!fs.existsSync(workerPath)) {
    throw new Error('Arquivo worker.js não foi gerado!')
  }

  console.log('✅ Build concluído com sucesso!')
  console.log('📁 Arquivos gerados em: dist/')

} catch (error) {
  console.error('❌ Erro durante o build:', error.message)
  process.exit(1)
}
