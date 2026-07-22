import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdminOrAbove } from "@/lib/auth"

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; incId: string }> }
) {
  try {
    const performer = await requireAdminOrAbove()
    const { id, incId } = await params

    const meeting = await prisma.meeting.findFirst({
      where: {
        id,
        organizationId: performer.organizationId,
      },
    })

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
    }

    if (meeting.status === "FINALIZED") {
      return NextResponse.json({ error: "Cannot delete income from finalized meeting" }, { status: 400 })
    }

    const income = await prisma.meetingIncome.findFirst({
      where: {
        id: incId,
        meetingId: id,
      },
    })

    if (!income) {
      return NextResponse.json({ error: "Income not found" }, { status: 404 })
    }

    await prisma.meetingIncome.delete({
      where: { id: incId },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error?.message === "UNAUTHENTICATED" || error?.message === "UNAUTHORIZED" || error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHENTICATED" ? 401 : 403 })
    }
    console.error(error)
    return NextResponse.json({ error: "Failed to delete income" }, { status: 500 })
  }
}
