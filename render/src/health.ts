// render/src/health.ts
// Health check endpoint para Railway

import { PrismaClient } from '@prisma/client'
import { Queue } from 'bullmq'

const prisma = new PrismaClient()

export async function healthCheck(): Promise<{ status: string; timestamp: string; services: any }> {
  const timestamp = new Date().toISOString()
  
  try {
    // Verificar conexão com o banco
    await prisma.$queryRaw`SELECT 1`
    
    // Verificar conexão com Redis
    let redisStatus = 'not_configured'
    if (process.env.UPSTASH_REDIS_HOST) {
      try {
        const testQueue = new Queue('health-check', {
          connection: {
            host: process.env.UPSTASH_REDIS_HOST,
            port: parseInt(process.env.UPSTASH_REDIS_PORT || '6379', 10),
            password: process.env.UPSTASH_REDIS_PASSWORD,
          }
        })
        
        // Testar conexão
        await testQueue.getWaiting()
        await testQueue.close()
        redisStatus = 'connected'
      } catch (redisError) {
        redisStatus = `error: ${redisError instanceof Error ? redisError.message : 'Unknown error'}`
      }
    }
    
    return {
      status: 'healthy',
      timestamp,
      services: {
        database: 'connected',
        redis: redisStatus,
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          uptime: Math.floor(process.uptime())
        }
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
