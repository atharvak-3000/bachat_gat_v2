import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import { getAuthForApi, unauthorized } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const { member } = await getAuthForApi()
    if (!member) {
      return unauthorized()
    }

    const { currentPassword, newPassword } = await req.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters long" },
        { status: 400 }
      )
    }

    const dbMember = await prisma.member.findUnique({
      where: { id: member.id },
    })

    if (!dbMember || !dbMember.passwordHash) {
      return NextResponse.json(
        { error: "Member profile or password missing" },
        { status: 400 }
      )
    }

    const isMatch = await bcrypt.compare(currentPassword, dbMember.passwordHash)
    if (!isMatch) {
      return NextResponse.json(
        { error: "Incorrect current password" },
        { status: 401 }
      )
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)

    await prisma.member.update({
      where: { id: member.id },
      data: { passwordHash },
    })

    return NextResponse.json({
      success: true,
      message: "Your password has been changed successfully.",
    })
  } catch (error: any) {
    console.error("[Change Password Error]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
