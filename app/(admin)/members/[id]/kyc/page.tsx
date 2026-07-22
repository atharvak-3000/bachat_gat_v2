import { redirect } from "next/navigation"
import { requireAdminOrAbove, toSafeMember } from "@/lib/auth"
import prisma from "@/lib/prisma"
import AdminKycClient from "./AdminKycClient"
import type { Member } from "@/types"

export default async function AdminKycPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const currentAdmin = await requireAdminOrAbove()

  const member = await prisma.member.findFirst({
    where: {
      id,
      organizationId: currentAdmin.organization_id,
    },
  })

  if (!member) {
    redirect("/members")
  }

  const safeMember = toSafeMember(member)

  return <AdminKycClient member={safeMember as unknown as Member} />
}
