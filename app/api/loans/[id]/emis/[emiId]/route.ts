import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdminOrAbove, logActivity } from "@/lib/auth"
import { toP } from "@/lib/calculations"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; emiId: string }> }
) {
  try {
    const performer = await requireAdminOrAbove()
    const { id, emiId } = await params
    const body = await req.json()
    const { principal_paid, interest_paid } = body

    const pPaid = BigInt(toP(principal_paid || 0))
    const iPaid = BigInt(toP(interest_paid || 0))

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
      return NextResponse.json({ error: "Cannot record EMI payment for non-ACTIVE loans" }, { status: 400 })
    }

    const emi = await prisma.loanEmi.findFirst({
      where: {
        id: emiId,
        loanId: id,
      },
    })

    if (!emi) {
      return NextResponse.json({ error: "EMI record not found" }, { status: 404 })
    }

    const updatedResult = await prisma.$transaction(async (tx: any) => {
      let updatedPrincipalPaid = emi.principalPaid + pPaid
      let updatedInterestPaid = emi.interestPaid + iPaid

      // If remaining due is within 100 paise (₹1) due to rounding/decimals, treat as fully paid
      const isPrincipalSatisfied =
        updatedPrincipalPaid >= emi.principalDue ||
        (emi.principalDue > updatedPrincipalPaid && emi.principalDue - updatedPrincipalPaid < BigInt(100))

      const isInterestSatisfied =
        updatedInterestPaid >= emi.interestDue ||
        (emi.interestDue > updatedInterestPaid && emi.interestDue - updatedInterestPaid < BigInt(100))

      const isFullyPaid = isPrincipalSatisfied && isInterestSatisfied

      // If satisfied, snap to full due so no fractional paise remain
      if (isPrincipalSatisfied && updatedPrincipalPaid < emi.principalDue) {
        updatedPrincipalPaid = emi.principalDue
      }
      if (isInterestSatisfied && updatedInterestPaid < emi.interestDue) {
        updatedInterestPaid = emi.interestDue
      }

      const newStatus = isFullyPaid ? "PAID" : "PARTIAL"

      const updatedEmi = await tx.loanEmi.update({
        where: { id: emiId },
        data: {
          principalPaid: updatedPrincipalPaid,
          interestPaid: updatedInterestPaid,
          status: newStatus,
          paidAt: isFullyPaid ? (emi.paidAt || new Date()) : emi.paidAt,
        },
      })

      // Remaining outstanding balance on the loan
      let newOutstanding = loan.outstandingAmount > pPaid ? loan.outstandingAmount - pPaid : BigInt(0)
      // If remaining balance is less than ₹1 (100 paise), round it to 0
      if (newOutstanding < BigInt(100)) {
        newOutstanding = BigInt(0)
      }

      const allEmis = await tx.loanEmi.findMany({
        where: { loanId: id },
        select: { id: true, status: true },
      })

      const allPaid = allEmis.every((e: any) => (e.id === emiId ? newStatus === "PAID" : e.status === "PAID"))
      const isClosed = newOutstanding === BigInt(0) || allPaid

      if (isClosed) {
        newOutstanding = BigInt(0)
        // Mark any lingering unclosed EMIs as PAID to prevent orphaned partials due to decimal rounding
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
      }

      await tx.loan.update({
        where: { id },
        data: {
          outstandingAmount: newOutstanding,
          status: isClosed ? "CLOSED" : "ACTIVE",
        },
      })

      await logActivity(tx, performer.id, performer.organizationId, "EMI_PAYMENT_RECORDED", "loan", loan.id, {
        member_id: loan.memberId,
        emi_id: emiId,
        principal_paid: Number(pPaid),
        interest_paid: Number(iPaid),
        outstanding_remaining: Number(newOutstanding),
        is_closed: isClosed,
      })

      return {
        emi: updatedEmi,
        outstanding_amount: newOutstanding,
        status: isClosed ? "CLOSED" : "ACTIVE",
      }
    })

    return NextResponse.json(updatedResult)
  } catch (error: any) {
    if (error?.message === "UNAUTHENTICATED" || error?.message === "UNAUTHORIZED" || error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHENTICATED" ? 401 : 403 })
    }
    console.error(error)
    return NextResponse.json({ error: "Failed to record EMI payment" }, { status: 500 })
  }
}
