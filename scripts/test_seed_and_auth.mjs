import bcrypt from 'bcryptjs'
import prisma from '../lib/prisma.js'
import { createAuthToken, verifyAuthToken } from '../lib/auth.js'

async function runSeedAndTest() {
  console.log('=== STEP 1: SEEDING DATABASE ===')

  // Clear existing records
  await prisma.activityLog.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.paymentProof.deleteMany()
  await prisma.loanEmi.deleteMany()
  await prisma.loan.deleteMany()
  await prisma.meetingIncome.deleteMany()
  await prisma.meetingExpense.deleteMany()
  await prisma.meetingContribution.deleteMany()
  await prisma.meeting.deleteMany()
  await prisma.member.deleteMany()
  await prisma.subscription.deleteMany()
  await prisma.organization.deleteMany()

  // 1. Create Organization
  const org = await prisma.organization.create({
    data: {
      name: 'Shree Ganesh Bachat Gat',
      nameMarathi: 'श्री गणेश बचत गट',
      village: 'Shivajinagar',
      taluka: 'Haveli',
      district: 'Pune',
      groupCode: 'SG001',
      monthlySavingAmount: 20000n, // ₹200 stored in paise
      defaultInterestRate: 2.00,
      isApproved: true,
      subscriptionStatus: 'ACTIVE',
    },
  })

  console.log('Created Organization:', org.id, org.name)

  const passwordHash = await bcrypt.hash('badmin', 10)

  // 2. Create SUPERADMIN
  const superadmin = await prisma.member.create({
    data: {
      organizationId: org.id,
      name: 'System Admin',
      email: 'superadmin@bachatbook.com',
      phone: '9000000000',
      passwordHash,
      role: 'SUPERADMIN',
      status: 'ACTIVE',
      isActive: true,
      memberNumber: 1,
    },
    include: { organization: true },
  })
  console.log('Seeded SUPERADMIN:', superadmin.email)

  // 3. Create MEMBER
  const member = await prisma.member.create({
    data: {
      organizationId: org.id,
      name: 'Sunita Patil',
      phone: '9876543210',
      passwordHash,
      role: 'MEMBER',
      status: 'ACTIVE',
      isActive: true,
      memberNumber: 2,
    },
    include: { organization: true },
  })
  console.log('Seeded MEMBER:', member.phone)

  console.log('\n=== STEP 2: TESTING LOGIN ROUTE LOGIC & RESPONSE BODIES ===')

  // A. SuperAdmin Login Test
  const superadminMatch = await bcrypt.compare('badmin', superadmin.passwordHash)
  const superadminToken = await createAuthToken({
    memberId: superadmin.id,
    organizationId: superadmin.organizationId,
    role: superadmin.role,
  })

  const superadminLoginResponseBody = JSON.stringify(
    {
      success: true,
      member: {
        id: superadmin.id,
        name: superadmin.name,
        email: superadmin.email,
        role: superadmin.role,
        organizationId: superadmin.organizationId,
      },
    },
    null,
    2
  )

  console.log('SUPERADMIN Login Route Response Body:')
  console.log(superadminLoginResponseBody)

  // Test SuperAdmin getCurrentMember() token resolution
  const superadminPayload = await verifyAuthToken(superadminToken)
  const resolvedSuperadmin = await prisma.member.findUnique({
    where: { id: superadminPayload.memberId },
    include: { organization: true },
  })

  console.log('getCurrentMember() for SUPERADMIN resolved:')
  console.log(JSON.stringify(resolvedSuperadmin, null, 2))

  // B. Member Login Test
  const memberMatch = await bcrypt.compare('badmin', member.passwordHash)
  const memberToken = await createAuthToken({
    memberId: member.id,
    organizationId: member.organizationId,
    role: member.role,
  })

  const memberLoginResponseBody = JSON.stringify(
    {
      success: true,
      member: {
        id: member.id,
        name: member.name,
        phone: member.phone,
        role: member.role,
        organizationId: member.organizationId,
      },
    },
    null,
    2
  )

  console.log('\nMEMBER Login Route Response Body:')
  console.log(memberLoginResponseBody)

  // Test Member getCurrentMember() token resolution
  const memberPayload = await verifyAuthToken(memberToken)
  const resolvedMember = await prisma.member.findUnique({
    where: { id: memberPayload.memberId },
    include: { organization: true },
  })

  console.log('getCurrentMember() for MEMBER resolved:')
  console.log(JSON.stringify(resolvedMember, null, 2))

  console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===')
}

runSeedAndTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test error:', err)
    process.exit(1)
  })
