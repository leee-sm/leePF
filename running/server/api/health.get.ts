import { prisma } from '../utils/prisma'

export default defineEventHandler(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'UP', database: 'UP' }
  } catch {
    return { status: 'DOWN', database: 'DOWN' }
  }
})
