import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔌 Testing database connection...')
  console.log(`📍 DATABASE_URL: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@')}`)
  console.log('')

  try {
    // Test 1: Basic connectivity
    const start = Date.now()
    await prisma.$connect()
    const connectTime = Date.now() - start
    console.log(`✅ Connection established (${connectTime}ms)`)

    // Test 2: Simple query
    const queryStart = Date.now()
    const result = await prisma.$queryRaw`SELECT 1 as ping`
    const queryTime = Date.now() - queryStart
    console.log(`✅ Query executed successfully (${queryTime}ms)`)

    // Test 3: Check database version
    const versionResult = await prisma.$queryRaw`SELECT VERSION() as version`
    console.log(`✅ MySQL Version: ${versionResult[0].version}`)

    // Test 4: List tables
    const tables = await prisma.$queryRaw`SHOW TABLES`
    const tableNames = tables.map(t => Object.values(t)[0])
    console.log(`✅ Tables found: ${tableNames.length}`)
    tableNames.forEach(t => console.log(`   - ${t}`))

    // Test 5: Quick row counts for key tables
    console.log('')
    console.log('📊 Row counts:')
    for (const table of tableNames.slice(0, 10)) {
      try {
        const count = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as cnt FROM \`${table}\``)
        console.log(`   ${table}: ${count[0].cnt} rows`)
      } catch (e) {
        console.log(`   ${table}: ❌ error reading`)
      }
    }

    console.log('')
    console.log('🎉 All database connection tests passed!')
  } catch (error) {
    console.error('')
    console.error('❌ Database connection FAILED!')
    console.error(`   Error: ${error.message}`)
    if (error.code) console.error(`   Code: ${error.code}`)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
