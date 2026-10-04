import { redirect } from "next/navigation"
import { requireAuth, toSafeMember } from "@/lib/auth"
import prisma from "@/lib/prisma"
import LoanEmisClient from "./LoanEmisClient"

export default async function AdminLoanDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  let performer
  try {
    performer = await requireAuth()
  } catch {
    redirect("/sign-in")
  }

  const { id } = await params

  const loan = await prisma.loan.findFirst({
    where: {
      id,
      organizationId: performer.organization_id,
    },
    include: {
      member: true,
      guarantor: { select: { id: true, name: true } },
    },
  })

  if (!loan) {
    redirect("/loans")
  }

  const safeLoan = {
    ...loan,
    organization_id: loan.organizationId,
    member_id: loan.memberId,
    guarantor_id: loan.guarantorId,
    loan_amount: Number(loan.loanAmount),
    outstanding_amount: Number(loan.outstandingAmount),
    interest_rate: Number(loan.interestRate),
    disbursed_date: loan.disbursedDate.toISOString().split("T")[0],
    term_months: loan.termMonths,
    created_at: loan.createdAt.toISOString(),
    member: toSafeMember(loan.member),
    guarantor: loan.guarantor,
  }

  return (
    <LoanEmisClient
      loan={safeLoan as any}
      role={performer.role}
    />
  )
}
