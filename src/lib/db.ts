import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Check if we're in production
const isProduction = process.env.NODE_ENV === 'production'

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isProduction ? ['error'] : ['query', 'error', 'warn'],
    // Use direct URL for serverless environments
    datasourceUrl: process.env.DATABASE_URL,
  })

if (!isProduction) globalForPrisma.prisma = prisma

// Also export as db for backward compatibility
export const db = prisma
