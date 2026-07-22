import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdminOrAbove, logActivity } from "@/lib/auth"

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    let reason = ""
    const contentType = req.headers.get("content-type") ?? ""
    if (contentType.includes("application/json")) {
      reason = ((await req.json()) as { reason?: string }).reason ?? ""
    } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const form = await req.formData()
      reason = String(form.get("reason") ?? "")
    }

    const performer = await requireAdminOrAbove()

    const target = await prisma.member.findFirst({
      where: {
        id,
        organizationId: performer.organizationId,
      },
    })

    if (!target) return NextResponse.json({ error: "Member not found" }, { status: 404 })
    if (target.status !== "PENDING" && target.status !== "ACTIVE") {
      return NextResponse.json({ error: "Member must be pending or active" }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.member.update({
        where: { id: target.id },
        data: { status: "REJECTED", isActive: false },
      })

      await tx.notification.create({
        data: {
          memberId: target.id,
          organizationId: performer.organizationId,
          title: "Request Not Approved",
          message: `Your request was not approved. Reason: ${reason || "Not provided"}`,
          type: "GENERAL",
        },
      })

      await logActivity(tx, performer.id, performer.organizationId, "MEMBER_REJECTED", "member", target.id, {
        member_name: target.name,
        reason: reason ?? "",
      })
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error?.message === "UNAUTHENTICATED" || error?.message === "UNAUTHORIZED" || error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHENTICATED" ? 401 : 403 })
    }
    console.error("[MEMBER_REJECT_POST]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
