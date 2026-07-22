import { NextResponse } from "next/server"

export async function POST() {
  const response = NextResponse.redirect(
    new URL("/sign-in", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000")
  )
  response.cookies.delete("bb_token")
  return response
}
