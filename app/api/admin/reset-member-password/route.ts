import { NextResponse, type NextRequest } from "next/server"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import { getAuthForApi, forbidden, unauthorized, logActivity } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { member } = await getAuthForApi()
    if (!member) {
      return unauthorized()
    }

    const allowedRoles = ["SUPERADMIN", "ADMIN"]
    if (!allowedRoles.includes(member.role)) {
      return forbidden()
    }

    const { memberId, newPassword } = await request.json()
    if (!memberId || !newPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 })
    }

    const targetMember = await prisma.member.findUnique({
      where: { id: memberId },
    })

    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    if (targetMember.organizationId !== member.organization_id) {
      return forbidden()
    }

    if (member.role === "ADMIN" && targetMember.role !== "MEMBER") {
      return NextResponse.json({ error: "ADMINs can only reset passwords for standard MEMBERs." }, { status: 403 })
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)

    await prisma.$transaction(async (tx) => {
      await tx.member.update({
        where: { id: targetMember.id },
        data: { passwordHash },
      })

      await logActivity(tx, member.id, member.organization_id, "RESET_MEMBER_PASSWORD", "member", targetMember.id, {
        reset_by_role: member.role,
        member_name: targetMember.name,
      })
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("[Reset Password API] Exception:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
