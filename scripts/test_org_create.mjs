import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Testing POST /api/organizations flow...')
    
    // Generate group code
    const groupCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    console.log('Group code:', groupCode)

    const passwordHash = await bcrypt.hash('test123', 10)

    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: 'Test Org',
          groupCode,
          village: 'Test Village',
          taluka: '',
          district: 'Test District',
          monthlySavingAmount: BigInt(10000),
          defaultInterestRate: 2.0,
          defaultPenaltyAmount: BigInt(0),
          maxLoanLimit: BigInt(0),
          meetingFrequency: 'MONTHLY',
          isApproved: true,
          subscriptionStatus: 'ACTIVE',
        },
      })
      console.log('✅ Organization created:', org.id)

      const member = await tx.member.create({
        data: {
          organizationId: org.id,
          name: 'Test Admin',
          phone: '9999999999',
          email: 'test@test.com',
          passwordHash,
          memberNumber: 1,
          role: 'SUPERADMIN',
          isActive: true,
          status: 'ACTIVE',
        },
      })
      console.log('✅ Member created:', member.id)

      return { org, member }
    })

    console.log('✅ Transaction successful!')
    console.log('Org ID:', result.org.id)
    console.log('Member ID:', result.member.id)

    // Clean up
    await prisma.member.delete({ where: { id: result.member.id } })
    await prisma.organization.delete({ where: { id: result.org.id } })
    console.log('✅ Cleanup done')

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Full error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
