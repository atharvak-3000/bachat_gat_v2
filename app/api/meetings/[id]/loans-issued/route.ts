import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdminOrAbove, logActivity } from "@/lib/auth"
import { calcEmiSchedule } from "@/lib/calculations"
import { z } from "zod"

const loanIssuedSchema = z.object({
  member_id: z.string().min(1, "member_id is required"),
  amount: z.number().positive("amount is required and must be positive"),
  interest_rate: z.number().optional(),
  purpose: z.string().optional(),
  term_months: z.number().optional(),
  guarantor_id: z.string().optional(),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const performer = await requireAdminOrAbove()
    const { id: meetingId } = await params
    const body = await req.json()
    const parseResult = loanIssuedSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.errors[0].message }, { status: 400 })
    }

    const { member_id, amount, interest_rate, purpose, term_months, guarantor_id } = parseResult.data

    if (guarantor_id) {
      if (member_id === guarantor_id) {
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

    const meeting = await prisma.meeting.findFirst({
      where: {
        id: meetingId,
        organizationId: performer.organizationId,
      },
    })

    if (!meeting) return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
    if (meeting.status === "FINALIZED") return NextResponse.json({ error: "Cannot edit finalized meeting" }, { status: 400 })

    const targetMember = await prisma.member.findUnique({
      where: { id: member_id },
    })

    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    if (targetMember.organizationId !== performer.organizationId) {
      return NextResponse.json({ error: "Member not found in your organization" }, { status: 403 })
    }

    if (!targetMember.isActive || targetMember.status !== "ACTIVE") {
      return NextResponse.json({ error: "Member is not active" }, { status: 400 })
    }

    const existingLoan = await prisma.loan.findFirst({
      where: {
        memberId: member_id,
        organizationId: performer.organizationId,
        status: "ACTIVE",
      },
    })

    if (existingLoan) return NextResponse.json({ error: "Member already has an active loan" }, { status: 400 })

    const loanAmountPaise = BigInt(amount)

    const maxLimit = BigInt(performer.organization.max_loan_limit || performer.organization.maxLoanLimit || 0)

    if (
      maxLimit > BigInt(0) &&
      loanAmountPaise > maxLimit
    ) {
      return NextResponse.json(
        {
          error: `Exceeds max loan limit of ₹${Number(maxLimit) / 100}`,
        },
        { status: 400 }
      )
    }

    const loanStatus = performer.role === "SUPERADMIN" ? "ACTIVE" : "PENDING"
    const finalInterestRate = interest_rate ?? 2.0
    const finalTermMonths = term_months ?? 12

    const loan = await prisma.$transaction(async (tx: any) => {
      const createdLoan = await tx.loan.create({
        data: {
          organizationId: performer.organizationId,
          memberId: member_id,
          guarantorId: guarantor_id || null,
          loanAmount: loanAmountPaise,
          outstandingAmount: loanAmountPaise,
          interestRate: finalInterestRate,
          disbursedDate: meeting.meetingDate,
          purpose: purpose || "",
          termMonths: finalTermMonths,
          status: loanStatus,
          requestedBy: performer.id,
          approvedBy: loanStatus === "ACTIVE" ? performer.id : null,
          approvedAt: loanStatus === "ACTIVE" ? new Date() : null,
        },
      })

      if (loanStatus === "ACTIVE") {
        const emis = calcEmiSchedule(
          Number(loanAmountPaise),
          finalInterestRate,
          finalTermMonths,
          meeting.meetingDate
        )

        await tx.loanEmi.createMany({
          data: emis.map((e) => ({
            loanId: createdLoan.id,
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
      }

      await logActivity(tx, performer.id, performer.organizationId, "LOAN_ISSUED", "loan", createdLoan.id, {
        member_name: targetMember.name,
        amount: Number(loanAmountPaise),
        status: loanStatus,
      })

      if (guarantor_id) {
        await logActivity(tx, performer.id, performer.organizationId, "GUARANTOR_ASSIGNED", "loan", createdLoan.id, {
          member_id,
          guarantor_id,
          loan_id: createdLoan.id,
        })
      }

      return createdLoan
    })

    return NextResponse.json(loan)
  } catch (err) {
    console.error("[LOANS_ISSUED]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
