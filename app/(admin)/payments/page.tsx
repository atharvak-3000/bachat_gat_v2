import { redirect } from "next/navigation"
import { requireAdminOrAbove, toSafeMember } from "@/lib/auth"
import prisma from "@/lib/prisma"
import AdminPaymentsClient from "./AdminPaymentsClient"

export default async function AdminPaymentsPage() {
  let currentAdmin
  try {
    currentAdmin = await requireAdminOrAbove()
  } catch {
    redirect("/sign-in")
  }

  const proofs = await prisma.paymentProof.findMany({
    where: { organizationId: currentAdmin.organization_id },
    include: {
      member: { select: { name: true, memberNumber: true } },
      meeting: { select: { monthYear: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const safeProofs = proofs.map((p: any) => ({
    ...p,
    organization_id: p.organizationId,
    member_id: p.memberId,
    meeting_id: p.meetingId,
    amount: Number(p.amount),
    upi_reference: p.upiReference,
    screenshot_url: p.screenshotUrl,
    rejection_reason: p.rejectionReason,
    created_at: p.createdAt.toISOString(),
    member: p.member ? { name: p.member.name, member_number: p.member.memberNumber } : null,
    meeting: p.meeting ? { month_year: p.meeting.monthYear } : null,
  }))

  return <AdminPaymentsClient proofs={safeProofs as any} />
}
