import prisma from "@/lib/prisma"
import GatsClient from "./GatsClient"

export const dynamic = "force-dynamic"

export default async function PlatformGatsPage() {
  const orgs = await prisma.organization.findMany({
    include: {
      members: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const formattedOrgs = orgs.map((org: any) => ({
    ...org,
    is_approved: org.isApproved,
    group_code: org.groupCode,
    created_at: org.createdAt.toISOString(),
    members_count: org.members.length,
  }))

  return <GatsClient initialOrgs={formattedOrgs as any} />
}
