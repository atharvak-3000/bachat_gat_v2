import { PrismaClient } from '@prisma/client'

// Global BigInt JSON serialization fix
if (typeof (BigInt.prototype as any).toJSON !== 'function') {
  (BigInt.prototype as any).toJSON = function () {
    const num = Number(this)
    return Number.isSafeInteger(num) ? num : this.toString()
  }
}

/**
 * Recursively converts Prisma objects (BigInt, Decimal, Date) to plain JSON-serializable primitives.
 */
export function toPlainObject<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (typeof obj === 'bigint') {
    const num = Number(obj)
    return (Number.isSafeInteger(num) ? num : obj.toString()) as any
  }

  if (typeof obj === 'object') {
    // Decimal instance check (Prisma Decimal has toNumber function or d, e, s properties)
    if ('toNumber' in obj && typeof (obj as any).toNumber === 'function') {
      return (obj as any).toNumber()
    }

    if (obj instanceof Date) {
      return obj.toISOString() as any
    }

    if (Array.isArray(obj)) {
      return obj.map(toPlainObject) as any
    }

    const plainObj: Record<string, any> = {}
    for (const [key, value] of Object.entries(obj)) {
      plainObj[key] = toPlainObject(value)
    }
    return plainObj as T
  }

  return obj
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
