import { NextResponse } from "next/server"
import prisma, { normalizePrismaObject } from "@/lib/prisma"
import { requireAdminOrAbove, requireAuth, toSafeMember } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const performer = await requireAuth()
    const { id } = await params

    const rawMeeting = await prisma.meeting.findFirst({
      where: {
        id,
        organizationId: performer.organizationId,
      },
    })

    if (!rawMeeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
    }

    const [contributions, expenses, income, allLoans, orgSettings] = await Promise.all([
      prisma.meetingContribution.findMany({
        where: { meetingId: id },
        include: { member: true },
      }),
      prisma.meetingExpense.findMany({
        where: { meetingId: id },
      }),
      prisma.meetingIncome.findMany({
        where: { meetingId: id },
      }),
      prisma.loan.findMany({
        where: { organizationId: performer.organizationId },
        include: {
          member: true,
          guarantor: { select: { id: true, name: true } },
        },
      }),
      prisma.organization.findUnique({
        where: { id: performer.organizationId },
      }),
    ])

    const safeContributions = contributions.map((c: any) => ({
      ...c,
      member: toSafeMember(c.member),
    }))

    const safeLoans = allLoans.map((l: any) => ({
      ...l,
      member: toSafeMember(l.member),
    }))

    const meetingDateStr = rawMeeting.meetingDate.toISOString().split("T")[0]
    const loansIssued = safeLoans.filter(
      (l: any) => l.disbursedDate.toISOString().split("T")[0] === meetingDateStr
    )
    const activeLoans = safeLoans.filter((l: any) => l.status === "ACTIVE")

    // Calculate prior savings for each member from previous finalized meetings
    const priorFinalizedMeetings = await prisma.meeting.findMany({
      where: {
        organizationId: performer.organizationId,
        status: "FINALIZED",
        id: { not: id },
        OR: [
          { meetingDate: { lt: rawMeeting.meetingDate } },
          {
            meetingDate: rawMeeting.meetingDate,
            createdAt: { lt: rawMeeting.createdAt },
          },
        ],
      },
      select: { id: true },
    })

    const priorMeetingIds = priorFinalizedMeetings.map((m) => m.id)
    const priorSavingsByMember: Record<string, number> = {}

    if (priorMeetingIds.length > 0) {
      const priorContributions = await prisma.meetingContribution.groupBy({
        by: ["memberId"],
        where: {
          meetingId: { in: priorMeetingIds },
        },
        _sum: {
          savingsAmount: true,
        },
      })

      priorContributions.forEach((pc: any) => {
        priorSavingsByMember[pc.memberId] = Number(pc._sum.savingsAmount || 0)
      })
    }

    return NextResponse.json({
      meeting: normalizePrismaObject(rawMeeting),
      contributions: normalizePrismaObject(safeContributions || []),
      expenses: normalizePrismaObject(expenses || []),
      income: normalizePrismaObject(income || []),
      loans_issued: normalizePrismaObject(loansIssued),
      active_loans: normalizePrismaObject(activeLoans),
      org_settings: normalizePrismaObject(orgSettings),
      prior_savings_by_member: priorSavingsByMember,
    })

  } catch (error: any) {
    if (error?.message === "UNAUTHENTICATED" || error?.message === "UNAUTHORIZED" || error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHENTICATED" ? 401 : 403 })
    }
    console.error("GET /api/meetings/[id] error:", error)
    return NextResponse.json({ error: "Failed to fetch meeting details" }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const performer = await requireAdminOrAbove()
    const { id } = await params
    const body = await req.json()
    const { notes, opening_balance } = body

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
      return NextResponse.json({ error: "Cannot edit finalized meeting" }, { status: 400 })
    }

    const data: any = {}
    if (notes !== undefined) data.notes = notes
    if (opening_balance !== undefined) data.openingBalance = BigInt(opening_balance)

    const updatedMeeting = await prisma.meeting.update({
      where: { id },
      data,
    })

    return NextResponse.json(normalizePrismaObject(updatedMeeting))
  } catch (error: any) {
    if (error?.message === "UNAUTHENTICATED" || error?.message === "UNAUTHORIZED" || error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHENTICATED" ? 401 : 403 })
    }
    console.error("PATCH /api/meetings/[id] error:", error)
    return NextResponse.json({ error: "Failed to update meeting" }, { status: 500 })
  }
}
