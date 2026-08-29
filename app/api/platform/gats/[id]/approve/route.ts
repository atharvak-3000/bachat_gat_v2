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

    await prisma.$transaction(async (tx: any) => {
      await tx.organization.update({
        where: { id: params.id },
        data: { isApproved: true },
      })

      const superadmin = await tx.member.findFirst({
        where: {
          organizationId: params.id,
          role: "SUPERADMIN",
        },
        select: { id: true },
      })

      if (superadmin) {
        await tx.notification.create({
          data: {
            organizationId: params.id,
            memberId: superadmin.id,
            title: "Gat Approved 🎉",
            message: "Your Bachat Gat has been approved! You can now start using all features.",
            type: "GENERAL",
          },
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error approving gat:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
