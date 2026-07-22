import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentMember } from "@/lib/auth"
import { getPlanForMembers, generateChecksum, MERCHANT_ID, BASE_URL, PLANS } from "@/lib/phonepe"

export async function POST(req: Request) {
  try {
    const member = await getCurrentMember()

    if (!member || !member.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (member.role !== "SUPERADMIN" && member.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Only admins can manage subscriptions" }, { status: 403 })
    }

    const memberCount = await prisma.member.count({
      where: {
        organizationId: member.organizationId,
        status: "ACTIVE",
      },
    })

    let planId: string | undefined
    try {
      const body = await req.json()
      planId = body.plan || body.planId
    } catch {
      // Body might be empty
    }

    let plan = getPlanForMembers(memberCount)

    if (planId) {
      const selectedPlan = PLANS[planId as keyof typeof PLANS]
      if (!selectedPlan) {
        return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 })
      }
      if (memberCount > selectedPlan.maxMembers) {
        return NextResponse.json(
          {
            error: `Selected plan allows up to ${selectedPlan.maxMembers} members, but you have ${memberCount} active members.`,
          },
          { status: 400 }
        )
      }
      plan = selectedPlan
    }

    const cleanOrgId = member.organizationId.replace(/-/g, "").substring(0, 10)
    const merchantTransactionId = `TXN${cleanOrgId}${Date.now()}`.toUpperCase()

    const subscription = await prisma.subscription.create({
      data: {
        organizationId: member.organizationId,
        plan: plan.id,
        amount: BigInt(plan.amount),
        maxMembers: plan.maxMembers,
        status: "PENDING",
        phonepeMerchantTransactionId: merchantTransactionId,
      },
    })

    const host = req.headers.get("x-forwarded-host") || req.headers.get("host")
    const proto = req.headers.get("x-forwarded-proto") || "http"
    const appUrl = host
      ? `${proto}://${host}`
      : process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const redirectUrl = `${appUrl}/api/subscriptions/phonepe/callback?transactionId=${merchantTransactionId}`
    const callbackUrl = `${appUrl}/api/subscriptions/phonepe/webhook`

    const payload = {
      merchantId: MERCHANT_ID,
      merchantTransactionId: merchantTransactionId,
      merchantUserId: `MUID${member.organizationId.replace(/-/g, "").substring(0, 20)}`.toUpperCase(),
      amount: plan.amount,
      redirectUrl: redirectUrl,
      redirectMode: "REDIRECT",
      callbackUrl: callbackUrl,
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    }

    const { base64Payload, checksum } = generateChecksum(payload, "/pg/v1/pay")

    const response = await fetch(`${BASE_URL}/pg/v1/pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
        Accept: "application/json",
      },
      body: JSON.stringify({ request: base64Payload }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: "FAILED" },
      })
      return NextResponse.json({ error: `PhonePe API error: ${errorText}` }, { status: 502 })
    }

    const responseData = await response.json()

    if (responseData.success && responseData.data?.instrumentResponse?.redirectInfo?.url) {
      return NextResponse.json({ url: responseData.data.instrumentResponse.redirectInfo.url })
    } else {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: "FAILED" },
      })
      return NextResponse.json({ error: responseData.message || "Failed to initiate transaction" }, { status: 502 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
