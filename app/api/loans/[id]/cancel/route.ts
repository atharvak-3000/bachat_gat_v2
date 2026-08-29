import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdminOrAbove, logActivity } from "@/lib/auth"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const performer = await requireAdminOrAbove()
    const { id } = await params

    const loan = await prisma.loan.findFirst({
      where: {
        id,
        organizationId: performer.organizationId,
      },
    })

    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 })
    }

    if (!["ACTIVE", "PENDING"].includes(loan.status)) {
      return NextResponse.json({ error: "Only ACTIVE or PENDING loans can be cancelled" }, { status: 400 })
    }

    const previousStatus = loan.status

    const updatedLoan = await prisma.$transaction(async (tx: any) => {
      const res = await tx.loan.update({
        where: { id },
        data: {
          status: "REJECTED",
          rejectionReason: "Cancelled by admin",
        },
      })

      if (previousStatus === "ACTIVE" && loan.disbursedDate) {
        const meeting = await tx.meeting.findFirst({
          where: {
            organizationId: performer.organizationId,
            meetingDate: loan.disbursedDate,
          },
        })

        if (meeting) {
          await tx.meetingExpense.deleteMany({
            where: {
              meetingId: meeting.id,
              description: { contains: loan.id },
            },
          })

          const subsequentDraftMeetings = await tx.meeting.findMany({
            where: {
              organizationId: performer.organizationId,
              status: "DRAFT",
              meetingDate: { gt: meeting.meetingDate },
            },
          })

          for (const draftMeeting of subsequentDraftMeetings) {
            await tx.meeting.update({
              where: { id: draftMeeting.id },
              data: {
                openingBalance: draftMeeting.openingBalance + loan.loanAmount,
              },
            })
          }
        }
      }

      await tx.loanEmi.deleteMany({
        where: {
          loanId: id,
          status: { not: "PAID" },
        },
      })

      await logActivity(tx, performer.id, performer.organizationId, "LOAN_CANCELLED", "loan", id, {
        member_id: loan.memberId,
        amount: Number(loan.loanAmount),
      })

      return res
    })

    return NextResponse.json(updatedLoan)
  } catch (error: any) {
    if (error?.message === "UNAUTHENTICATED" || error?.message === "UNAUTHORIZED" || error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHENTICATED" ? 401 : 403 })
    }
    console.error("Error in cancel loan API:", error)
    return NextResponse.json({ error: "Failed to cancel loan" }, { status: 500 })
  }
}
