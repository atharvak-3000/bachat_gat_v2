import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireSuperAdmin, logActivity } from "@/lib/auth"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const performer = await requireSuperAdmin()
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

    if (loan.status !== "ACTIVE") {
      return NextResponse.json({ error: "Only ACTIVE loans can be closed" }, { status: 400 })
    }

    const updatedLoan = await prisma.$transaction(async (tx: any) => {
      const res = await tx.loan.update({
        where: { id },
        data: {
          status: "CLOSED",
          outstandingAmount: BigInt(0),
        },
      })

      await tx.loanEmi.updateMany({
        where: {
          loanId: id,
          status: { not: "PAID" },
        },
        data: {
          status: "PAID",
          paidAt: new Date(),
        },
      })

      await tx.notification.create({
        data: {
          memberId: loan.memberId,
          organizationId: performer.organizationId,
          title: "Loan Closed / कर्ज बंद झाले",
          message: `Your loan of ₹${Number(loan.loanAmount) / 100} has been marked as CLOSED. Thank you.`,
          type: "LOAN_APPROVED",
          isRead: false,
        },
      })

      await logActivity(tx, performer.id, performer.organizationId, "LOAN_CLOSED", "loan", loan.id, {
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
    console.error("POST /api/loans/[id]/close error:", error)
    return NextResponse.json({ error: "Failed to close loan" }, { status: 500 })
  }
}
