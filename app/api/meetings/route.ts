import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdminOrAbove, logActivity } from "@/lib/auth"
import { calcMeetingTotals, getNextMonthStart, addP } from "@/lib/calculations"
import { z } from "zod"

const createMeetingSchema = z.object({
  meeting_date: z.string().min(1, "Meeting date is required"),
  opening_balance: z.number().optional(),
})

export async function GET(req: Request) {
  try {
    const performer = await requireAdminOrAbove()

    const meetings = await prisma.meeting.findMany({
      where: { organizationId: performer.organizationId },
      orderBy: { monthYear: "desc" },
    })

    return NextResponse.json(meetings || [])
  } catch (error: any) {
    if (error?.message === "UNAUTHENTICATED" || error?.message === "UNAUTHORIZED" || error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHENTICATED" ? 401 : 403 })
    }
    console.error("GET /api/meetings error:", error)
    return NextResponse.json({ error: "Failed to fetch meetings" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const performer = await requireAdminOrAbove()
    const body = await req.json()
    const parseResult = createMeetingSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.errors[0].message }, { status: 400 })
    }

    const { meeting_date, opening_balance } = parseResult.data

    const meetingDate = new Date(meeting_date)
    const month_year = `${meetingDate.getFullYear()}-${String(meetingDate.getMonth() + 1).padStart(2, "0")}-${Date.now()}`

    const lastMeeting = await prisma.meeting.findFirst({
      where: {
        organizationId: performer.organizationId,
        status: "FINALIZED",
      },
      orderBy: { monthYear: "desc" },
    })

    let opening_balance_calculated = typeof opening_balance === "number" ? opening_balance : 0

    if (lastMeeting) {
      const lastContribs = await prisma.meetingContribution.findMany({
        where: { meetingId: lastMeeting.id },
      })
      const lastExpenses = await prisma.meetingExpense.findMany({
        where: { meetingId: lastMeeting.id },
      })
      const lastIncome = await prisma.meetingIncome.findMany({
        where: { meetingId: lastMeeting.id },
      })

      const nextMonthDate = new Date(getNextMonthStart(lastMeeting.meetingDate.toISOString().split("T")[0]))

      const lastLoans = await prisma.loan.findMany({
        where: {
          organizationId: performer.organizationId,
          disbursedDate: {
            gte: lastMeeting.meetingDate,
            lt: nextMonthDate,
          },
          status: { in: ["ACTIVE", "CLOSED"] },
        },
      })

      const totals = calcMeetingTotals({
        opening_balance: Number(lastMeeting.openingBalance),
        contributions: lastContribs.map((c) => ({
          savings_amount: Number(c.savingsAmount),
          loan_repayment: Number(c.loanRepayment),
          interest_paid: Number(c.interestPaid),
          penalty_paid: Number(c.penaltyPaid),
          other_amount: Number(c.otherAmount),
          is_present: c.isPresent,
        })),
        loans_issued_total: addP(...lastLoans.map((l) => Number(l.loanAmount))),
        other_expenses_total: addP(...lastExpenses.map((e) => Number(e.amount))),
        other_income_total: addP(...lastIncome.map((i) => Number(i.amount))),
      })

      opening_balance_calculated = Math.max(0, totals.closing_balance)
    }

    const org = await prisma.organization.findUnique({
      where: { id: performer.organizationId },
    })

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    const activeMembers = await prisma.member.findMany({
      where: {
        organizationId: performer.organizationId,
        status: "ACTIVE",
        isActive: true,
      },
      select: { id: true },
    })

    const newMeeting = await prisma.$transaction(async (tx) => {
      const meeting = await tx.meeting.create({
        data: {
          organizationId: performer.organizationId,
          meetingDate,
          monthYear: month_year,
          openingBalance: BigInt(opening_balance_calculated),
          status: "DRAFT",
          createdBy: performer.id,
        },
      })

      if (activeMembers && activeMembers.length > 0) {
        await tx.meetingContribution.createMany({
          data: activeMembers.map((m) => ({
            meetingId: meeting.id,
            memberId: m.id,
            savingsAmount: org.monthlySavingAmount,
            loanRepayment: BigInt(0),
            interestPaid: BigInt(0),
            penaltyPaid: BigInt(0),
            otherAmount: BigInt(0),
            isPresent: true,
          })),
        })
      }

      await logActivity(tx, performer.id, performer.organizationId, "MEETING_CREATED", "meeting", meeting.id, {
        month_year,
        meeting_date,
      })

      return meeting
    })

    return NextResponse.json(newMeeting)
  } catch (error: any) {
    if (error?.message === "UNAUTHENTICATED" || error?.message === "UNAUTHORIZED" || error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHENTICATED" ? 401 : 403 })
    }
    console.error("POST /api/meetings error:", error)
    return NextResponse.json({ error: "Failed to create meeting" }, { status: 500 })
  }
}
