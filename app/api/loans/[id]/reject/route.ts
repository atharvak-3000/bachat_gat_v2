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
    const body = await req.json().catch(() => ({}))
    const { reason } = body

    const loan = await prisma.loan.findFirst({
      where: {
        id,
        organizationId: performer.organizationId,
      },
    })

    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 })
    }

    if (loan.status !== "PENDING") {
      return NextResponse.json({ error: "Loan is not in PENDING status" }, { status: 400 })
    }

    const updatedLoan = await prisma.$transaction(async (tx: any) => {
      const res = await tx.loan.update({
        where: { id },
        data: {
          status: "REJECTED",
          rejectionReason: reason || "Not specified",
        },
      })

      await tx.notification.create({
        data: {
          memberId: loan.memberId,
          organizationId: performer.organizationId,
          title: "Loan Request Rejected / कर्ज नाकारले",
          message: `Your loan request of ₹${Number(loan.loanAmount) / 100} has been rejected. Reason: ${reason || "Not specified"}`,
          type: "LOAN_REJECTED",
          isRead: false,
        },
      })

      await logActivity(tx, performer.id, performer.organizationId, "LOAN_REJECTED", "loan", loan.id, {
        member_id: loan.memberId,
        amount: Number(loan.loanAmount),
        reason,
      })

      return res
    })

    return NextResponse.json(updatedLoan)
  } catch (error: any) {
    if (error?.message === "UNAUTHENTICATED" || error?.message === "UNAUTHORIZED" || error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHENTICATED" ? 401 : 403 })
    }
    console.error("POST /api/loans/[id]/reject error:", error)
    return NextResponse.json({ error: "Failed to reject loan" }, { status: 500 })
  }
}
