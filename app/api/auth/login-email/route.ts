import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import { createAuthToken, toSafeMember } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const member = await prisma.member.findFirst({
      where: {
        email: email.trim().toLowerCase(),
        role: "SUPERADMIN",
      },
      include: { organization: true },
    })

    if (!member || !member.passwordHash) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const isMatch = await bcrypt.compare(password, member.passwordHash)
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    if (!member.isActive) {
      return NextResponse.json({ error: "Account is inactive" }, { status: 403 })
    }

    const token = await createAuthToken({
      memberId: member.id,
      organizationId: member.organizationId,
      role: member.role,
    })

    const response = NextResponse.json({
      success: true,
      member: toSafeMember(member),
    })

    response.cookies.set({
      name: "bb_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    })

    return response
  } catch (error: any) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
