import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireAdminOrAbove, logActivity } from "@/lib/auth"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const performer = await requireAdminOrAbove()
    const supabase = await createClient()
    const { id } = await params

    // Fetch loan and verify organization
    const { data: loan, error: loanError } = await supabase
      .from("loans")
      .select("*")
      .eq("id", id)
      .eq("organization_id", performer.organization_id)
      .maybeSingle()

    if (loanError) throw loanError
    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 })
    }

    if (!["ACTIVE", "PENDING"].includes(loan.status)) {
      return NextResponse.json(
        { error: "Only ACTIVE or PENDING loans can be cancelled" },
        { status: 400 }
      )
    }

    const previousStatus = loan.status

    // Update status to REJECTED with cancellation reason
    const { data: updatedLoan, error: updateError } = await supabase
      .from("loans")
      .update({
        status: "REJECTED",
        rejection_reason: "Cancelled by admin"
      })
      .eq("id", id)
      .select()
      .single()

    if (updateError) throw updateError

    // If loan was ACTIVE and disbursed, reverse its balance effects
    if (previousStatus === "ACTIVE" && loan.disbursed_date) {
      // Find the meeting where this loan was disbursed
      const { data: meeting } = await supabase
        .from("meetings")
        .select("*")
        .eq("organization_id", performer.organization_id)
        .eq("meeting_date", loan.disbursed_date)
        .maybeSingle()

      if (meeting) {
        // Delete any related explicit meeting expenses (matching the loan ID in description)
        await supabase
          .from("meeting_expenses")
          .delete()
          .eq("meeting_id", meeting.id)
          .like("description", `%${loan.id}%`)

        // If the meeting was finalized, it means we carry forward its closing balance.
        // We should find subsequent DRAFT meetings and update their opening_balance by adding the loan amount back.
        const { data: subsequentDraftMeetings } = await supabase
          .from("meetings")
          .select("*")
          .eq("organization_id", performer.organization_id)
          .eq("status", "DRAFT")
          .gt("meeting_date", meeting.meeting_date)

        if (subsequentDraftMeetings && subsequentDraftMeetings.length > 0) {
          for (const draftMeeting of subsequentDraftMeetings) {
            await supabase
              .from("meetings")
              .update({
                opening_balance: draftMeeting.opening_balance + loan.loan_amount
              })
              .eq("id", draftMeeting.id)
          }
        }
      }
    }

    // Delete future unpaid/pending EMI records for this loan
    const { error: emiDeleteError } = await supabase
      .from("loan_emis")
      .delete()
      .eq("loan_id", id)
      .neq("status", "PAID")

    if (emiDeleteError) {
      console.error("Error deleting loan EMIs:", emiDeleteError)
    }

    // Add activity log
    await logActivity(
      supabase,
      performer.id,
      performer.organization_id,
      "LOAN_CANCELLED",
      "loan",
      id,
      {
        member_id: loan.member_id,
        amount: loan.loan_amount
      }
    )

    return NextResponse.json(updatedLoan)
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "UNAUTHENTICATED" || error.message === "FORBIDDEN")
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "UNAUTHENTICATED" ? 401 : 403 }
      )
    }
    console.error("Error in cancel loan API:", error)
    return NextResponse.json(
      { error: "Failed to cancel loan" },
      { status: 500 }
    )
  }
}
