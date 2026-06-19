import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireSuperAdmin, logActivity } from "@/lib/auth"
import { calcEmiSchedule } from "@/lib/calculations"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const performer = await requireSuperAdmin()
    const supabase = await createClient()
    const { id } = await params

    let body: any = {}
    try {
      body = await req.json()
    } catch (e) {
      // body is optional
    }
    const { guarantor_id } = body

    // Fetch loan and verify org
    const { data: loan, error: loanError } = await supabase
      .from("loans")
      .select("*, member:members!loans_member_id_fkey(*)")
      .eq("id", id)
      .eq("organization_id", performer.organization_id)
      .maybeSingle()

    if (loanError) throw loanError
    if (!loan) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 })
    }

    if (loan.status !== 'PENDING') {
      return NextResponse.json({ error: 'Loan is not in PENDING status' }, { status: 400 })
    }

    if (guarantor_id) {
      if (loan.member_id === guarantor_id) {
        return NextResponse.json(
          { error: 'Applicant cannot be their own guarantor' },
          { status: 400 }
        )
      }
      const { data: guarantorMember } = await supabase
        .from('members')
        .select('id, name, status, is_active, organization_id')
        .eq('id', guarantor_id)
        .maybeSingle()

      if (!guarantorMember) {
        return NextResponse.json({ error: 'Guarantor not found' }, { status: 404 })
      }

      if (guarantorMember.organization_id !== performer.organization_id) {
        return NextResponse.json(
          { error: 'Guarantor must be in the same organization' },
          { status: 403 }
        )
      }

      const isGuarantorActive = guarantorMember.is_active !== false &&
        (!guarantorMember.status || guarantorMember.status === 'ACTIVE')

      if (!isGuarantorActive) {
        return NextResponse.json({ error: 'Guarantor is not active' }, { status: 400 })
      }

      // Count guarantor's current active/pending loans they are guaranteeing
      const { count: guaranteedLoansCount, error: countError } = await supabase
        .from('loans')
        .select('id', { count: 'exact', head: true })
        .eq('guarantor_id', guarantor_id)
        .in('status', ['ACTIVE', 'PENDING'])
        .neq('id', id)

      if (countError) throw countError

      const limit = performer.organization.max_guarantor_loans ?? 3
      if ((guaranteedLoansCount ?? 0) >= limit) {
        return NextResponse.json({
          error: 'GUARANTOR_LIMIT_REACHED',
          message: `This member is already guarantor for ${guaranteedLoansCount} loans (max allowed: ${limit})`
        }, { status: 400 })
      }
    }

    const updates: Record<string, any> = {
      status: 'ACTIVE',
      outstanding_amount: loan.loan_amount,
      approved_by: performer.id,
      approved_at: new Date().toISOString(),
      disbursed_date: new Date().toISOString().split('T')[0] // Set disbursement date to today
    }

    if (guarantor_id !== undefined) {
      updates.guarantor_id = guarantor_id || null
    }

    // Update status PENDING -> ACTIVE
    const { data: updatedLoan, error: updateError } = await supabase
      .from("loans")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (updateError) throw updateError

    if (guarantor_id) {
      await logActivity(supabase, performer.id, performer.organization_id, 'GUARANTOR_ASSIGNED', 'loan', loan.id, {
        member_id: loan.member_id,
        guarantor_id,
        loan_id: loan.id
      })
    }

    // Generate EMI schedule -> insert
    const emis = calcEmiSchedule(
      loan.loan_amount,
      loan.interest_rate || 2.0,
      loan.term_months || 12,
      new Date()
    )

    const emiInserts = emis.map(e => ({
      ...e,
      loan_id: loan.id
    }))

    const { error: emiError } = await supabase
      .from("loan_emis")
      .insert(emiInserts)

    if (emiError) throw emiError

    // Notify member
    await supabase.from("notifications").insert({
      member_id: loan.member_id,
      organization_id: performer.organization_id,
      title: 'Loan Approved / कर्ज मंजूर झाले',
      message: `Your loan request of ₹${loan.loan_amount / 100} has been approved by the SuperAdmin.`,
      type: 'LOAN_APPROVED',
      is_read: false
    })

    // Log activity
    await logActivity(supabase, performer.id, performer.organization_id, 'LOAN_APPROVED', 'loan', loan.id, {
      member_id: loan.member_id,
      amount: loan.loan_amount
    })

    return NextResponse.json(updatedLoan)
  } catch (error) {
    if (error instanceof Error && (error.message === 'UNAUTHENTICATED' || error.message === 'UNAUTHORIZED')) {
      return NextResponse.json({ error: error.message }, { status: error.message === 'UNAUTHENTICATED' ? 401 : 403 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Failed to approve loan' }, { status: 500 })
  }
}
