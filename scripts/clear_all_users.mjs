import { prisma } from '../lib/prisma.ts'

async function clearAllUsersAndData() {
  console.log('=== PURGING ALL EXISTING USERS & DATA FROM DATABASE ===')

  const logsDeleted = await prisma.activityLog.deleteMany()
  console.log('Deleted Activity Logs:', logsDeleted.count)

  const notificationsDeleted = await prisma.notification.deleteMany()
  console.log('Deleted Notifications:', notificationsDeleted.count)

  const paymentProofsDeleted = await prisma.paymentProof.deleteMany()
  console.log('Deleted Payment Proofs:', paymentProofsDeleted.count)

  const loanEmisDeleted = await prisma.loanEmi.deleteMany()
  console.log('Deleted Loan EMIs:', loanEmisDeleted.count)

  const loansDeleted = await prisma.loan.deleteMany()
  console.log('Deleted Loans:', loansDeleted.count)

  const meetingIncomesDeleted = await prisma.meetingIncome.deleteMany()
  console.log('Deleted Meeting Income:', meetingIncomesDeleted.count)

  const meetingExpensesDeleted = await prisma.meetingExpense.deleteMany()
  console.log('Deleted Meeting Expenses:', meetingExpensesDeleted.count)

  const meetingContribsDeleted = await prisma.meetingContribution.deleteMany()
  console.log('Deleted Meeting Contributions:', meetingContribsDeleted.count)

  const meetingsDeleted = await prisma.meeting.deleteMany()
  console.log('Deleted Meetings:', meetingsDeleted.count)

  const membersDeleted = await prisma.member.deleteMany()
  console.log('Deleted Members:', membersDeleted.count)

  const subscriptionsDeleted = await prisma.subscription.deleteMany()
  console.log('Deleted Subscriptions:', subscriptionsDeleted.count)

  const orgsDeleted = await prisma.organization.deleteMany()
  console.log('Deleted Organizations:', orgsDeleted.count)

  console.log('\n=== ALL EXISTING USERS & ORGANIZATIONS PURGED SUCCESSFULLY! ===')
}

clearAllUsersAndData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error clearing data:', err)
    process.exit(1)
  })
