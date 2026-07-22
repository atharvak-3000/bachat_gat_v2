import { getCurrentMember } from "@/lib/auth"
import LandingClient from "./LandingClient"

export default async function RootPage() {
  const member = await getCurrentMember()

  let isAuthenticated = false
  let role: string | null = null
  let status: string | null = null

  if (member) {
    isAuthenticated = true
    role = member.role
    status = member.status
  }

  return (
    <LandingClient 
      isAuthenticated={isAuthenticated}
      role={role}
      status={status}
    />
  )
}
