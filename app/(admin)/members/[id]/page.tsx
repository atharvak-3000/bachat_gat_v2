import { redirect } from "next/navigation"
import { requireAdminOrAbove } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
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
  const supabase = await createClient()

  const [{ data: member }, { data: contributions }, { data: loans }] = await Promise.all([
    supabase.from("members").select("*").eq("organization_id", performer.organization_id).eq("id", id).maybeSingle(),
    supabase.from("meeting_contributions").select("*").eq("member_id", id).order("created_at", { ascending: false }),
    supabase.from("loans").select("*").eq("organization_id", performer.organization_id).eq("member_id", id).order("created_at", { ascending: false }),
  ])

  if (!member) redirect("/members")

  // Fetch loans guaranteed by this member
  const { data: guaranteedLoans } = await supabase
    .from("loans")
    .select("*, member:members!loans_member_id_fkey(id, name)")
    .eq("organization_id", performer.organization_id)
    .eq("guarantor_id", id)

  const guaranteedList = (guaranteedLoans || []).map((gl: any) => ({
    ...gl,
    is_overdue: false
  }))

  let overdueLoansCount = 0
  const todayStr = new Date().toISOString().split('T')[0]

  if (guaranteedList.length > 0) {
    const loanIds = guaranteedList.map(l => l.id)
    const { data: emis } = await supabase
      .from("loan_emis")
      .select("loan_id, status, due_date")
      .in("loan_id", loanIds)

    const emisList = emis || []
    guaranteedList.forEach(l => {
      const loanEmis = emisList.filter(e => e.loan_id === l.id)
      const isOverdue = loanEmis.some(e => 
        e.status === 'OVERDUE' || (e.status !== 'PAID' && e.due_date < todayStr)
      )
      l.is_overdue = isOverdue
      if (isOverdue && l.status === 'ACTIVE') {
        overdueLoansCount++
      }
    })
  }

  const stats = calcMemberStats(
    (contributions ?? []).map((c) => ({ savings_amount: c.savings_amount, interest_paid: c.interest_paid, is_present: c.is_present })),
    (loans ?? []).map((l) => ({ outstanding_amount: l.outstanding_amount, status: l.status }))
  )

  const activeGuaranteedCount = guaranteedList.filter(l => ['ACTIVE', 'PENDING'].includes(l.status)).length

  return (
    <MemberDetailClient 
      member={member as Member}
      stats={stats}
      guaranteedLoans={guaranteedList}
      overdueCount={overdueLoansCount}
      activeGuaranteedCount={activeGuaranteedCount}
      maxGuarantorLoans={performer.organization.max_guarantor_loans ?? 3}
    />
  )
}
