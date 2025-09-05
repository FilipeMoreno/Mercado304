import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'
import { withOptimize } from '@prisma/extension-optimize'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Cria a instância base do Prisma Client
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['query'],
  })
  .$extends(withAccelerate())
  // .$extends(withOptimize({
  //   apiKey: process.env.OPTIMIZE_API_KEY || '',
  // }));
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const prismaBase = globalForPrisma.prisma ?? prismaClientSingleton()

export const prisma = prismaBase as unknown as PrismaClient

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prismaBase as any
}