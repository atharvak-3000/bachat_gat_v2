import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentMember } from "@/lib/auth"

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const member = await getCurrentMember()
    if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const notification = await prisma.notification.findFirst({
      where: {
        id: params.id,
        memberId: member.id,
      },
    })

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    await prisma.notification.update({
      where: { id: notification.id },
      data: { isRead: true },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error marking notification read:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
