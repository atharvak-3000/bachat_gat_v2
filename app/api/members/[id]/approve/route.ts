import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdminOrAbove, logActivity } from "@/lib/auth"

export async function POST(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const performer = await requireAdminOrAbove()

    const target = await prisma.member.findFirst({
      where: {
        id,
        organizationId: performer.organizationId,
      },
    })

    if (!target) return NextResponse.json({ error: "Member not found" }, { status: 404 })
    if (target.status !== "PENDING") return NextResponse.json({ error: "Member is not pending" }, { status: 400 })
    if (target.role !== "MEMBER") return NextResponse.json({ error: "Invalid role for approval" }, { status: 400 })

    await prisma.$transaction(async (tx: any) => {
      await tx.member.update({
        where: { id: target.id },
        data: { status: "ACTIVE", isActive: true },
      })

      await tx.notification.create({
        data: {
          memberId: target.id,
          organizationId: performer.organizationId,
          title: "Request Approved!",
          message: `Welcome to ${performer.organization.name}! You can now login.`,
          type: "GENERAL",
        },
      })

      await logActivity(tx, performer.id, performer.organizationId, "MEMBER_APPROVED", "member", target.id, {
        member_name: target.name,
        approved_by: performer.name,
      })
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error?.message === "UNAUTHENTICATED" || error?.message === "UNAUTHORIZED" || error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHENTICATED" ? 401 : 403 })
    }
    console.error("[MEMBER_APPROVE_POST]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
