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

let cachedOrganizations: { data: any[]; timestamp: number } | null = null
const CACHE_TTL_MS = 60 * 1000 // 60s cache

async function fetchOrgsFromDb(whereClause: any, retries = 2): Promise<any[]> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const organizations = await prisma.organization.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          nameMarathi: true,
          village: true,
          taluka: true,
          district: true,
          groupCode: true,
          isApproved: true,
          _count: {
            select: {
              members: {
                where: { isActive: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
      return organizations
    } catch (err: any) {
      console.warn(`[GET /api/organizations] Attempt ${attempt + 1} error:`, err?.message || err)
      if (attempt === retries) throw err
      await new Promise((r) => setTimeout(r, 500))
    }
  }
  return []
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q")?.trim()

    // Serve fresh in-memory cache if available and not a search query
    if (!q && cachedOrganizations && Date.now() - cachedOrganizations.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(
        {
          success: true,
          organizations: cachedOrganizations.data,
          cached: true,
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
          },
        }
      )
    }

    let whereClause: any = {}
    if (q) {
      whereClause = {
        OR: [
          { name: { contains: q } },
          { nameMarathi: { contains: q } },
          { village: { contains: q } },
          { taluka: { contains: q } },
          { district: { contains: q } },
          { groupCode: { contains: q } },
        ],
      }
    }

    try {
      const organizations = await fetchOrgsFromDb(whereClause, 2)

      const formatted = organizations.map((org: any) => ({
        id: org.id,
        name: org.name,
        nameMarathi: org.nameMarathi || "",
        village: org.village,
        taluka: org.taluka || "",
        district: org.district,
        groupCode: org.groupCode,
        isApproved: org.isApproved,
        memberCount: org._count?.members ?? 0,
      }))

      if (!q) {
        cachedOrganizations = {
          data: formatted,
          timestamp: Date.now(),
        }
      }

      return NextResponse.json(
        {
          success: true,
          organizations: formatted,
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
          },
        }
      )
    } catch (dbErr: any) {
      // If DB failed but we have any cached data, serve it gracefully
      if (cachedOrganizations && cachedOrganizations.data.length > 0) {
        console.warn("[GET /api/organizations] DB failed, serving fallback cached organizations")
        let filtered = cachedOrganizations.data
        if (q) {
          const lowerQ = q.toLowerCase()
          filtered = filtered.filter(
            (o) =>
              o.name?.toLowerCase().includes(lowerQ) ||
              o.village?.toLowerCase().includes(lowerQ) ||
              o.district?.toLowerCase().includes(lowerQ) ||
              o.groupCode?.toLowerCase().includes(lowerQ)
          )
        }
        return NextResponse.json({
          success: true,
          organizations: filtered,
          fallback: true,
        })
      }
      throw dbErr
    }
  } catch (error: any) {
    console.error("GET /api/organizations fatal error:", error)
    return NextResponse.json({ error: "Failed to fetch organizations" }, { status: 500 })
  }
}


