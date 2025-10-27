/**
 * Adapter para usar BullMQ com Valkey Glide
 * 
 * IMPORTANTE: BullMQ requer IORedis, mas podemos usar ioredis
 * com a URL do Valkey da AWS, já que Valkey é compatível com Redis.
 * 
 * Este arquivo mantém a compatibilidade com BullMQ usando ioredis
 * conectado ao endpoint Valkey da AWS.
 */

import IORedis from "ioredis"

export interface ValkeyConnectionOptions {
  host?: string
  port?: number
  password?: string
  tls?: boolean
  maxRetriesPerRequest?: number
  enableReadyCheck?: boolean
  lazyConnect?: boolean
  keepAlive?: number
  connectTimeout?: number
  commandTimeout?: number
}

export function createValkeyConnection(options?: ValkeyConnectionOptions) {
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379"
  
  // Parsear URL se for fornecida
  if (redisUrl) {
    try {
      const url = new URL(redisUrl)
      const useTLS = options?.tls ?? (url.protocol === "rediss:" || url.protocol === "https:")
      
      const config = {
        host: options?.host || url.hostname,
        port: options?.port || parseInt(url.port || "6379", 10),
        password: options?.password || url.password || undefined,
        useTLS,
        maxRetriesPerRequest: options?.maxRetriesPerRequest ?? null,
        enableReadyCheck: options?.enableReadyCheck ?? false,
        lazyConnect: options?.lazyConnect ?? true,
        keepAlive: options?.keepAlive ?? 60000,
        connectTimeout: options?.connectTimeout ?? 20000,
        commandTimeout: options?.commandTimeout ?? 5000,
      }
      
      console.log(`Creating IORedis connection to Valkey at ${config.host}:${config.port}`)
      
      const ioredisConfig: any = {
        host: config.host,
        port: config.port,
        password: config.password,
        maxRetriesPerRequest: config.maxRetriesPerRequest as any,
        enableReadyCheck: config.enableReadyCheck,
        lazyConnect: config.lazyConnect,
        keepAlive: config.keepAlive,
        connectTimeout: config.connectTimeout,
        retryStrategy(times: number) {
          const delay = Math.min(times * 50, 2000)
          return delay
        },
        reconnectOnError(err: Error) {
          console.error("Redis/Valkey connection error:", err.message)
          return true // Sempre tentar reconectar
        },
      }
      
      if (config.useTLS) {
        ioredisConfig.tls = {
          // Para TLS com Valkey da AWS
          rejectUnauthorized: false, // Aceitar certificados auto-assinados
          servername: config.host,
        }
      }
      
      return new IORedis(ioredisConfig)
    } catch (error) {
      console.error("Error parsing REDIS_URL:", error)
      throw error
    }
  }
  
  // Fallback para configuração padrão
  const fallbackConfig: any = {
    host: "localhost",
    port: 6379,
    ...options,
  }
  
  return new IORedis(fallbackConfig)
}

/**
 * Cria uma conexão IORedis compatível com BullMQ
 * Esta conexão será usada para conectar ao Valkey da AWS
 */
export function createBullMQConnection(): IORedis {
  return createValkeyConnection({
    maxRetriesPerRequest: null as any,
    enableReadyCheck: false,
    lazyConnect: true,
    keepAlive: 60000,
    connectTimeout: 20000,
    commandTimeout: 5000,
  })
}

