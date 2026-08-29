import { redirect } from "next/navigation"
import { requireAdminOrAbove } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { calcMeetingTotals } from "@/lib/calculations"
import MeetingsClient from "./MeetingsClient"

export default async function MeetingsPage() {
  let performer
  try {
    performer = await requireAdminOrAbove()
  } catch {
    redirect("/sign-in")
  }

  const [meetings, contributions, expenses, income, loans] = await Promise.all([
    prisma.meeting.findMany({
      where: { organizationId: performer.organization_id },
      orderBy: { monthYear: "desc" },
    }),
    prisma.meetingContribution.findMany(),
    prisma.meetingExpense.findMany(),
    prisma.meetingIncome.findMany(),
    prisma.loan.findMany({
      where: { organizationId: performer.organization_id },
    }),
  ])

  const meetingsWithTotals = meetings.map((m: any) => {
    const meetingDateStr = m.meetingDate.toISOString().split("T")[0]
    const mContribs = contributions
      .filter((c: any) => c.meetingId === m.id)
      .map((c: any) => ({
        savings_amount: Number(c.savingsAmount),
        loan_repayment: Number(c.loanRepayment),
        interest_paid: Number(c.interestPaid),
        penalty_paid: Number(c.penaltyPaid),
        other_amount: Number(c.otherAmount),
        is_present: Boolean(c.isPresent),
      }))

    const mExps = expenses
      .filter((e: any) => e.meetingId === m.id)
      .reduce((sum: number, e: any) => sum + Number(e.amount), 0)

    const mIncs = income
      .filter((i: any) => i.meetingId === m.id)
      .reduce((sum: number, i: any) => sum + Number(i.amount), 0)

    const mLoans = loans
      .filter(
        (l: any) =>
          l.disbursedDate.toISOString().split("T")[0] === meetingDateStr &&
          ["ACTIVE", "CLOSED"].includes(l.status)
      )
      .reduce((sum: number, l: any) => sum + Number(l.loanAmount), 0)

    const totals = calcMeetingTotals({
      opening_balance: Number(m.openingBalance),
      contributions: mContribs,
      loans_issued_total: mLoans,
      other_expenses_total: mExps,
      other_income_total: mIncs,
    })

    return {
      ...m,
      organization_id: m.organizationId,
      month_year: m.monthYear,
      meeting_date: meetingDateStr,
      opening_balance: Number(m.openingBalance),
      created_at: m.createdAt.toISOString(),
      totals,
    }
  })

  return <MeetingsClient initialMeetings={meetingsWithTotals as any} />
}
