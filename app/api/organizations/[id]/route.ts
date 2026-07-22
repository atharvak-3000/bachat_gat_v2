import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireSuperAdmin, logActivity } from "@/lib/auth"
import { toP } from "@/lib/calculations"

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const performer = await requireSuperAdmin()

    if (id !== performer.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await req.json()
    const allowedFields = [
      "name",
      "village",
      "taluka",
      "district",
      "meeting_frequency",
      "monthly_saving_amount",
      "default_interest_rate",
      "default_penalty_amount",
      "max_loan_limit",
      "logo_url",
      "max_guarantor_loans",
    ]

    const data: any = {}
    if (body.name !== undefined) data.name = body.name
    if (body.village !== undefined) data.village = body.village
    if (body.taluka !== undefined) data.taluka = body.taluka
    if (body.district !== undefined) data.district = body.district
    if (body.meeting_frequency !== undefined) data.meetingFrequency = body.meeting_frequency
    if (body.monthly_saving_amount !== undefined)
      data.monthlySavingAmount = BigInt(toP(body.monthly_saving_amount))
    if (body.default_interest_rate !== undefined)
      data.defaultInterestRate = body.default_interest_rate
    if (body.default_penalty_amount !== undefined)
      data.defaultPenaltyAmount = BigInt(toP(body.default_penalty_amount))
    if (body.max_loan_limit !== undefined) data.maxLoanLimit = BigInt(toP(body.max_loan_limit))
    if (body.logo_url !== undefined) data.logoUrl = body.logo_url
    if (body.max_guarantor_loans !== undefined) data.maxGuarantorLoans = body.max_guarantor_loans

    const updatedOrg = await prisma.organization.update({
      where: { id },
      data,
    })

    await logActivity(prisma, performer.id, performer.organizationId, "SETTINGS_UPDATED", "organization", id, data)

    return NextResponse.json(updatedOrg)
  } catch (error: any) {
    if (error?.message === "UNAUTHENTICATED" || error?.message === "UNAUTHORIZED" || error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHENTICATED" ? 401 : 403 })
    }
    console.error("PATCH /api/organizations/[id] error:", error)
    return NextResponse.json({ error: "Failed to update organization" }, { status: 500 })
  }
}
