// render/test-connection.js
// Script para testar conexões localmente

const { Queue } = require('bullmq')

async function testRedisConnection() {
  console.log('🔍 Testando conexão com Redis...')

  const connection = {
    host: process.env.UPSTASH_REDIS_HOST || 'localhost',
    port: parseInt(process.env.UPSTASH_REDIS_PORT || '6379', 10),
    password: process.env.UPSTASH_REDIS_PASSWORD || '',
  }

  console.log('📡 Configuração Redis:', {
    host: connection.host,
    port: connection.port,
    hasPassword: !!connection.password
  })

  try {
    const testQueue = new Queue('test-connection', { connection })

    console.log('⏳ Tentando conectar...')
    await testQueue.getWaiting()

    console.log('✅ Conexão com Redis bem-sucedida!')
    await testQueue.close()

    return true
  } catch (error) {
    console.error('❌ Erro ao conectar com Redis:', error.message)
    console.error('Stack trace:', error.stack)

    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Possíveis soluções:')
      console.error('1. Verifique se as variáveis de ambiente estão configuradas')
      console.error('2. Verifique se o Redis/Upstash está acessível')
      console.error('3. Verifique se a senha está correta')
    }

    return false
  }
}

async function testDatabaseConnection() {
  console.log('\n🔍 Testando conexão com banco de dados...')

  try {
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()

    console.log('⏳ Tentando conectar...')
    await prisma.$queryRaw`SELECT 1`

    console.log('✅ Conexão com banco bem-sucedida!')
    await prisma.$disconnect()

    return true
  } catch (error) {
    console.error('❌ Erro ao conectar com banco:', error.message)
    console.error('Stack trace:', error.stack)

    console.error('\n💡 Possíveis soluções:')
    console.error('1. Verifique se DATABASE_URL está configurado')
    console.error('2. Verifique se o banco está acessível')
    console.error('3. Execute: npx prisma generate')

    return false
  }
}

async function main() {
  console.log('🚀 Testando conexões do worker...\n')

  // Carregar variáveis de ambiente
  require('dotenv').config()

  const redisOk = await testRedisConnection()
  const dbOk = await testDatabaseConnection()

  console.log('\n📊 Resumo dos testes:')
  console.log(`Redis: ${redisOk ? '✅ OK' : '❌ FALHOU'}`)
  console.log(`Banco: ${dbOk ? '✅ OK' : '❌ FALHOU'}`)

  if (redisOk && dbOk) {
    console.log('\n🎉 Todas as conexões estão funcionando!')
    console.log('Você pode iniciar o worker com: npm run dev')
  } else {
    console.log('\n⚠️  Algumas conexões falharam. Verifique as configurações.')
    process.exit(1)
  }
}

main().catch(console.error)
