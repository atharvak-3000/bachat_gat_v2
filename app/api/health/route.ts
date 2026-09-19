import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  const checks: Record<string, any> = {
    timestamp: new Date().toISOString(),
    env_database_url: process.env.DATABASE_URL
      ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ":****@")
      : "NOT SET",
  }

  try {
    await prisma.$connect()
    checks.db_connection = "OK"

    const result = await prisma.$queryRaw`SELECT 1 as ping`
    checks.db_query = "OK"

    const tables = await prisma.$queryRaw`SHOW TABLES`
    checks.tables = (tables as any[]).map((t: any) => Object.values(t)[0])
    checks.table_count = checks.tables.length
  } catch (error: any) {
    checks.db_connection = "FAILED"
    checks.db_error = error.message
    checks.db_error_code = error.code
  } finally {
    await prisma.$disconnect()
  }

  return NextResponse.json(checks)
}
