import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdminOrAbove, logActivity } from "@/lib/auth"

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const admin = await requireAdminOrAbove()

    const proof = await prisma.paymentProof.findFirst({
      where: {
        id: params.id,
        organizationId: admin.organizationId,
      },
    })

    if (!proof) {
      return NextResponse.json({ error: "Proof not found" }, { status: 404 })
    }

    if (proof.status !== "PENDING") {
      return NextResponse.json({ error: "Proof is not pending" }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.paymentProof.update({
        where: { id: params.id },
        data: {
          status: "VERIFIED",
          verifiedBy: admin.id,
          verifiedAt: new Date(),
        },
      })

      if (proof.meetingId) {
        const contrib = await tx.meetingContribution.findFirst({
          where: {
            meetingId: proof.meetingId,
            memberId: proof.memberId,
          },
        })

        if (contrib) {
          await tx.meetingContribution.update({
            where: { id: contrib.id },
            data: {
              savingsAmount: contrib.savingsAmount + proof.amount,
            },
          })
        }
      }

      await tx.notification.create({
        data: {
          organizationId: admin.organizationId,
          memberId: proof.memberId,
          title: "Payment Verified",
          message: `Your payment of ₹${(Number(proof.amount) / 100).toFixed(2)} has been verified.`,
          type: "PAYMENT_VERIFIED",
        },
      })

      await logActivity(tx, admin.id, admin.organizationId, "PAYMENT_VERIFIED", "payment_proofs", params.id, {
        amount: Number(proof.amount),
      })
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error?.message === "UNAUTHENTICATED" || error?.message === "UNAUTHORIZED" || error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHENTICATED" ? 401 : 403 })
    }
    console.error("Error verifying payment proof:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
