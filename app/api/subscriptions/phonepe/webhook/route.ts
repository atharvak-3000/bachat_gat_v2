import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyChecksum, PLANS } from "@/lib/phonepe"

export async function POST(req: Request) {
  try {
    const xVerify = req.headers.get("x-verify")
    if (!xVerify) {
      return NextResponse.json({ error: "Missing x-verify header" }, { status: 400 })
    }

    const rawBody = await req.text()
    const isChecksumValid = verifyChecksum(xVerify, rawBody)

    if (!isChecksumValid) {
      return NextResponse.json({ error: "Invalid checksum" }, { status: 401 })
    }

    const body = JSON.parse(rawBody)
    if (!body.response) {
      return NextResponse.json({ error: "Invalid webhook payload structure" }, { status: 400 })
    }

    const decodedString = Buffer.from(body.response, "base64").toString("utf8")
    const responseData = JSON.parse(decodedString)

    const merchantTransactionId = responseData.merchantTransactionId
    if (!merchantTransactionId) {
      return NextResponse.json({ error: "Missing merchantTransactionId in response" }, { status: 400 })
    }

    const subscription = await prisma.subscription.findUnique({
      where: { phonepeMerchantTransactionId: merchantTransactionId },
      include: { organization: true },
    })

    if (!subscription) {
      return NextResponse.json({ error: "Subscription record not found" }, { status: 404 })
    }

    if (subscription.status === "ACTIVE") {
      return NextResponse.json({ success: true })
    }

    const isSuccess =
      responseData.responseCode === "SUCCESS" ||
      responseData.state === "COMPLETED" ||
      responseData.code === "PAYMENT_SUCCESS"

    if (isSuccess) {
      const now = new Date()
      const org = subscription.organization
      const currentExpiry = org?.subscriptionExpiresAt ? new Date(org.subscriptionExpiresAt) : null
      const startFrom = currentExpiry && currentExpiry > now ? currentExpiry : now
      const expiresAt = new Date(startFrom.getTime() + 30 * 24 * 60 * 60 * 1000)

      const planDetails = PLANS[subscription.plan as keyof typeof PLANS]
      const maxMembers = planDetails ? planDetails.maxMembers : 10

      await prisma.$transaction(async (tx: any) => {
        await tx.subscription.update({
          where: { id: subscription.id },
          data: {
            status: "ACTIVE",
            phonepeTransactionId: responseData.transactionId || null,
            paymentMethod: responseData.paymentInstrument?.type || null,
            startsAt: startFrom,
            expiresAt: expiresAt,
          },
        })

        await tx.organization.update({
          where: { id: subscription.organizationId },
          data: {
            subscriptionPlan: subscription.plan,
            subscriptionStatus: "ACTIVE",
            subscriptionExpiresAt: expiresAt,
            maxMembers: maxMembers,
          },
        })
      })
    } else {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: "FAILED" },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
