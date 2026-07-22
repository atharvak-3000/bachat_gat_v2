import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireSuperAdmin, logActivity } from "@/lib/auth"

export async function POST(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const performer = await requireSuperAdmin()

    const target = await prisma.member.findFirst({
      where: {
        id,
        organizationId: performer.organizationId,
      },
    })

    if (!target) return NextResponse.json({ error: "Member not found" }, { status: 404 })
    if (id === performer.id) return NextResponse.json({ error: "Cannot deactivate yourself" }, { status: 400 })
    if (performer.role === "SUPERADMIN" && target.role !== "MEMBER") {
      return NextResponse.json({ error: "Admins can only deactivate members" }, { status: 403 })
    }

    await prisma.member.update({
      where: { id: target.id },
      data: { isActive: false, status: "REJECTED" },
    })

    await logActivity(prisma, performer.id, performer.organizationId, "MEMBER_DEACTIVATED", "member", id, {
      member_name: target.name,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error?.message === "UNAUTHENTICATED" || error?.message === "UNAUTHORIZED" || error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHENTICATED" ? 401 : 403 })
    }
    console.error("[MEMBER_DEACTIVATE_POST]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
