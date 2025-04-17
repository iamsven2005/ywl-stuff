import { PrismaClient as MainPrismaClient } from '@/prisma/generated/main'
import { PrismaClient as AnalyticsPrismaClient } from '@/prisma/generated/analytics'

declare global {
  // Extend global type for both clients
  var mainPrisma: MainPrismaClient | undefined
  var analyticsPrisma: AnalyticsPrismaClient | undefined
}

// Create instances or reuse from global
export const db =
  globalThis.mainPrisma || new MainPrismaClient()

export const db2 =
  globalThis.analyticsPrisma || new AnalyticsPrismaClient()

// Persist in global for development
if (process.env.NODE_ENV !== 'production') {
  globalThis.mainPrisma = db
  globalThis.analyticsPrisma = db2
}
