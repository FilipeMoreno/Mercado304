// render/src/health.ts
// Health check endpoint para Railway

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function healthCheck(): Promise<{ status: string; timestamp: string; services: any }> {
  const timestamp = new Date().toISOString()
  
  try {
    // Verificar conexão com o banco
    await prisma.$queryRaw`SELECT 1`
    
    return {
      status: 'healthy',
      timestamp,
      services: {
        database: 'connected',
        redis: process.env.UPSTASH_REDIS_HOST ? 'configured' : 'not_configured'
      }
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp,
      services: {
        database: 'disconnected',
        redis: process.env.UPSTASH_REDIS_HOST ? 'configured' : 'not_configured',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}
