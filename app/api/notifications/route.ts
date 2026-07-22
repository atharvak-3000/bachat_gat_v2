import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentMember } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const member = await getCurrentMember()
    if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const isCount = searchParams.get("count") === "true"
    const limit = parseInt(searchParams.get("limit") || "10", 10)

    if (isCount) {
      const count = await prisma.notification.count({
        where: {
          memberId: member.id,
          isRead: false,
        },
      })
      return NextResponse.json({ unread_count: count })
    }

    const notifications = await prisma.notification.findMany({
      where: { memberId: member.id },
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    return NextResponse.json({ notifications })
  } catch (error: any) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
