import { NextResponse, type NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/sign-in", request.url))
  response.cookies.delete("bb_token")
  return response
}
