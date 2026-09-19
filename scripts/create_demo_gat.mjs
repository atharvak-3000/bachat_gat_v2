import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

function toP(rupees) {
  return Math.round(rupees * 100)
}

async function main() {
  console.log('🚀 Setting up Demo Bachat Gat & Members on MySQL Database...')

  const groupCode = 'TEJAS1'
  const password = 'Password@123'
  const passwordHash = await bcrypt.hash(password, 10)

  // 1. Check or clean existing demo org with this code
  let org = await prisma.organization.findUnique({
    where: { groupCode }
  })

  if (org) {
    console.log(`ℹ️ Existing demo organization found with code ${groupCode} (ID: ${org.id}). Updating...`)
    org = await prisma.organization.update({
      where: { id: org.id },
      data: {
        name: 'तेजस्विनी महिला बचत गट',
        village: 'शिवाजी नगर',
        taluka: 'पुणे शहर',
        district: 'पुणे',
        monthlySavingAmount: BigInt(toP(500)),
        defaultInterestRate: 2.0,
        defaultPenaltyAmount: BigInt(toP(50)),
        maxLoanLimit: BigInt(toP(50000)),
        isApproved: true,
        subscriptionStatus: 'ACTIVE',
        subscriptionPlan: 'FREE',
        maxMembers: 999999,
      }
    })
  } else {
    org = await prisma.organization.create({
      data: {
        name: 'तेजस्विनी महिला बचत गट',
        groupCode: groupCode,
        village: 'शिवाजी नगर',
        taluka: 'पुणे शहर',
        district: 'पुणे',
        monthlySavingAmount: BigInt(toP(500)),
        defaultInterestRate: 2.0,
        defaultPenaltyAmount: BigInt(toP(50)),
        maxLoanLimit: BigInt(toP(50000)),
        meetingFrequency: 'MONTHLY',
        isApproved: true,
        subscriptionStatus: 'ACTIVE',
        subscriptionPlan: 'FREE',
        maxMembers: 999999,
      }
    })
    console.log(`✅ Organization created: ${org.name} (Code: ${org.groupCode})`)
  }

  // 2. Admin Member: Sunita Patil
  let admin = await prisma.member.findFirst({
    where: { organizationId: org.id, phone: '9876500001' }
  })

  if (!admin) {
    admin = await prisma.member.create({
      data: {
        organizationId: org.id,
        name: 'सुनिता सुरेश पाटील (Sunita Patil)',
        nameMarathi: 'सुनिता सुरेश पाटील',
        phone: '9876500001',
        email: 'sunita.patil@bachatgat.com',
        passwordHash,
        memberNumber: 1,
        role: 'SUPERADMIN',
        isActive: true,
        status: 'ACTIVE',
      }
    })
    console.log(`✅ Admin Member created: ${admin.name} (Phone: 9876500001)`)
  } else {
    await prisma.member.update({
      where: { id: admin.id },
      data: { passwordHash, isActive: true, status: 'ACTIVE', role: 'SUPERADMIN' }
    })
    console.log(`✅ Admin Member updated: ${admin.name}`)
  }

  // 3. Regular Member 1: Anita Joshi
  let member1 = await prisma.member.findFirst({
    where: { organizationId: org.id, phone: '9876500002' }
  })

  if (!member1) {
    member1 = await prisma.member.create({
      data: {
        organizationId: org.id,
        name: 'अनिता रमेश जोशी (Anita Joshi)',
        nameMarathi: 'अनिता रमेश जोशी',
        phone: '9876500002',
        passwordHash,
        memberNumber: 2,
        role: 'MEMBER',
        isActive: true,
        status: 'ACTIVE',
      }
    })
    console.log(`✅ Member 1 created: ${member1.name} (Phone: 9876500002)`)
  } else {
    await prisma.member.update({
      where: { id: member1.id },
      data: { passwordHash, isActive: true, status: 'ACTIVE' }
    })
    console.log(`✅ Member 1 updated: ${member1.name}`)
  }

  // 4. Regular Member 2: Priya Kamble
  let member2 = await prisma.member.findFirst({
    where: { organizationId: org.id, phone: '9876500003' }
  })

  if (!member2) {
    member2 = await prisma.member.create({
      data: {
        organizationId: org.id,
        name: 'प्रिया गणेश कांबळे (Priya Kamble)',
        nameMarathi: 'प्रिया गणेश कांबळे',
        phone: '9876500003',
        passwordHash,
        memberNumber: 3,
        role: 'MEMBER',
        isActive: true,
        status: 'ACTIVE',
      }
    })
    console.log(`✅ Member 2 created: ${member2.name} (Phone: 9876500003)`)
  } else {
    await prisma.member.update({
      where: { id: member2.id },
      data: { passwordHash, isActive: true, status: 'ACTIVE' }
    })
    console.log(`✅ Member 2 updated: ${member2.name}`)
  }

  // 5. Sample Meeting 1 (Finalized with Closing Date)
  let m1 = await prisma.meeting.findFirst({
    where: { organizationId: org.id, monthYear: '2026-08' }
  })

  if (!m1) {
    const meetingDate = new Date('2026-08-10')
    const closingDate = new Date('2026-08-10')
    m1 = await prisma.meeting.create({
      data: {
        organizationId: org.id,
        monthYear: '2026-08',
        meetingDate,
        closingDate,
        openingBalance: BigInt(toP(10000)),
        status: 'FINALIZED',
        notes: 'ऑगस्ट २०२६ ची पहिली मासिक सभा (पहिली बैठक)',
      }
    })

    // Add contributions for m1
    await prisma.meetingContribution.createMany({
      data: [
        {
          meetingId: m1.id,
          memberId: admin.id,
          savingsAmount: BigInt(toP(500)),
          loanRepayment: BigInt(0),
          interestPaid: BigInt(0),
          penaltyPaid: BigInt(0),
          otherAmount: BigInt(0),
          isPresent: true,
        },
        {
          meetingId: m1.id,
          memberId: member1.id,
          savingsAmount: BigInt(toP(500)),
          loanRepayment: BigInt(0),
          interestPaid: BigInt(0),
          penaltyPaid: BigInt(0),
          otherAmount: BigInt(0),
          isPresent: true,
        },
        {
          meetingId: m1.id,
          memberId: member2.id,
          savingsAmount: BigInt(toP(500)),
          loanRepayment: BigInt(0),
          interestPaid: BigInt(0),
          penaltyPaid: BigInt(0),
          otherAmount: BigInt(0),
          isPresent: true,
        },
      ]
    })
    console.log(`✅ Meeting 1 (Finalized) created with date 2026-08-10, Closing Date 2026-08-10`)
  }

  // 6. Sample Loan for Member 1 (Approved & Active)
  const existingLoan = await prisma.loan.findFirst({
    where: { memberId: member1.id }
  })

  if (!existingLoan) {
    const loan = await prisma.loan.create({
      data: {
        organizationId: org.id,
        memberId: member1.id,
        loanAmount: BigInt(toP(10000)),
        outstandingAmount: BigInt(toP(10000)),
        interestRate: 2.0,
        termMonths: 10,
        purpose: 'लहान व्यवसाय / शिवणकाम साहित्य',
        status: 'ACTIVE',
        approvedBy: admin.id,
        approvedAt: new Date('2026-08-10'),
        disbursedDate: new Date('2026-08-10'),
      }
    })
    console.log(`✅ Sample Loan created: ₹10,000 for ${member1.name} (Status: ACTIVE)`)
  }

  console.log('\n=============================================')
  console.log('🎉 DEMO ACCOUNTS READY!')
  console.log('=============================================')
  console.log(`Group Name:  ${org.name}`)
  console.log(`Group Code:  ${org.groupCode}`)
  console.log(`Live URL:    https://bachat-gat-online.vercel.app/`)
  console.log('---------------------------------------------')
  console.log('ADMIN LOGIN CREDENTIALS:')
  console.log('Phone:       9876500001')
  console.log('Password:    Password@123')
  console.log('Role:        Gat Admin / President')
  console.log('---------------------------------------------')
  console.log('MEMBER 1 LOGIN CREDENTIALS:')
  console.log('Phone:       9876500002')
  console.log('Group Code:  TEJAS1')
  console.log('Password:    Password@123')
  console.log('Role:        Member (Active Loan: ₹10,000)')
  console.log('---------------------------------------------')
  console.log('MEMBER 2 LOGIN CREDENTIALS:')
  console.log('Phone:       9876500003')
  console.log('Group Code:  TEJAS1')
  console.log('Password:    Password@123')
  console.log('Role:        Member')
  console.log('=============================================')
}

main()
  .catch((e) => {
    console.error('❌ Error executing script:', e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
