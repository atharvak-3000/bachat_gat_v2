import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAuth, logActivity, toSafeMember } from "@/lib/auth"
import { calcEmiSchedule } from "@/lib/calculations"
import { z } from "zod"

const loanRequestSchema = z.object({
  member_id: z.string().optional(),
  amount: z.number().positive("Amount must be greater than zero"),
  interest_rate: z.number().optional(),
  purpose: z.string().optional(),
  term_months: z.number().positive("Term months is required"),
})

export async function GET(req: Request) {
  try {
    const performer = await requireAuth()

    const loans = await prisma.loan.findMany({
      where: { organizationId: performer.organizationId },
      include: {
        member: true,
        guarantor: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    const safeLoans = loans.map((l: any) => ({
      ...l,
      member: toSafeMember(l.member),
    }))

    return NextResponse.json(safeLoans || [])
  } catch (error: any) {
    if (error?.message === "UNAUTHENTICATED" || error?.message === "UNAUTHORIZED" || error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHENTICATED" ? 401 : 403 })
    }
    console.error("GET /api/loans error:", error)
    return NextResponse.json({ error: "Failed to fetch loans" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const performer = await requireAuth()
    const body = await req.json()
    const parseResult = loanRequestSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.errors[0].message }, { status: 400 })
    }

    const { amount, interest_rate, purpose, term_months } = parseResult.data
    let requestMemberId = parseResult.data.member_id || performer.id
    if (performer.role === "MEMBER") {
      requestMemberId = performer.id
    }

    const member = await prisma.member.findUnique({
      where: { id: requestMemberId },
    })

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    if (member.organizationId !== performer.organizationId) {
      return NextResponse.json({ error: "Member not in your organization" }, { status: 403 })
    }

    if (!member.isActive || member.status !== "ACTIVE") {
      return NextResponse.json({ error: "Member is not active or does not exist" }, { status: 400 })
    }

    const activeLoan = await prisma.loan.findFirst({
      where: {
        memberId: requestMemberId,
        status: "ACTIVE",
      },
    })

    if (activeLoan) {
      return NextResponse.json({ error: "Member already has an active loan" }, { status: 400 })
    }

    const org = await prisma.organization.findUnique({
      where: { id: performer.organizationId },
    })

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    const amountBigInt = BigInt(amount)
    if (org.maxLoanLimit > BigInt(0) && amountBigInt > org.maxLoanLimit) {
      return NextResponse.json(
        { error: `Amount exceeds organization maximum limit of ₹${Number(org.maxLoanLimit) / 100}` },
        { status: 400 }
      )
    }

    const status = performer.role === "SUPERADMIN" ? "ACTIVE" : "PENDING"
    const finalInterestRate = interest_rate ?? 2.0

    const loan = await prisma.$transaction(async (tx: any) => {
      const createdLoan = await tx.loan.create({
        data: {
          organizationId: performer.organizationId,
          memberId: requestMemberId,
          loanAmount: amountBigInt,
          outstandingAmount: status === "ACTIVE" ? amountBigInt : BigInt(0),
          interestRate: finalInterestRate,
          disbursedDate: new Date(),
          purpose: purpose || "",
          termMonths: term_months,
          status,
          requestedBy: performer.id,
          approvedBy: status === "ACTIVE" ? performer.id : null,
          approvedAt: status === "ACTIVE" ? new Date() : null,
        },
      })

      if (status === "ACTIVE") {
        const emis = calcEmiSchedule(amount, finalInterestRate, term_months, new Date())

        await tx.loanEmi.createMany({
          data: emis.map((e: any) => ({
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
      } else {
        const superadmins = await tx.member.findMany({
          where: {
            organizationId: performer.organizationId,
            role: "SUPERADMIN",
          },
          select: { id: true },
        })

        if (superadmins.length > 0) {
          await tx.notification.createMany({
            data: superadmins.map((admin: any) => ({
              memberId: admin.id,
              organizationId: performer.organizationId,
              title: "New Loan Request Awaiting Approval",
              message: `${member.name} has requested a loan of ₹${amount / 100}. Please review.`,
              type: "EMI_DUE",
              isRead: false,
            })),
          })
        }
      }

      await logActivity(tx, performer.id, performer.organizationId, "LOAN_REQUESTED", "loan", createdLoan.id, {
        member_id: requestMemberId,
        amount,
        status,
      })

      return createdLoan
    })

    return NextResponse.json(loan)
  } catch (error: any) {
    if (error?.message === "UNAUTHENTICATED" || error?.message === "UNAUTHORIZED" || error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHENTICATED" ? 401 : 403 })
    }
    console.error("POST /api/loans error:", error)
    return NextResponse.json({ error: "Failed to create loan" }, { status: 500 })
  }
}
