import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { cache } from "react"
import { jwtVerify, SignJWT } from "jose"
import prisma, { toPlainObject } from "@/lib/prisma"
import type { Member, Organization } from "@/types"

export type MemberWithOrg = Member & { organization: Organization }

const COOKIE_NAME = "bb_token"
const JWT_SECRET_BYTES = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-super-secret-jwt-key-bachatgat-2026"
)

export async function createAuthToken(payload: {
  memberId: string
  organizationId: string
  role: string
}) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET_BYTES)
}

export async function verifyAuthToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET_BYTES)
    return payload as { memberId: string; organizationId: string; role: string }
  } catch {
    return null
  }
}

export function toSafeMember<T extends Record<string, any>>(member: T | null | undefined): Omit<T, "passwordHash"> | null {
  if (!member) return null
  const { passwordHash, ...safeMember } = member as any
  const orgId = safeMember.organization_id || safeMember.organizationId
  const rawOrg = safeMember.organization
  const org = rawOrg
    ? {
        ...rawOrg,
        group_code: rawOrg.group_code || rawOrg.groupCode,
        groupCode: rawOrg.groupCode || rawOrg.group_code,
        subscription_status: rawOrg.subscription_status || rawOrg.subscriptionStatus,
        subscriptionStatus: rawOrg.subscriptionStatus || rawOrg.subscription_status,
        subscription_plan: rawOrg.subscription_plan || rawOrg.subscriptionPlan,
        subscriptionPlan: rawOrg.subscriptionPlan || rawOrg.subscription_plan,
        subscription_expires_at: rawOrg.subscription_expires_at || rawOrg.subscriptionExpiresAt,
        subscriptionExpiresAt: rawOrg.subscriptionExpiresAt || rawOrg.subscription_expires_at,
        trial_ends_at: rawOrg.trial_ends_at || rawOrg.trialEndsAt,
        trialEndsAt: rawOrg.trialEndsAt || rawOrg.trial_ends_at,
        max_members: rawOrg.max_members ?? rawOrg.maxMembers,
        maxMembers: rawOrg.maxMembers ?? rawOrg.max_members,
        max_loan_limit: rawOrg.max_loan_limit ?? rawOrg.maxLoanLimit,
        maxLoanLimit: rawOrg.maxLoanLimit ?? rawOrg.max_loan_limit,
      }
    : rawOrg

  return toPlainObject({
    ...safeMember,
    organization_id: orgId,
    organizationId: orgId,
    organization: org,
  })
}

export const getCurrentUser = cache(async () => {
  const member = await getCurrentMember()
  if (!member) return null
  return { id: member.id, email: member.email, phone: member.phone, role: member.role }
})

export const getCurrentMember = cache(async (): Promise<MemberWithOrg | null> => {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return null

    const payload = await verifyAuthToken(token)
    if (!payload?.memberId) return null

    const member = await prisma.member.findUnique({
      where: { id: payload.memberId },
      include: { organization: true },
    })

    if (!member || !member.isActive) return null

    return toSafeMember(member) as unknown as MemberWithOrg
  } catch (err) {
    return null
  }
})

export async function getAuthForApi() {
  const member = await getCurrentMember()
  return { member, prisma }
}

export async function requireSuperAdmin() {
  const member = await getCurrentMember()
  if (!member || member.role !== "SUPERADMIN") {
    throw new Error("FORBIDDEN")
  }
  return member
}

export async function requireAdminOrAbove() {
  const member = await getCurrentMember()
  if (!member) throw new Error("UNAUTHENTICATED")
  if (!["SUPERADMIN", "ADMIN"].includes(member.role)) {
    throw new Error("FORBIDDEN")
  }
  return member
}

export const isSuperAdmin = (role: string) => role === "SUPERADMIN"
export const isAdminOrAbove = (role: string) => ["SUPERADMIN", "ADMIN"].includes(role)
export const isMember = (role: string) => role === "MEMBER"

export async function requireAuth() {
  const member = await getCurrentMember()
  if (!member) throw new Error("UNAUTHORIZED")
  return member
}

export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 })
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

export async function logActivity(
  dbClient: any,
  performedBy: string,
  organizationId: string,
  action: string,
  entityType = "",
  entityId: string | null = null,
  details: Record<string, unknown> = {}
) {
  const client = dbClient?.activityLog ? dbClient : prisma
  await client.activityLog.create({
    data: {
      performedBy,
      organizationId,
      action,
      entityType,
      entityId,
      details,
    },
  })
}
