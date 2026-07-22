import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdminOrAbove, requireAuth, toSafeMember } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const performer = await requireAuth()
    const { id } = await params

    const meeting = await prisma.meeting.findFirst({
      where: {
        id,
        organizationId: performer.organizationId,
      },
    })

    if (!meeting) {
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

    const safeContributions = contributions.map((c) => ({
      ...c,
      member: toSafeMember(c.member),
    }))

    const safeLoans = allLoans.map((l) => ({
      ...l,
      member: toSafeMember(l.member),
    }))

    const meetingDateStr = meeting.meetingDate.toISOString().split("T")[0]
    const loansIssued = safeLoans.filter(
      (l) => l.disbursedDate.toISOString().split("T")[0] === meetingDateStr
    )
    const activeLoans = safeLoans.filter((l) => l.status === "ACTIVE")

    return NextResponse.json({
      meeting,
      contributions: safeContributions || [],
      expenses: expenses || [],
      income: income || [],
      loans_issued: loansIssued,
      active_loans: activeLoans,
      org_settings: orgSettings,
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

    return NextResponse.json(updatedMeeting)
  } catch (error: any) {
    if (error?.message === "UNAUTHENTICATED" || error?.message === "UNAUTHORIZED" || error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHENTICATED" ? 401 : 403 })
    }
    console.error("PATCH /api/meetings/[id] error:", error)
    return NextResponse.json({ error: "Failed to update meeting" }, { status: 500 })
  }
}
