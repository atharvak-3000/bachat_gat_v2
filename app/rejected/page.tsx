import { getCurrentMember } from "@/lib/auth"
import { redirect } from "next/navigation"
import RejectedClient from "./RejectedClient"

export default async function RejectedPage() {
  const member = await getCurrentMember()
  if (!member) redirect("/sign-in")

  const orgName = member.organization?.name || "the group"
  const memberName = member.name || ""

  return (
    <RejectedClient
      orgName={orgName}
      memberName={memberName}
    />
  )
}
