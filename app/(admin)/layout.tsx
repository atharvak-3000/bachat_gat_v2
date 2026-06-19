import { redirect } from "next/navigation"
import { getCurrentMember } from "@/lib/auth"
import AdminLayoutClient from "@/components/shared/AdminLayoutClient"
import { createClient } from "@/lib/supabase/server"
import { checkSubscriptionAccess } from "@/lib/subscription"
import { headers } from "next/headers"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const member = await getCurrentMember()

  if (!member) redirect("/onboarding")
  
  const headersList = await headers()
  const pathname = headersList.get("x-pathname") || ""
  const isAllowedMemberPath = pathname.startsWith("/loans") || pathname.startsWith("/reports")

  // Both MEMBER role redirected to member portal except for /loans and /reports
  if (member.role === "MEMBER" && !isAllowedMemberPath) {
    redirect("/member")
  }

  // Check subscription/trial access limits
  checkSubscriptionAccess(member.organization)

  const supabase = await createClient()
  const { count } = await supabase
    .from("members")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", member.organization_id)
    .eq("status", "PENDING")

  return (
    <AdminLayoutClient member={member} pendingCount={count ?? 0}>
      {children}
    </AdminLayoutClient>
  )
}
