import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentMember, requireAdminOrAbove, logActivity, toSafeMember } from "@/lib/auth"
import { z } from "zod"

const paymentProofSchema = z.object({
  amount: z.number().positive("Amount must be greater than zero"),
  upi_reference: z.string().optional(),
  meeting_id: z.string().optional(),
  screenshot_url: z.string().min(1, "Screenshot URL is required"),
})

export async function GET(request: Request) {
  try {
    const admin = await requireAdminOrAbove()

    const proofs = await prisma.paymentProof.findMany({
      where: { organizationId: admin.organizationId },
      include: {
        member: true,
        meeting: { select: { monthYear: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    const safeProofs = proofs.map((p: any) => ({
      ...p,
      member: toSafeMember(p.member),
    }))

    return NextResponse.json({ proofs: safeProofs })
  } catch (error: any) {
    if (error?.message === "UNAUTHENTICATED" || error?.message === "UNAUTHORIZED" || error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHENTICATED" ? 401 : 403 })
    }
    console.error("Error fetching payment proofs:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const member = await getCurrentMember()
    if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const parseResult = paymentProofSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.errors[0].message }, { status: 400 })
    }

    const { amount, upi_reference, meeting_id, screenshot_url } = parseResult.data

    await prisma.$transaction(async (tx: any) => {
      await tx.paymentProof.create({
        data: {
          organizationId: member.organizationId,
          memberId: member.id,
          meetingId: meeting_id || null,
          amount: BigInt(amount),
          upiReference: upi_reference || null,
          screenshotUrl: screenshot_url,
          status: "PENDING",
        },
      })

      const admins = await tx.member.findMany({
        where: {
          organizationId: member.organizationId,
          role: { in: ["SUPERADMIN", "ADMIN"] },
        },
        select: { id: true },
      })

      if (admins.length > 0) {
        await tx.notification.createMany({
          data: admins.map((admin: any) => ({
            organizationId: member.organizationId,
            memberId: admin.id,
            title: "New Payment Proof",
            message: `New payment proof of ₹${(amount / 100).toFixed(2)} from ${member.name}`,
            type: "GENERAL",
          })),
        })
      }

      await logActivity(tx, member.id, member.organizationId, "PAYMENT_PROOF_SUBMITTED", "payment_proofs", null, { amount })
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error submitting payment proof:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
