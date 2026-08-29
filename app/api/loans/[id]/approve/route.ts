import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireSuperAdmin, logActivity } from "@/lib/auth"
import { calcEmiSchedule } from "@/lib/calculations"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const performer = await requireSuperAdmin()
    const { id } = await params

    let body: any = {}
    try {
      body = await req.json()
    } catch {
      // body is optional
    }
    const { guarantor_id } = body

    const loan = await prisma.loan.findFirst({
      where: {
        id,
        organizationId: performer.organizationId,
      },
      include: { member: true },
    })

    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 })
    }

    if (loan.status !== "PENDING") {
      return NextResponse.json({ error: "Loan is not in PENDING status" }, { status: 400 })
    }

    if (guarantor_id) {
      if (loan.memberId === guarantor_id) {
        return NextResponse.json({ error: "Applicant cannot be their own guarantor" }, { status: 400 })
      }

      const guarantorMember = await prisma.member.findUnique({
        where: { id: guarantor_id },
      })

      if (!guarantorMember) {
        return NextResponse.json({ error: "Guarantor not found" }, { status: 404 })
      }

      if (guarantorMember.organizationId !== performer.organizationId) {
        return NextResponse.json({ error: "Guarantor must be in the same organization" }, { status: 403 })
      }

      const isGuarantorActive = guarantorMember.isActive && guarantorMember.status === "ACTIVE"
      if (!isGuarantorActive) {
        return NextResponse.json({ error: "Guarantor is not active" }, { status: 400 })
      }

      const guaranteedLoansCount = await prisma.loan.count({
        where: {
          guarantorId: guarantor_id,
          status: { in: ["ACTIVE", "PENDING"] },
          id: { not: id },
        },
      })

      const limit = performer.organization.maxGuarantorLoans ?? 3
      if (guaranteedLoansCount >= limit) {
        return NextResponse.json(
          {
            error: "GUARANTOR_LIMIT_REACHED",
            message: `This member is already guarantor for ${guaranteedLoansCount} loans (max allowed: ${limit})`,
          },
          { status: 400 }
        )
      }
    }

    const updatedLoan = await prisma.$transaction(async (tx: any) => {
      const data: any = {
        status: "ACTIVE",
        outstandingAmount: loan.loanAmount,
        approvedBy: performer.id,
        approvedAt: new Date(),
        disbursedDate: new Date(),
      }

      if (guarantor_id !== undefined) {
        data.guarantorId = guarantor_id || null
      }

      const res = await tx.loan.update({
        where: { id },
        data,
      })

      if (guarantor_id) {
        await logActivity(tx, performer.id, performer.organizationId, "GUARANTOR_ASSIGNED", "loan", loan.id, {
          member_id: loan.memberId,
          guarantor_id,
          loan_id: loan.id,
        })
      }

      const emis = calcEmiSchedule(
        Number(loan.loanAmount),
        Number(loan.interestRate) || 2.0,
        loan.termMonths || 12,
        new Date()
      )

      await tx.loanEmi.createMany({
        data: emis.map((e) => ({
          loanId: loan.id,
          monthYear: e.month_year,
          dueDate: new Date(e.due_date),
          principalDue: BigInt(e.principal_due),
          interestDue: BigInt(e.interest_due),
          principalPaid: BigInt(e.principal_paid),
          interestPaid: BigInt(e.interest_paid),
          fineAmount: BigInt(e.fine_amount),
          status: e.status,
        })),
      })

      await tx.notification.create({
        data: {
          memberId: loan.memberId,
          organizationId: performer.organizationId,
          title: "Loan Approved / कर्ज मंजूर झाले",
          message: `Your loan request of ₹${Number(loan.loanAmount) / 100} has been approved by the SuperAdmin.`,
          type: "LOAN_APPROVED",
          isRead: false,
        },
      })

      await logActivity(tx, performer.id, performer.organizationId, "LOAN_APPROVED", "loan", loan.id, {
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
    console.error("POST /api/loans/[id]/approve error:", error)
    return NextResponse.json({ error: "Failed to approve loan" }, { status: 500 })
  }
}
