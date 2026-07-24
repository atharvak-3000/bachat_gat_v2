import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json({ error: "Token and new password are required" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 })
    }

    const member = await prisma.member.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiresAt: {
          gt: new Date(),
        },
      },
    })

    if (!member) {
      return NextResponse.json(
        { error: "Invalid or expired password reset token" },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)

    await prisma.member.update({
      where: { id: member.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiresAt: null,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Password has been successfully reset.",
    })
  } catch (error: any) {
    console.error("[Reset Password Error]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
