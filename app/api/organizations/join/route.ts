import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import { createAuthToken, toSafeMember } from "@/lib/auth"
import { z } from "zod"

const joinSchema = z.object({
  orgId: z.string().min(1, "orgId is required"),
  name: z.string().min(1, "Name is required"),
  phone: z.string().regex(/^\d{10}$/, "Invalid 10-digit phone number"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parseResult = joinSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.errors[0].message }, { status: 400 })
    }

    const { orgId, name, phone, password } = parseResult.data

    const existingMember = await prisma.member.findFirst({
      where: {
        organizationId: orgId,
        phone,
      },
    })

    const passwordHash = password ? await bcrypt.hash(password, 10) : null

    if (existingMember) {
      if (existingMember.passwordHash && existingMember.isActive) {
        return NextResponse.json(
          { error: "This phone number is already registered in this group. Please use a different number." },
          { status: 409 }
        )
      }

      const updatedMember = await prisma.member.update({
        where: { id: existingMember.id },
        data: {
          passwordHash: passwordHash || existingMember.passwordHash,
          status: "PENDING",
          isActive: false,
        },
      })

      const token = await createAuthToken({
        memberId: updatedMember.id,
        organizationId: updatedMember.organizationId,
        role: updatedMember.role,
      })

      const response = NextResponse.json({
        success: true,
        redirect: "/pending",
        member: toSafeMember(updatedMember),
      })

      response.cookies.set({
        name: "bb_token",
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      })

      return response
    } else {
      const maxRow = await prisma.member.findFirst({
        where: { organizationId: orgId },
        orderBy: { memberNumber: "desc" },
      })

      const nextNumber = (maxRow?.memberNumber || 0) + 1

      const newMember = await prisma.member.create({
        data: {
          organizationId: orgId,
          name,
          phone,
          passwordHash,
          role: "MEMBER",
          status: "PENDING",
          isActive: false,
          memberNumber: nextNumber,
          joiningDate: new Date(),
        },
      })

      const token = await createAuthToken({
        memberId: newMember.id,
        organizationId: newMember.organizationId,
        role: newMember.role,
      })

      const response = NextResponse.json({
        success: true,
        redirect: "/pending",
        member: toSafeMember(newMember),
      })

      response.cookies.set({
        name: "bb_token",
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      })

      return response
    }
  } catch (error: any) {
    console.error("Join API error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
