import { NextResponse } from "next/server"
import prisma, { normalizePrismaObject } from "@/lib/prisma"
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
      orderBy: [{ meetingDate: "desc" }, { createdAt: "desc" }],
    })

    return NextResponse.json(normalizePrismaObject(meetings || []))

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

    // Check if there is an unfinalized (DRAFT) meeting in this Gat
    const existingDraft = await prisma.meeting.findFirst({
      where: {
        organizationId: performer.organizationId,
        status: "DRAFT",
      },
      orderBy: [{ meetingDate: "desc" }, { createdAt: "desc" }],
    })

    if (existingDraft) {
      return NextResponse.json(
        {
          error: "PREVIOUS_MEETING_NOT_FINALIZED",
          message: "मागील सभा अंतिम (Finalize) केल्याशिवाय नवीन सभा तयार करता येत नाही. कृपया आधी मागील सभा पूर्ण करा.",
          meetingId: existingDraft.id,
        },
        { status: 400 }
      )
    }

    const meetingDate = new Date(meeting_date)
    const month_year = `${meetingDate.getFullYear()}-${String(meetingDate.getMonth() + 1).padStart(2, "0")}`

    // Find the latest existing meeting for this organization (if any)
    const lastMeeting = await prisma.meeting.findFirst({
      where: {
        organizationId: performer.organizationId,
      },
      orderBy: [{ meetingDate: "desc" }, { createdAt: "desc" }],
    })

    let opening_balance_calculated = 0

    if (lastMeeting) {
      // Automatically calculate and carry forward closing balance from previous meeting
      const [lastContribs, lastExpenses, lastIncome, lastLoans] = await Promise.all([
        prisma.meetingContribution.findMany({
          where: { meetingId: lastMeeting.id },
        }),
        prisma.meetingExpense.findMany({
          where: { meetingId: lastMeeting.id },
        }),
        prisma.meetingIncome.findMany({
          where: { meetingId: lastMeeting.id },
        }),
        prisma.loan.findMany({
          where: {
            organizationId: performer.organizationId,
            status: { in: ["ACTIVE", "CLOSED"] },
          },
        }),
      ])

      const lastMeetingDateStr = lastMeeting.meetingDate.toISOString().split("T")[0]
      const activeIssuedLoans = lastLoans.filter(
        (l: any) => l.disbursedDate.toISOString().split("T")[0] === lastMeetingDateStr
      )

      const totals = calcMeetingTotals({
        opening_balance: Number(lastMeeting.openingBalance),
        contributions: lastContribs.map((c: any) => ({
          savings_amount: Number(c.savingsAmount),
          loan_repayment: Number(c.loanRepayment),
          interest_paid: Number(c.interestPaid),
          penalty_paid: Number(c.penaltyPaid),
          other_amount: Number(c.otherAmount),
          is_present: c.isPresent,
        })),
        loans_issued_total: addP(...activeIssuedLoans.map((l: any) => Number(l.loanAmount))),
        other_expenses_total: addP(...lastExpenses.map((e: any) => Number(e.amount))),
        other_income_total: addP(...lastIncome.map((i: any) => Number(i.amount))),
      })

      opening_balance_calculated = totals.closing_balance
    } else {
      // First meeting ever for this Gat - use the opening balance entered by admin
      opening_balance_calculated = typeof opening_balance === "number" ? opening_balance : 0
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

    const newMeeting = await prisma.$transaction(async (tx: any) => {
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
          data: activeMembers.map((m: any) => ({
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

    return NextResponse.json(normalizePrismaObject(newMeeting))
  } catch (error: any) {
    if (error?.message === "UNAUTHENTICATED" || error?.message === "UNAUTHORIZED" || error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHENTICATED" ? 401 : 403 })
    }
    console.error("POST /api/meetings error:", error)
    return NextResponse.json({ error: "Failed to create meeting" }, { status: 500 })
  }
}
