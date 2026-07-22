import { NextResponse } from "next/server"
import { getCurrentMember } from "@/lib/auth"

export async function GET() {
  try {
    const member = await getCurrentMember()
    if (!member) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
    }
    return NextResponse.json({ member })
  } catch (error: any) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
  }
}
