import { redirect } from "next/navigation"
import { requireAuth, toSafeMember } from "@/lib/auth"
import prisma, { toPlainObject } from "@/lib/prisma"
import ReportsClient from "./ReportsClient"
import type { MeetingWithDetails, Member, LoanWithEmis, Organization } from "@/types"

export default async function ReportsPage() {
  let currentMember
  try {
    currentMember = await requireAuth()
  } catch {
    redirect("/sign-in")
  }

  const [meetingsData, membersData, loansData] = await Promise.all([
    prisma.meeting.findMany({
      where: { organizationId: currentMember.organization_id },
      include: {
        contributions: {
          include: { member: true },
        },
        expenses: true,
        incomes: true,
      },
      orderBy: { meetingDate: "desc" },
    }),
    prisma.member.findMany({
      where: {
        organizationId: currentMember.organization_id,
        isActive: true,
      },
      orderBy: { memberNumber: "asc" },
    }),
    prisma.loan.findMany({
      where: { organizationId: currentMember.organization_id },
      include: {
        member: true,
        emis: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ])

  const safeMeetings = meetingsData.map((m: any) => ({
    ...m,
    organization_id: m.organizationId,
    month_year: m.monthYear,
    meeting_date: m.meetingDate.toISOString().split("T")[0],
    opening_balance: Number(m.openingBalance),
    created_at: m.createdAt.toISOString(),
    meeting_contributions: m.contributions.map((c: any) => ({
      ...c,
      meeting_id: c.meetingId,
      member_id: c.memberId,
      savings_amount: Number(c.savingsAmount),
      loan_repayment: Number(c.loanRepayment),
      interest_paid: Number(c.interestPaid),
      penalty_paid: Number(c.penaltyPaid),
      other_amount: Number(c.otherAmount),
      is_present: c.isPresent,
      member: toSafeMember(c.member),
    })),
    meeting_expenses: m.expenses.map((e: any) => ({
      ...e,
      meeting_id: e.meetingId,
      amount: Number(e.amount),
    })),
    meeting_income: (m.incomes || []).map((i: any) => ({
      ...i,
      meeting_id: i.meetingId,
      amount: Number(i.amount),
    })),
  }))

  const safeMembers = membersData.map((m: any) => toSafeMember(m))

  const safeLoans = loansData.map((l: any) => ({
    ...l,
    organization_id: l.organizationId,
    member_id: l.memberId,
    guarantor_id: l.guarantorId,
    loan_amount: Number(l.loanAmount),
    outstanding_amount: Number(l.outstandingAmount),
    interest_rate: Number(l.interestRate),
    disbursed_date: l.disbursedDate.toISOString().split("T")[0],
    term_months: l.termMonths,
    created_at: l.createdAt.toISOString(),
    member: toSafeMember(l.member),
    loan_emis: l.emis.map((e: any) => ({
      ...e,
      loan_id: e.loanId,
      month_year: e.monthYear,
      due_date: e.dueDate.toISOString().split("T")[0],
      principal_due: Number(e.principalDue),
      interest_due: Number(e.interestDue),
      principal_paid: Number(e.principalPaid),
      interest_paid: Number(e.interestPaid),
      fine_amount: Number(e.fineAmount),
      paid_at: e.paidAt ? e.paidAt.toISOString() : null,
    })),
  }))

  return (
    <ReportsClient
      meetings={toPlainObject(safeMeetings) as unknown as MeetingWithDetails[]}
      members={toPlainObject(safeMembers) as unknown as Member[]}
      loans={toPlainObject(safeLoans) as unknown as LoanWithEmis[]}
      organization={toPlainObject(currentMember.organization) as unknown as Organization}
    />
  )
}
