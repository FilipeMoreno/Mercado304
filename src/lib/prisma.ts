// import { PrismaClient } from '@prisma/client'
// import process from 'process'
// import { withOptimize } from "@prisma/extension-optimize";
// import { withAccelerate } from '@prisma/extension-accelerate'

// const globalForPrisma = globalThis as unknown as {
//   prisma: PrismaClient | undefined
// }

// export const prisma =
//   globalForPrisma.prisma ??
//   new PrismaClient({
//     log: ['query'],
//   }).$extends(
//   withOptimize({ apiKey: process.env.OPTIMIZE_API_KEY })).$extends(withAccelerate())

// if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  }).$extends(withAccelerate())

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma