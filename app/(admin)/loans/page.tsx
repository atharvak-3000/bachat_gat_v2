import { redirect } from "next/navigation"
import { requireAuth, toSafeMember } from "@/lib/auth"
import prisma from "@/lib/prisma"
import LoansClient from "./LoansClient"

export default async function AdminLoansPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  let performer
  try {
    performer = await requireAuth()
  } catch {
    redirect("/sign-in")
  }

  const { tab } = await searchParams

  const [loans, members, emis] = await Promise.all([
    prisma.loan.findMany({
      where: { organizationId: performer.organization_id },
      include: {
        member: true,
        guarantor: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.member.findMany({
      where: {
        organizationId: performer.organization_id,
        isActive: true,
        status: "ACTIVE",
      },
      orderBy: { name: "asc" },
    }),
    prisma.loanEmi.findMany({
      select: { loanId: true, status: true, dueDate: true },
    }),
  ])

  const todayStr = new Date().toISOString().split("T")[0]

  const overdueCountMap: Record<string, number> = {}
  loans.forEach((l) => {
    const loanEmis = emis.filter((e) => e.loanId === l.id)
    const overdueCount = loanEmis.filter(
      (e) => e.status === "OVERDUE" || (e.status !== "PAID" && e.dueDate.toISOString().split("T")[0] < todayStr)
    ).length
    overdueCountMap[l.id] = overdueCount
  })

  const safeMembers = members.map((m) => toSafeMember(m))

  const loansWithOverdue = loans.map((l) => ({
    ...l,
    organization_id: l.organizationId,
    member_id: l.memberId,
    guarantor_id: l.guarantorId,
    loan_amount: Number(l.loanAmount),
    outstanding_amount: Number(l.outstandingAmount),
    interest_rate: Number(l.interestRate),
    disbursed_date: l.disbursedDate.toISOString().split("T")[0],
    term_months: l.termMonths,
    created_at: l.createdAt.toISOString(),
    member: toSafeMember(l.member),
    guarantor: l.guarantor,
    overdue_count: overdueCountMap[l.id] || 0,
  }))

  return (
    <LoansClient
      loans={loansWithOverdue as any}
      currentRole={performer.role}
      activeTab={tab || "all"}
      members={safeMembers as any}
    />
  )
}
