import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { generateStatusChecksum, MERCHANT_ID, BASE_URL, PLANS } from "@/lib/phonepe"

export async function GET(req: Request) {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host")
  const proto = req.headers.get("x-forwarded-proto") || "http"
  const appUrl = host
    ? `${proto}://${host}`
    : process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  try {
    const { searchParams } = new URL(req.url)
    const transactionId = searchParams.get("transactionId")

    if (!transactionId) {
      return NextResponse.redirect(`${appUrl}/subscribe?payment=failed&reason=no_transaction_id`, 303)
    }

    const subscription = await prisma.subscription.findUnique({
      where: { phonepeMerchantTransactionId: transactionId },
      include: { organization: true },
    })

    if (!subscription) {
      return NextResponse.redirect(`${appUrl}/subscribe?payment=failed&reason=subscription_not_found`, 303)
    }

    if (subscription.status === "ACTIVE") {
      return NextResponse.redirect(`${appUrl}/dashboard?payment=success`, 303)
    }

    const checksum = generateStatusChecksum(transactionId)
    const response = await fetch(`${BASE_URL}/pg/v1/status/${MERCHANT_ID}/${transactionId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
        "X-MERCHANT-ID": MERCHANT_ID,
      },
    })

    if (!response.ok) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: "FAILED" },
      })
      return NextResponse.redirect(`${appUrl}/subscribe?payment=failed&reason=status_check_failed`, 303)
    }

    const responseData = await response.json()
    const isSuccess =
      responseData.success === true &&
      (responseData.code === "PAYMENT_SUCCESS" ||
        responseData.data?.responseCode === "SUCCESS" ||
        responseData.data?.state === "COMPLETED")

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
            phonepeTransactionId: responseData.data?.transactionId || null,
            paymentMethod: responseData.data?.paymentInstrument?.type || null,
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

      return NextResponse.redirect(`${appUrl}/dashboard?payment=success`, 303)
    } else {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: "FAILED" },
      })
      return NextResponse.redirect(`${appUrl}/subscribe?payment=failed`, 303)
    }
  } catch (error: any) {
    return NextResponse.redirect(`${appUrl}/subscribe?payment=failed&reason=internal_error`, 303)
  }
}
