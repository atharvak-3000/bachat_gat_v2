import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireSuperAdmin, logActivity } from "@/lib/auth"
import { calcMeetingTotals } from "@/lib/calculations"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const performer = await requireSuperAdmin()
    const { id } = await params
    const { closing_date } = await req.json().catch(() => ({}))

    const meeting = await prisma.meeting.findFirst({
      where: {
        id,
        organizationId: performer.organizationId,
      },
    })

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
    }

    if (meeting.status === "FINALIZED") {
      return NextResponse.json({ error: "Cannot finalize already finalized meeting" }, { status: 400 })
    }

    const [contributions, expenses, income, loans] = await Promise.all([
      prisma.meetingContribution.findMany({ where: { meetingId: id } }),
      prisma.meetingExpense.findMany({ where: { meetingId: id } }),
      prisma.meetingIncome.findMany({ where: { meetingId: id } }),
      prisma.loan.findMany({ where: { organizationId: performer.organizationId } }),
    ])

    const meetingDateStr = meeting.meetingDate.toISOString().split("T")[0]
    const activeIssuedLoans = loans.filter(
      (l: any) =>
        l.disbursedDate.toISOString().split("T")[0] === meetingDateStr &&
        ["ACTIVE", "CLOSED"].includes(l.status)
    )
    const loansIssuedAmount = activeIssuedLoans.reduce((sum: number, l: any) => sum + Number(l.loanAmount), 0)
    const totalExpenses = expenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0)
    const totalIncome = income.reduce((sum: number, i: any) => sum + Number(i.amount), 0)

    const totals = calcMeetingTotals({
      opening_balance: Number(meeting.openingBalance),
      contributions: contributions.map((c: any) => ({
        savings_amount: Number(c.savingsAmount),
        loan_repayment: Number(c.loanRepayment),
        interest_paid: Number(c.interestPaid),
        penalty_paid: Number(c.penaltyPaid),
        other_amount: Number(c.otherAmount),
        is_present: c.isPresent,
      })),
      loans_issued_total: loansIssuedAmount,
      other_expenses_total: totalExpenses,
      other_income_total: totalIncome,
    })

    if (totals.closing_balance < 0) {
      return NextResponse.json({ error: "Negative closing balance — cannot finalize meeting" }, { status: 400 })
    }

    const finalizedMeeting = await prisma.$transaction(async (tx: any) => {
      const updatedMeeting = await tx.meeting.update({
        where: { id },
        data: {
          status: "FINALIZED",
        },
      })

      for (const c of contributions) {
        const repaymentRemaining = Number(c.loanRepayment)
        const interestPaidRemaining = Number(c.interestPaid)

        if (repaymentRemaining > 0 || interestPaidRemaining > 0) {
          const activeLoan = await tx.loan.findFirst({
            where: {
              memberId: c.memberId,
              status: "ACTIVE",
            },
          })

          if (activeLoan) {
            const newOutstanding = Math.max(0, Number(activeLoan.outstandingAmount) - repaymentRemaining)
            const isClosed = newOutstanding === 0

            await tx.loan.update({
              where: { id: activeLoan.id },
              data: {
                outstandingAmount: BigInt(newOutstanding),
                status: isClosed ? "CLOSED" : "ACTIVE",
              },
            })

            const emi = await tx.loanEmi.findFirst({
              where: {
                loanId: activeLoan.id,
                monthYear: meeting.monthYear,
              },
            })

            if (emi) {
              const principal_paid = Number(emi.principalPaid) + repaymentRemaining
              const interest_paid = Number(emi.interestPaid) + interestPaidRemaining
              const isPaidFull = principal_paid >= Number(emi.principalDue) && interest_paid >= Number(emi.interestDue)

              await tx.loanEmi.update({
                where: { id: emi.id },
                data: {
                  principalPaid: BigInt(principal_paid),
                  interestPaid: BigInt(interest_paid),
                  status: isPaidFull ? "PAID" : principal_paid > 0 || interest_paid > 0 ? "PARTIAL" : "PENDING",
                  paidAt: isPaidFull ? new Date() : emi.paidAt,
                },
              })
            }

            if (isClosed) {
              await tx.loanEmi.updateMany({
                where: {
                  loanId: activeLoan.id,
                  status: { not: "PAID" },
                },
                data: {
                  status: "PAID",
                  paidAt: new Date(),
                },
              })
            }
          }
        }
      }

      await logActivity(tx, performer.id, performer.organizationId, "MEETING_FINALIZED", "meeting", updatedMeeting.id, {
        month_year: updatedMeeting.monthYear,
        closing_balance: totals.closing_balance,
      })

      return updatedMeeting
    })

    return NextResponse.json(finalizedMeeting)
  } catch (error: any) {
    if (error?.message === "UNAUTHENTICATED" || error?.message === "UNAUTHORIZED" || error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHENTICATED" ? 401 : 403 })
    }
    console.error("POST /api/meetings/[id]/finalize error:", error)
    return NextResponse.json({ error: "Failed to finalize meeting" }, { status: 500 })
  }
}
