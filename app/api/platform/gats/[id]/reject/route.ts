import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentMember } from "@/lib/auth"

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const member = await getCurrentMember()

    if (!member || member.email !== process.env.PLATFORM_OWNER_EMAIL) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.organization.update({
      where: { id: params.id },
      data: { isApproved: false },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error rejecting gat:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
