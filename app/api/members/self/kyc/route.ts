import { NextResponse } from "next/server"
import { getCurrentMember } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function PATCH(request: Request) {
  try {
    const member = await getCurrentMember()
    if (!member) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { aadhaar_url, pan_url, photo_url, signature_url } = body

    const currentMember = await prisma.member.findUnique({
      where: { id: member.id },
    })

    if (!currentMember) {
      return NextResponse.json({ error: "Failed to fetch member" }, { status: 404 })
    }

    let kycData: any = {}
    try {
      kycData = currentMember.kycNotes ? JSON.parse(currentMember.kycNotes) : {}
    } catch {
      kycData = {}
    }

    if (aadhaar_url !== undefined) kycData.aadhaar_url = aadhaar_url
    if (pan_url !== undefined) kycData.pan_url = pan_url
    if (photo_url !== undefined) kycData.photo_url = photo_url
    if (signature_url !== undefined) kycData.signature_url = signature_url

    let newKycStatus = currentMember.kycStatus
    if (kycData.aadhaar_url && kycData.pan_url && kycData.photo_url && kycData.signature_url) {
      newKycStatus = "SUBMITTED"
    }

    await prisma.member.update({
      where: { id: member.id },
      data: {
        kycNotes: JSON.stringify(kycData),
        kycStatus: newKycStatus,
      },
    })

    return NextResponse.json({ success: true, status: newKycStatus })
  } catch (error: any) {
    console.error("Error updating self KYC:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
