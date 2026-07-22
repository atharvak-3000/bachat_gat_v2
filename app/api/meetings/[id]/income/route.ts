import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdminOrAbove } from "@/lib/auth"
import { z } from "zod"

const incomeSchema = z.object({
  category: z.string().optional(),
  amount: z.number().positive("Amount must be greater than zero"),
  description: z.string().optional(),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const performer = await requireAdminOrAbove()
    const { id } = await params
    const body = await req.json()
    const parseResult = incomeSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.errors[0].message }, { status: 400 })
    }

    const { category, amount, description } = parseResult.data

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
      return NextResponse.json({ error: "Cannot add income to finalized meeting" }, { status: 400 })
    }

    const income = await prisma.meetingIncome.create({
      data: {
        meetingId: id,
        category: category || "OTHER",
        amount: BigInt(amount),
        description: description || "",
      },
    })

    return NextResponse.json(income)
  } catch (error: any) {
    if (error?.message === "UNAUTHENTICATED" || error?.message === "UNAUTHORIZED" || error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHENTICATED" ? 401 : 403 })
    }
    console.error(error)
    return NextResponse.json({ error: "Failed to add income" }, { status: 500 })
  }
}
