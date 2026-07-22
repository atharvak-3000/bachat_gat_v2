import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const orgId = searchParams.get("orgId")
  const phone = searchParams.get("phone")

  if (!orgId || !phone) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 })
  }

  const member = await prisma.member.findFirst({
    where: {
      organizationId: orgId,
      phone,
    },
    select: {
      id: true,
      passwordHash: true,
      name: true,
    },
  })

  if (!member) {
    return NextResponse.json({ exists: false, hasAccount: false })
  }

  if (member.passwordHash) {
    return NextResponse.json({ exists: true, hasAccount: true })
  }

  return NextResponse.json({
    exists: true,
    hasAccount: false,
    memberName: member.name,
  })
}
