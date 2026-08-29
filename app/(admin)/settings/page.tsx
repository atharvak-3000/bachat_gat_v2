import { redirect } from "next/navigation"
import { requireSuperAdmin, toSafeMember } from "@/lib/auth"
import prisma, { toPlainObject } from "@/lib/prisma"
import SettingsClient from "./SettingsClient"

export default async function SettingsPage() {
  let performer
  try {
    performer = await requireSuperAdmin()
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") redirect("/dashboard")
    redirect("/sign-in")
  }

  const [admins, activeMemberCount] = await Promise.all([
    prisma.member.findMany({
      where: {
        organizationId: performer.organization_id,
        role: "SUPERADMIN",
      },
    }),
    prisma.member.count({
      where: {
        organizationId: performer.organization_id,
        status: "ACTIVE",
      },
    }),
  ])

  const safeAdmins = admins.map((m: any) => toSafeMember(m))

  return (
    <SettingsClient
      organization={toPlainObject(performer.organization) as any}
      orgId={performer.organization_id}
      admins={safeAdmins as any}
      activeMemberCount={activeMemberCount}
    />
  )
}
