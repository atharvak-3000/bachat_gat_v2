import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getAuthForApi, forbidden } from "@/lib/auth"
import { z } from "zod"

const kycSchema = z.object({
  status: z.enum(["VERIFIED", "REJECTED", "PENDING"], { message: "Invalid status" }),
  notes: z.string().optional(),
})

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { member } = await getAuthForApi()
    if (!member || !["SUPERADMIN", "ADMIN"].includes(member.role)) return forbidden()

    const { id } = await context.params
    const body = await req.json()
    const parseResult = kycSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.errors[0].message }, { status: 400 })
    }

    const { status, notes } = parseResult.data

    const targetMember = await prisma.member.findFirst({
      where: { id, organizationId: member.organizationId },
    })

    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    await prisma.member.update({
      where: { id: targetMember.id },
      data: {
        kycStatus: status,
        kycNotes: notes || "",
        kycVerifiedBy: member.id,
        kycVerifiedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to update KYC status" }, { status: 500 })
  }
}
