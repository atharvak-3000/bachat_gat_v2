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
    const { reason } = await request.json()

    if (!reason) {
      return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 })
    }

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
          status: "REJECTED",
          rejectionReason: reason,
        },
      })

      await tx.notification.create({
        data: {
          organizationId: admin.organizationId,
          memberId: proof.memberId,
          title: "Payment Proof Rejected",
          message: `Your payment proof of ₹${(Number(proof.amount) / 100).toFixed(2)} was rejected. Reason: ${reason}`,
          type: "GENERAL",
        },
      })

      await logActivity(tx, admin.id, admin.organizationId, "PAYMENT_REJECTED", "payment_proofs", params.id, {
        amount: Number(proof.amount),
        reason,
      })
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error?.message === "UNAUTHENTICATED" || error?.message === "UNAUTHORIZED" || error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHENTICATED" ? 401 : 403 })
    }
    console.error("Error rejecting payment proof:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
