import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentMember } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const member = await getCurrentMember()
    if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await prisma.notification.updateMany({
      where: {
        memberId: member.id,
        isRead: false,
      },
      data: { isRead: true },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error marking all notifications read:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
