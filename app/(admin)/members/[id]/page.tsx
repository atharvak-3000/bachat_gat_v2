import { redirect } from "next/navigation"
import { requireAdminOrAbove, toSafeMember } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { calcMemberStats } from "@/lib/calculations"
import MemberDetailClient from "./MemberDetailClient"
import type { Member } from "@/types"

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  let performer
  try {
    performer = await requireAdminOrAbove()
  } catch {
    redirect("/sign-in")
  }

  const { id } = await params

  const [member, contributions, loans, guaranteedLoans] = await Promise.all([
    prisma.member.findFirst({
      where: {
        id,
        organizationId: performer.organization_id,
      },
    }),
    prisma.meetingContribution.findMany({
      where: { memberId: id },
    }),
    prisma.loan.findMany({
      where: {
        organizationId: performer.organization_id,
        memberId: id,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.loan.findMany({
      where: {
        organizationId: performer.organization_id,
        guarantorId: id,
      },
      include: {
        member: { select: { id: true, name: true } },
      },
    }),
  ])

  if (!member) redirect("/members")

  const safeMember = toSafeMember(member)

  const guaranteedList = guaranteedLoans.map((gl) => ({
    ...gl,
    organization_id: gl.organizationId,
    member_id: gl.memberId,
    guarantor_id: gl.guarantorId,
    loan_amount: Number(gl.loanAmount),
    outstanding_amount: Number(gl.outstandingAmount),
    interest_rate: Number(gl.interestRate),
    disbursed_date: gl.disbursedDate.toISOString().split("T")[0],
    term_months: gl.termMonths,
    created_at: gl.createdAt.toISOString(),
    is_overdue: false,
    member: gl.member,
  }))

  let overdueLoansCount = 0
  const todayStr = new Date().toISOString().split("T")[0]

  if (guaranteedList.length > 0) {
    const loanIds = guaranteedList.map((l) => l.id)
    const emis = await prisma.loanEmi.findMany({
      where: { loanId: { in: loanIds } },
      select: { loanId: true, status: true, dueDate: true },
    })

    const emisList = emis.map((e) => ({
      loan_id: e.loanId,
      status: e.status,
      due_date: e.dueDate.toISOString().split("T")[0],
    }))

    guaranteedList.forEach((l) => {
      const loanEmis = emisList.filter((e) => e.loan_id === l.id)
      const isOverdue = loanEmis.some(
        (e) => e.status === "OVERDUE" || (e.status !== "PAID" && e.due_date < todayStr)
      )
      l.is_overdue = isOverdue
      if (isOverdue && l.status === "ACTIVE") {
        overdueLoansCount++
      }
    })
  }

  const stats = calcMemberStats(
    contributions.map((c) => ({
      savings_amount: Number(c.savingsAmount),
      interest_paid: Number(c.interestPaid),
      is_present: c.isPresent,
    })),
    loans.map((l) => ({
      outstanding_amount: Number(l.outstandingAmount),
      status: l.status as any,
    }))
  )

  const activeGuaranteedCount = guaranteedList.filter((l) => ["ACTIVE", "PENDING"].includes(l.status)).length

  return (
    <MemberDetailClient
      member={safeMember as unknown as Member}
      stats={stats}
      guaranteedLoans={guaranteedList as any}
      overdueCount={overdueLoansCount}
      activeGuaranteedCount={activeGuaranteedCount}
      maxGuarantorLoans={performer.organization.max_guarantor_loans ?? 3}
    />
  )
}
