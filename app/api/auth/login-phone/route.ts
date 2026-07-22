import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import { createAuthToken, toSafeMember } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const { phone, password, groupCode } = await req.json()

    if (!phone || !password) {
      return NextResponse.json({ error: "Phone and password are required" }, { status: 400 })
    }

    const cleanPhone = phone.trim()
    let whereClause: any = { phone: cleanPhone }

    if (groupCode) {
      const org = await prisma.organization.findUnique({
        where: { groupCode: groupCode.trim().toUpperCase() },
      })
      if (!org) {
        return NextResponse.json({ error: "Invalid group code" }, { status: 400 })
      }
      whereClause.organizationId = org.id
    }

    const member = await prisma.member.findFirst({
      where: whereClause,
      include: { organization: true },
    })

    if (!member || !member.passwordHash) {
      return NextResponse.json({ error: "Invalid phone or password" }, { status: 401 })
    }

    const isMatch = await bcrypt.compare(password, member.passwordHash)
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid phone or password" }, { status: 401 })
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
