import { redirect } from "next/navigation"
import { requireAdminOrAbove, toSafeMember } from "@/lib/auth"
import prisma from "@/lib/prisma"
import type { ActivityLog, Member, Meeting, Loan, LoanEmi } from "@/types"
import { getCurrentMonthYear, calcMeetingTotals } from "@/lib/calculations"
import DashboardClient from "./DashboardClient"

export default async function DashboardPage() {
  let performer
  try {
    performer = await requireAdminOrAbove()
  } catch {
    redirect("/sign-in")
  }

  const [allMembers, meetings, loans, recentLogs, expenses, incomes] = await Promise.all([
    prisma.member.findMany({
      where: { organizationId: performer.organization_id },
      orderBy: { memberNumber: "asc" },
    }),
    prisma.meeting.findMany({
      where: { organizationId: performer.organization_id },
      orderBy: { monthYear: "desc" },
    }),
    prisma.loan.findMany({
      where: { organizationId: performer.organization_id },
      include: { member: true },
    }),
    prisma.activityLog.findMany({
      where: { organizationId: performer.organization_id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.meetingExpense.findMany(),
    prisma.meetingIncome.findMany(),
  ])

  const safeMembersList = allMembers.map((m: any) => toSafeMember(m)) as unknown as Member[]
  const meetingsList = meetings.map((m: any) => ({
    ...m,
    organization_id: m.organizationId,
    month_year: m.monthYear,
    meeting_date: m.meetingDate.toISOString().split("T")[0],
    opening_balance: Number(m.openingBalance),
    created_at: m.createdAt.toISOString(),
  })) as unknown as Meeting[]

  const loansList = loans.map((l: any) => ({
    ...l,
    organization_id: l.organizationId,
    member_id: l.memberId,
    loan_amount: Number(l.loanAmount),
    outstanding_amount: Number(l.outstandingAmount),
    interest_rate: Number(l.interestRate),
    disbursed_date: l.disbursedDate.toISOString().split("T")[0],
    term_months: l.termMonths,
    created_at: l.createdAt.toISOString(),
    member: toSafeMember(l.member),
  })) as unknown as (Loan & { member: Member })[]

  const logsList = recentLogs.map((log: any) => ({
    ...log,
    organization_id: log.organizationId,
    performed_by: log.performedBy,
    entity_type: log.entityType,
    entity_id: log.entityId,
    created_at: log.createdAt.toISOString(),
  })) as unknown as ActivityLog[]

  const activeMembers = safeMembersList.filter((m: any) => m.status === "ACTIVE" && m.is_active)
  const pendingMembers = safeMembersList.filter((m: any) => m.status === "PENDING")

  const exps = expenses.map((e: any) => ({ meeting_id: e.meetingId, amount: Number(e.amount) }))
  const incs = incomes.map((i: any) => ({ meeting_id: i.meetingId, amount: Number(i.amount) }))

  const memberIds = activeMembers.map((m: any) => m.id)
  let allContributions: any[] = []

  if (memberIds.length > 0) {
    const contribs = await prisma.meetingContribution.findMany({
      where: { memberId: { in: memberIds } },
    })
    allContributions = contribs.map((c: any) => ({
      savings_amount: Number(c.savingsAmount),
      penalty_paid: Number(c.penaltyPaid),
      loan_repayment: Number(c.loanRepayment),
      interest_paid: Number(c.interestPaid),
      other_amount: Number(c.otherAmount),
      meeting_id: c.meetingId,
      is_present: c.isPresent,
    }))
  }

  let totalCorpus = 0

  const finalizedMeetings = meetingsList
    .filter((m: any) => m.status === "FINALIZED")
    .sort((a: any, b: any) => new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime())

  if (finalizedMeetings.length > 0) {
    const latestMeeting = finalizedMeetings[0]

    const latestContribs = await prisma.meetingContribution.findMany({
      where: { meetingId: latestMeeting.id },
    })

    const latestExps = exps
      .filter((e: any) => e.meeting_id === latestMeeting.id)
      .reduce((sum: number, e: any) => sum + e.amount, 0)

    const latestIncs = incs
      .filter((i: any) => i.meeting_id === latestMeeting.id)
      .reduce((sum: number, i: any) => sum + i.amount, 0)

    const latestLoans = loansList
      .filter((l: any) => l.disbursed_date === latestMeeting.meeting_date && ["ACTIVE", "CLOSED"].includes(l.status))
      .reduce((sum: number, l: any) => sum + l.loan_amount, 0)

    const totals = calcMeetingTotals({
      opening_balance: latestMeeting.opening_balance,
      contributions: latestContribs.map((c: any) => ({
        savings_amount: Number(c.savingsAmount),
        loan_repayment: Number(c.loanRepayment),
        interest_paid: Number(c.interestPaid),
        penalty_paid: Number(c.penaltyPaid),
        other_amount: Number(c.otherAmount),
        is_present: c.isPresent,
      })),
      loans_issued_total: latestLoans,
      other_expenses_total: latestExps,
      other_income_total: latestIncs,
    })

    totalCorpus = totals.closing_balance
  }

  const activeLoans = loansList.filter((l: any) => l.status === "ACTIVE")
  const pendingLoans = loansList.filter((l: any) => l.status === "PENDING")
  const totalOutstanding = activeLoans.reduce((sum: number, l: any) => sum + (l.outstanding_amount || 0), 0)

  const currentMonth = getCurrentMonthYear()
  const currentMeeting = meetingsList.find((m: any) => m.month_year === currentMonth)
  const pendingLoanCount = pendingLoans.length

  const todayStr = new Date().toISOString().split("T")[0]
  const overdueEmis = await prisma.loanEmi.findMany({
    where: {
      status: { not: "PAID" },
      dueDate: { lt: new Date(todayStr) },
    },
    select: { loanId: true, dueDate: true },
  })

  const overdueEmiList = overdueEmis.map((e: any) => ({
    loan_id: e.loanId,
    due_date: e.dueDate.toISOString().split("T")[0],
  }))

  const overdueLoansList = activeLoans
    .map((l: any) => {
      const loanOverdues = overdueEmiList.filter((e: any) => e.loan_id === l.id)
      if (loanOverdues.length === 0) return null

      const earliestDueDate = new Date(Math.min(...loanOverdues.map((e: any) => new Date(e.due_date).getTime())))
      const daysOverdue = Math.floor((Date.now() - earliestDueDate.getTime()) / 86400000)

      return {
        ...l,
        days_overdue: daysOverdue,
        overdue_count: loanOverdues.length,
      }
    })
    .filter(Boolean) as (Loan & { member: Member; days_overdue: number; overdue_count: number })[]

  const recentMeetings = meetingsList.slice(0, 5).map((m: any) => {
    const mContribs = allContributions.filter((c: any) => c.meeting_id === m.id)
    const mExps = exps.filter((e: any) => e.meeting_id === m.id).reduce((sum: number, e: any) => sum + e.amount, 0)
    const mIncs = incs.filter((i: any) => i.meeting_id === m.id).reduce((sum: number, i: any) => sum + i.amount, 0)

    const mLoans = loansList
      .filter((l: any) => l.disbursed_date === m.meeting_date && ["ACTIVE", "CLOSED"].includes(l.status))
      .reduce((sum: number, l: any) => sum + l.loan_amount, 0)

    const totals = calcMeetingTotals({
      opening_balance: m.opening_balance,
      contributions: mContribs,
      loans_issued_total: mLoans,
      other_expenses_total: mExps,
      other_income_total: mIncs,
    })

    return {
      ...m,
      total_collected: totals.total_receipts,
      closing_balance: totals.closing_balance,
    }
  })

  return (
    <DashboardClient
      performer={performer}
      activeMembers={activeMembers}
      pendingMembers={pendingMembers}
      totalCorpus={totalCorpus}
      totalOutstanding={totalOutstanding}
      activeLoans={activeLoans}
      pendingLoanCount={pendingLoanCount}
      currentMonth={currentMonth}
      currentMeeting={currentMeeting}
      overdueLoansList={overdueLoansList}
      recentMeetings={recentMeetings}
      logsList={logsList}
    />
  )
}
