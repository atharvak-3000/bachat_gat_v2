import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get("code")
    if (!code) return NextResponse.json({ error: "Code required" }, { status: 400 })

    const cleanCode = code.trim().toUpperCase()

    let org = await prisma.organization.findUnique({
      where: { groupCode: cleanCode },
      select: {
        id: true,
        name: true,
        village: true,
        district: true,
        isApproved: true,
        subscriptionStatus: true,
        groupCode: true,
      },
    })

    if (!org) {
      const normalize = (s: string) =>
        s.toUpperCase().replace(/O/g, "0").replace(/[IL]/g, "1").trim()

      const normalizedTarget = normalize(cleanCode)
      const allOrgs = await prisma.organization.findMany({
        select: {
          id: true,
          name: true,
          groupCode: true,
          village: true,
          district: true,
          isApproved: true,
          subscriptionStatus: true,
        },
      })

      const matched = allOrgs.find((o: any) => normalize(o.groupCode) === normalizedTarget)
      if (matched) org = matched
    }

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: org.id,
      name: org.name,
      village: org.village,
      district: org.district,
      is_approved: org.isApproved,
      subscription_status: org.subscriptionStatus,
      group_code: org.groupCode,
    })
  } catch (error: any) {
    console.error("[BY-CODE] error:", error)
    return NextResponse.json({ error: "Failed to fetch organization" }, { status: 500 })
  }
}
