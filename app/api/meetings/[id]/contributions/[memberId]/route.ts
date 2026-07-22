import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdminOrAbove } from "@/lib/auth"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const performer = await requireAdminOrAbove()
    const { id, memberId } = await params
    const body = await req.json()

    const { savings_amount, loan_repayment, interest_paid, penalty_paid, other_amount, is_present } = body

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
      return NextResponse.json({ error: "Cannot edit finalized meeting contributions" }, { status: 400 })
    }

    const member = await prisma.member.findFirst({
      where: {
        id: memberId,
        organizationId: performer.organizationId,
      },
    })

    if (!member) {
      return NextResponse.json({ error: "Member not found in this organization" }, { status: 404 })
    }

    const data: any = {}
    const checkPaise = (val: any, fieldName: string) => {
      if (val !== undefined) {
        if (typeof val !== "number" || val < 0 || !Number.isInteger(val)) {
          throw new Error(`${fieldName} must be a non-negative integer (paise)`)
        }
      }
    }

    if (savings_amount !== undefined) {
      checkPaise(savings_amount, "savings_amount")
      data.savingsAmount = BigInt(savings_amount)
    }
    if (loan_repayment !== undefined) {
      checkPaise(loan_repayment, "loan_repayment")
      data.loanRepayment = BigInt(loan_repayment)
    }
    if (interest_paid !== undefined) {
      checkPaise(interest_paid, "interest_paid")
      data.interestPaid = BigInt(interest_paid)
    }
    if (penalty_paid !== undefined) {
      checkPaise(penalty_paid, "penalty_paid")
      data.penaltyPaid = BigInt(penalty_paid)
    }
    if (other_amount !== undefined) {
      checkPaise(other_amount, "other_amount")
      data.otherAmount = BigInt(other_amount)
    }
    if (is_present !== undefined) {
      data.isPresent = Boolean(is_present)
    }

    const updatedContribution = await prisma.meetingContribution.update({
      where: {
        unique_contribution_per_member_per_meeting: {
          meetingId: id,
          memberId,
        },
      },
      data,
    })

    return NextResponse.json(updatedContribution)
  } catch (error: any) {
    if (error?.message === "UNAUTHENTICATED" || error?.message === "UNAUTHORIZED" || error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHENTICATED" ? 401 : 403 })
    }
    console.error(error)
    return NextResponse.json({ error: error.message || "Failed to update contribution" }, { status: 400 })
  }
}
