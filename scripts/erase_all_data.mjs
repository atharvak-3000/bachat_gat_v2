import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function eraseAllData() {
  console.log('⚠️  PURGING ALL DATA FROM MYSQL DATABASE...')
  
  try {
    // 1. Temporarily disable foreign key constraints
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;')
    console.log('🔒 Foreign key checks disabled.')

    // 2. Fetch all table names dynamically
    const tables = await prisma.$queryRawUnsafe('SHOW TABLES;')
    const tableNames = tables.map(t => Object.values(t)[0])
    console.log(`📋 Tables found (${tableNames.length}):`, tableNames.join(', '))

    // 3. Truncate each table
    for (const table of tableNames) {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${table}\`;`)
        console.log(`  🗑️ Truncated table: ${table}`)
      } catch (tableErr) {
        // Fallback to DELETE if TRUNCATE has foreign key restriction
        await prisma.$executeRawUnsafe(`DELETE FROM \`${table}\`;`)
        console.log(`  🗑️ Cleared (DELETE) table: ${table}`)
      }
    }

    // 4. Re-enable foreign key constraints
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;')
    console.log('🔓 Foreign key checks re-enabled.')

    // 5. Verify row counts are all 0
    console.log('\n📊 Verifying row counts across all tables:')
    let totalRowsRemaining = 0
    for (const table of tableNames) {
      const countRes = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as cnt FROM \`${table}\`;`)
      const cnt = Number(countRes[0].cnt)
      totalRowsRemaining += cnt
      console.log(`   - ${table}: ${cnt} rows`)
    }

    if (totalRowsRemaining === 0) {
      console.log('\n✅ DATABASE PURGED COMPLETELY! All tables are empty (0 rows).')
    } else {
      console.log(`\n⚠️ Finished with ${totalRowsRemaining} rows remaining.`)
    }
  } catch (error) {
    console.error('❌ Error during purge:', error)
  } finally {
    await prisma.$disconnect()
  }
}

eraseAllData()
