import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentMember } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const member = await getCurrentMember()

    if (!member || !member.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (member.role !== "SUPERADMIN" && member.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Only admins can start a free trial" }, { status: 403 })
    }

    const body = await req.json()
    const { plan, maxMembers } = body

    if (!plan || !maxMembers || !["BASIC", "STANDARD", "PREMIUM"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan or members count request payload" }, { status: 400 })
    }

    const now = new Date()
    const trialEndsAt = new Date()
    trialEndsAt.setDate(now.getDate() + 7)

    const amount = plan === "BASIC" ? 15000 : plan === "STANDARD" ? 25000 : 50000

    await prisma.$transaction(async (tx) => {
      await tx.organization.update({
        where: { id: member.organizationId },
        data: {
          subscriptionPlan: plan,
          subscriptionStatus: "TRIAL",
          trialEndsAt: trialEndsAt,
          subscriptionExpiresAt: trialEndsAt,
          maxMembers: maxMembers,
        },
      })

      await tx.subscription.create({
        data: {
          organizationId: member.organizationId,
          plan: plan,
          amount: BigInt(amount),
          maxMembers: maxMembers,
          status: "TRIAL",
          phonepeMerchantTransactionId: `TRIAL_${member.organizationId.replace(/-/g, "").substring(0, 10)}_${Date.now()}`.toUpperCase(),
          startsAt: now,
          expiresAt: trialEndsAt,
          paymentMethod: "TRIAL",
        },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
