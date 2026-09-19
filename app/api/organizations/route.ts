import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import { logActivity, createAuthToken } from "@/lib/auth"
import { toP } from "@/lib/calculations"
import { z } from "zod"

const createOrgSchema = z.object({
  name: z.string().min(1, "Name is required"),
  village: z.string().min(1, "Village is required"),
  taluka: z.string().optional(),
  district: z.string().min(1, "District is required"),
  monthly_saving_amount: z.number().nonnegative(),
  default_interest_rate: z.number().optional(),
  default_penalty_amount: z.number().optional(),
  max_loan_limit: z.number().optional(),
  meeting_frequency: z.string().optional(),
  admin_name: z.string().optional(),
  phone: z.string().regex(/^\d{10}$/, "Invalid 10-digit phone number").optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  email: z.string().email("Invalid email").optional(),
})

function generateGroupCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parseResult = createOrgSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.errors[0].message }, { status: 400 })
    }

    const {
      name,
      village,
      taluka,
      district,
      monthly_saving_amount,
      default_interest_rate,
      default_penalty_amount,
      max_loan_limit,
      meeting_frequency,
      admin_name,
      phone,
      password,
      email,
    } = parseResult.data

    let groupCode = generateGroupCode()
    let codeExists = true
    while (codeExists) {
      const existing = await prisma.organization.findUnique({
        where: { groupCode },
      })
      if (!existing) codeExists = false
      else groupCode = generateGroupCode()
    }

    const passwordHash = password ? await bcrypt.hash(password, 10) : null

    const result = await prisma.$transaction(async (tx: any) => {
      const org = await tx.organization.create({
        data: {
          name,
          groupCode,
          village,
          taluka: taluka || "",
          district,
          monthlySavingAmount: BigInt(toP(monthly_saving_amount || 0)),
          defaultInterestRate: default_interest_rate || 2.0,
          defaultPenaltyAmount: BigInt(toP(default_penalty_amount || 0)),
          maxLoanLimit: BigInt(toP(max_loan_limit || 0)),
          meetingFrequency: meeting_frequency || "MONTHLY",
          isApproved: true,
          subscriptionStatus: "ACTIVE",
          subscriptionPlan: "FREE",
          maxMembers: 999999,
        },
      })

      const member = await tx.member.create({
        data: {
          organizationId: org.id,
          name: admin_name || "SuperAdmin",
          phone: phone || "9000000000",
          email: email ? email.trim().toLowerCase() : null,
          passwordHash,
          memberNumber: 1,
          role: "SUPERADMIN",
          isActive: true,
          status: "ACTIVE",
        },
      })

      await logActivity(tx, member.id, org.id, "GAT_CREATED", "organization", org.id, {
        name,
        group_code: groupCode,
      })

      const token = await createAuthToken({
        memberId: member.id,
        organizationId: org.id,
        role: member.role,
      })

      return { org, token }
    })

    const response = NextResponse.json({
      success: true,
      organization_id: result.org.id,
      group_code: result.org.groupCode,
    })

    response.cookies.set({
      name: "bb_token",
      value: result.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    })

    return response
  } catch (error: any) {
    console.error("POST /api/organizations error:", error)
    return NextResponse.json({ error: "Failed to create organization" }, { status: 500 })
  }
}
