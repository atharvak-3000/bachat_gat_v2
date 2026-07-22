import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { requireAdminOrAbove } from "@/lib/auth"

export default async function MemberRequestsPage() {
  let performer
  try {
    performer = await requireAdminOrAbove()
  } catch {
    redirect("/sign-in")
  }

  const pending = await prisma.member.findMany({
    where: {
      organizationId: performer.organization_id,
      status: "PENDING",
    },
    select: {
      id: true,
      name: true,
      phone: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  })

  const rows = pending.map((m) => ({
    ...m,
    created_at: m.createdAt.toISOString(),
  }))

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Member Requests</h1>
      {rows.length === 0 ? (
        <p className="mt-6">No pending requests</p>
      ) : (
        <table className="mt-6 w-full border">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="p-2">Name</th>
              <th className="p-2">Phone</th>
              <th className="p-2">Requested On</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id} className="border-b">
                <td className="p-2">{m.name}</td>
                <td className="p-2">{m.phone}</td>
                <td className="p-2">{new Date(m.created_at).toLocaleDateString("en-IN")}</td>
                <td className="p-2">
                  <form action={`/api/members/${m.id}/approve`} method="post" className="inline-block">
                    <button className="mr-2 rounded border px-3 py-1 text-green-700" type="submit">
                      Approve
                    </button>
                  </form>
                  <form action={`/api/members/${m.id}/reject`} method="post" className="inline-block">
                    <input name="reason" defaultValue="Not approved by admin" className="mr-2 rounded border px-2 py-1 text-sm" />
                    <button className="rounded border px-3 py-1 text-red-700" type="submit">
                      Reject
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
