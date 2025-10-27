import { GlideClusterClient, Logger } from "@valkey/valkey-glide"

// Configurar nível de log
Logger.setLoggerConfig("info")

interface ValkeyConfig {
  host: string
  port: number
  useTLS?: boolean
}

let client: GlideClusterClient | null = null

export async function getValkeyClient(): Promise<GlideClusterClient> {
  if (!client) {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379"
    
    // Parsear URL do Redis para extrair host e porta
    const url = new URL(redisUrl)
    const host = url.hostname
    const port = parseInt(url.port || "6379", 10)
    
    console.log("Connecting to Valkey Glide...")
    
    try {
      // Criar cliente Valkey Glide
      client = await GlideClusterClient.createClient({
        addresses: [{ host, port }],
        useTLS: url.protocol === "rediss:" || url.protocol === "https:",
      })
      
      console.log("Connected successfully to Valkey Glide")
    } catch (error) {
      console.error("Error connecting to Valkey Glide:", error)
      throw error
    }
  }
  
  return client
}

export async function closeValkeyClient(): Promise<void> {
  if (client) {
    try {
      client.close()
      console.log("Valkey Glide client connection closed.")
      client = null
    } catch (error) {
      console.error("Error closing Valkey Glide client:", error)
      throw error
    }
  }
}

// Funções auxiliares para operações comuns
export async function ping(): Promise<string> {
  const client = await getValkeyClient()
  const result = await client.ping()
  return typeof result === 'string' ? result : String(result)
}

export async function set(key: string, value: string): Promise<void> {
  const client = await getValkeyClient()
  await client.set(key, value)
}

export async function get(key: string): Promise<string | null> {
  const client = await getValkeyClient()
  const result = await client.get(key)
  return result ? String(result) : null
}

export async function del(key: string): Promise<void> {
  const client = await getValkeyClient()
  await client.del([key])
}

export async function exists(key: string): Promise<number> {
  const client = await getValkeyClient()
  return await client.exists([key])
}

export async function expire(key: string, seconds: number): Promise<void> {
  const client = await getValkeyClient()
  await client.expire(key, seconds)
}

export async function ttl(key: string): Promise<number> {
  const client = await getValkeyClient()
  return await client.ttl(key)
}

