import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentMember } from "@/lib/auth"

export async function GET() {
  try {
    const member = await getCurrentMember()
    if (!member) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const proofs = await prisma.paymentProof.findMany({
      where: { memberId: member.id },
      include: {
        meeting: { select: { monthYear: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ proofs })
  } catch (error: any) {
    console.error("Error fetching self payment proofs:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
