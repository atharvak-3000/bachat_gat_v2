import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdminOrAbove, logActivity } from "@/lib/auth"

export async function POST(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const performer = await requireAdminOrAbove()

    const target = await prisma.member.findUnique({
      where: { id },
    })

    if (!target) return NextResponse.json({ error: "Member not found" }, { status: 404 })
    if (target.organizationId !== performer.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
    if (id === performer.id) {
      return NextResponse.json({ error: "Cannot deactivate yourself" }, { status: 400 })
    }
    if (target.role === "SUPERADMIN") {
      return NextResponse.json({ error: "Cannot remove SuperAdmin" }, { status: 403 })
    }
    if (performer.role === "SUPERADMIN" && target.role !== "MEMBER") {
      return NextResponse.json({ error: "Admins can only deactivate Members" }, { status: 403 })
    }

    await prisma.member.update({
      where: { id },
      data: { isActive: false },
    })

    await logActivity(prisma, performer.id, performer.organizationId, "MEMBER_DEACTIVATED", "member", id, {
      name: target.name,
      role: target.role,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error?.message === "UNAUTHENTICATED" || error?.message === "UNAUTHORIZED" || error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHENTICATED" ? 401 : 403 })
    }
    console.error(error)
    return NextResponse.json({ error: "Failed to deactivate member" }, { status: 500 })
  }
}
