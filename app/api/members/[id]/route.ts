import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdminOrAbove, logActivity, toSafeMember } from "@/lib/auth"

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const performer = await requireAdminOrAbove()

    const member = await prisma.member.findFirst({
      where: {
        id,
        organizationId: performer.organizationId,
      },
    })

    if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 })

    const [contributions, loans] = await Promise.all([
      prisma.meetingContribution.findMany({ where: { memberId: id } }),
      prisma.loan.findMany({ where: { organizationId: performer.organizationId, memberId: id } }),
    ])

    return NextResponse.json({
      member: toSafeMember(member),
      contributions: contributions ?? [],
      loans: loans ?? [],
    })
  } catch (error: any) {
    if (error?.message === "UNAUTHENTICATED" || error?.message === "UNAUTHORIZED" || error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHENTICATED" ? 401 : 403 })
    }
    console.error("[MEMBER_GET]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const performer = await requireAdminOrAbove()
    const body = await req.json()

    const existingMember = await prisma.member.findFirst({
      where: { id, organizationId: performer.organizationId },
    })

    if (!existingMember) return NextResponse.json({ error: "Member not found" }, { status: 404 })

    const data: any = {}
    if (body.name !== undefined) data.name = body.name
    if (body.phone !== undefined) data.phone = body.phone
    if (body.address !== undefined) data.address = body.address
    if (body.name_marathi !== undefined) data.nameMarathi = body.name_marathi

    if (performer.role === "SUPERADMIN" && body.joining_date !== undefined) {
      data.joiningDate = new Date(body.joining_date)
    }

    const updated = await prisma.member.update({
      where: { id },
      data,
    })

    await logActivity(prisma, performer.id, performer.organizationId, "MEMBER_UPDATED", "member", id, data)

    return NextResponse.json(toSafeMember(updated))
  } catch (error: any) {
    if (error?.message === "UNAUTHENTICATED" || error?.message === "UNAUTHORIZED" || error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHENTICATED" ? 401 : 403 })
    }
    console.error("[MEMBER_PATCH]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
