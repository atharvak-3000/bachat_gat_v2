import { NextResponse } from "next/server"
import crypto from "crypto"
import prisma from "@/lib/prisma"
import { sendPasswordResetEmail } from "@/lib/mail"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()

    const member = await prisma.member.findFirst({
      where: {
        email: cleanEmail,
      },
    })

    if (member) {
      const token = crypto.randomBytes(32).toString("hex")
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

      await prisma.member.update({
        where: { id: member.id },
        data: {
          resetToken: token,
          resetTokenExpiresAt: expiresAt,
        },
      })

      // Get origin URL if available from request headers
      const origin = req.headers.get("origin") || req.headers.get("referer")?.replace(/\/$/, "") || undefined

      try {
        await sendPasswordResetEmail(cleanEmail, token, origin)
      } catch (mailError) {
        console.error("[Forgot Password] Failed to send email:", mailError)
      }
    }

    // Always return generic success response to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: "If an account with that email exists, password reset instructions have been sent.",
    })
  } catch (error: any) {
    console.error("[Forgot Password Error]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
