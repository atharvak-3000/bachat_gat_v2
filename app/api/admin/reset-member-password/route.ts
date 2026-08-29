import { NextResponse, type NextRequest } from "next/server"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import prisma from "@/lib/prisma"
import { getAuthForApi, forbidden, unauthorized, logActivity } from "@/lib/auth"

function generateTempPassword(length = 8) {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789"
  let pwd = "Bg@"
  for (let i = 0; i < length - 3; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return pwd
}

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

    const body = await request.json().catch(() => ({}))
    const { memberId, newPassword } = body
    if (!memberId) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 })
    }

    let passwordToUse = newPassword
    if (passwordToUse) {
      if (passwordToUse.length < 8) {
        return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 })
      }
    } else {
      passwordToUse = generateTempPassword(8)
    }

    const targetMember = await prisma.member.findUnique({
      where: { id: memberId },
    })

    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    const callerOrgId = member.organization_id || member.organizationId
    if (targetMember.organizationId !== callerOrgId) {
      return NextResponse.json(
        { error: "Forbidden: Cannot reset password for a member in a different organization." },
        { status: 403 }
      )
    }

    if (member.role === "ADMIN" && targetMember.role !== "MEMBER") {
      return NextResponse.json({ error: "ADMINs can only reset passwords for standard MEMBERs." }, { status: 403 })
    }

    const passwordHash = await bcrypt.hash(passwordToUse, 10)

    await prisma.$transaction(async (tx: any) => {
      await tx.member.update({
        where: { id: targetMember.id },
        data: {
          passwordHash,
          resetToken: null,
          resetTokenExpiresAt: null,
        },
      })

      await logActivity(tx, member.id, targetMember.organizationId, "RESET_MEMBER_PASSWORD", "member", targetMember.id, {
        reset_by_role: member.role,
        member_name: targetMember.name,
      })
    })

    return NextResponse.json({
      success: true,
      temporaryPassword: passwordToUse,
      message: "Password reset successfully.",
    })
  } catch (err: any) {
    console.error("[Reset Password API] Exception:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

