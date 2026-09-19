import { redirect } from "next/navigation"
import { getCurrentMember } from "@/lib/auth"
import AdminLayoutClient from "@/components/shared/AdminLayoutClient"
import prisma from "@/lib/prisma"
import { headers } from "next/headers"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const member = await getCurrentMember()

  if (!member) redirect("/onboarding")

  const headersList = await headers()
  const pathname = headersList.get("x-pathname") || ""
  const isAllowedMemberPath = pathname.startsWith("/loans") || pathname.startsWith("/reports")

  if (member.role === "MEMBER" && !isAllowedMemberPath) {
    redirect("/member")
  }

  const count = await prisma.member.count({
    where: {
      organizationId: member.organization_id,
      status: "PENDING",
    },
  })

  return (
    <AdminLayoutClient member={member} pendingCount={count ?? 0}>
      {children}
    </AdminLayoutClient>
  )
}
