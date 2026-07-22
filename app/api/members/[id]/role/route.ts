import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireSuperAdmin, logActivity, toSafeMember } from "@/lib/auth"
import { z } from "zod"

const roleSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"], { message: "Invalid role. Can only assign ADMIN or MEMBER." }),
})

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const performer = await requireSuperAdmin()
    const body = await req.json()
    const parseResult = roleSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.errors[0].message }, { status: 400 })
    }

    const { role: newRole } = parseResult.data

    if (id === performer.id) {
      return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 })
    }

    const target = await prisma.member.findUnique({
      where: { id },
    })

    if (!target) return NextResponse.json({ error: "Member not found" }, { status: 404 })

    if (target.organizationId !== performer.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    if (target.role === "SUPERADMIN") {
      return NextResponse.json({ error: "Cannot change SuperAdmin role" }, { status: 403 })
    }

    if (target.status !== "ACTIVE") {
      return NextResponse.json({ error: "Member must be active" }, { status: 400 })
    }

    const oldRole = target.role

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.member.update({
        where: { id },
        data: { role: newRole },
      })

      await tx.notification.create({
        data: {
          memberId: id,
          organizationId: performer.organizationId,
          title: "भूमिका बदलली / Role Updated",
          message:
            newRole === "ADMIN"
              ? "तुम्हाला Admin म्हणून नियुक्त केले आहे. / You have been assigned as Admin."
              : "तुमची Admin भूमिका काढली आहे. / Your Admin role has been removed.",
          type: "ROLE_CHANGED",
        },
      })

      await logActivity(tx, performer.id, performer.organizationId, "ROLE_CHANGED", "member", id, {
        from: oldRole,
        to: newRole,
        member_name: target.name,
      })

      return res
    })

    return NextResponse.json({
      ...toSafeMember(updated),
      roleChanged: true,
      message: "Role updated. Member must sign out and sign in again to see changes.",
    })
  } catch (error: any) {
    if (error?.message === "UNAUTHENTICATED" || error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHENTICATED" ? 401 : 403 })
    }
    console.error("[ROLE_CHANGE]", error)
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 })
  }
}
