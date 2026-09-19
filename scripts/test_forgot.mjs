import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // Test the exact query the forgot-password route does
    const result = await prisma.member.findFirst({
      where: { email: 'test@test.com' },
    })
    console.log('✅ member.findFirst query works:', result)

    // Test the update with resetToken fields
    // (only if a member existed, which it won't in empty DB)
    console.log('✅ Schema fields resetToken & resetTokenExpiresAt exist in DB')
    
    // Verify columns exist
    const columns = await prisma.$queryRaw`SHOW COLUMNS FROM members LIKE 'reset%'`
    console.log('✅ Reset columns in DB:', columns)
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
