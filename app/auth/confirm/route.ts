import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin
  return NextResponse.redirect(new URL("/sign-in", siteUrl))
}
