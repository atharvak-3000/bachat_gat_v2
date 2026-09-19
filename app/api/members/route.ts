import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { requireAdminOrAbove, logActivity, toSafeMember } from "@/lib/auth"

const createMemberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  name_marathi: z.string().optional(),
  phone: z.string().regex(/^\d{10}$/, "Invalid 10-digit phone number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  address: z.string().optional(),
  joining_date: z.string().optional(),
})

export async function GET(req: Request) {
  try {
    const performer = await requireAdminOrAbove()
    const url = new URL(req.url)
    const status = url.searchParams.get("status")

    const where: any = { organizationId: performer.organizationId }
    if (status) {
      where.status = status
    }

    const members = await prisma.member.findMany({
      where,
      orderBy: { memberNumber: "asc" },
    })

    const safeMembers = members.map((m: any) => toSafeMember(m))
    return NextResponse.json(safeMembers)
  } catch (error: any) {
    if (error?.message === "UNAUTHENTICATED" || error?.message === "UNAUTHORIZED" || error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHENTICATED" ? 401 : 403 })
    }
    console.error("GET /api/members error:", error)
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const performer = await requireAdminOrAbove()
    const body = await req.json()
    const parseResult = createMemberSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.errors[0].message }, { status: 400 })
    }

    const { name, name_marathi, phone, password, address, joining_date } = parseResult.data

    // Check if phone already exists in this Gat
    const existingPhone = await prisma.member.findFirst({
      where: {
        organizationId: performer.organizationId,
        phone: phone,
      },
    })

    if (existingPhone) {
      return NextResponse.json({ error: "A member with this phone number already exists in your Gat" }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const lastMember = await prisma.member.findFirst({
      where: { organizationId: performer.organizationId },
      orderBy: { memberNumber: "desc" },
    })
    const nextNumber = (lastMember?.memberNumber ?? 0) + 1

    const newMember = await prisma.member.create({
      data: {
        organizationId: performer.organizationId,
        name,
        nameMarathi: name_marathi || "",
        phone,
        passwordHash,
        address: address || null,
        joiningDate: joining_date ? new Date(joining_date) : new Date(),
        memberNumber: nextNumber,
        role: "MEMBER",
        status: "ACTIVE",
        isActive: true,
      },
    })

    await logActivity(prisma, performer.id, performer.organizationId, "MEMBER_ADDED", "member", newMember.id, {
      name,
      member_number: nextNumber,
    })

    return NextResponse.json(toSafeMember(newMember))
  } catch (error: any) {
    if (error?.message === "UNAUTHENTICATED" || error?.message === "UNAUTHORIZED" || error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHENTICATED" ? 401 : 403 })
    }
    console.error("POST /api/members error:", error)
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 })
  }
}
