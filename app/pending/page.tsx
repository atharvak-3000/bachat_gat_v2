"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function PendingPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    const checkStatus = async () => {
      setChecking(true)
      try {
        const res = await fetch("/api/auth/me")
        if (!res.ok) {
          router.push("/sign-in")
          return
        }

        const { member } = await res.json()
        if (!member) {
          router.push("/sign-in")
          return
        }

        if (member.status === "ACTIVE") {
          router.push(member.role === "MEMBER" ? "/member" : "/dashboard")
          router.refresh()
          return
        }

        if (member.status === "REJECTED") {
          router.push("/rejected")
          return
        }
      } catch (error) {
        console.error("Error checking status:", error)
      } finally {
        setChecking(false)
      }
    }

    checkStatus()

    const interval = setInterval(checkStatus, 5000)
    return () => clearInterval(interval)
  }, [router])

  const handleSignOut = async () => {
    await fetch("/api/auth/signout", { method: "POST" })
    router.push("/sign-in")
  }

  return (
    <div className="min-h-screen bg-orange-50 dark:bg-[#0F1117] flex items-center justify-center p-4 transition-colors duration-250">
      <div className="bg-white dark:bg-[#1A1D27] rounded-2xl shadow-lg dark:shadow-none p-8 max-w-md w-full text-center border border-transparent dark:border-gray-800">
        <div className="text-5xl mb-4">⏳</div>

        <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
          विनंती प्रलंबित आहे
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
          Request Pending
        </p>

        <p className="text-gray-600 dark:text-gray-300 text-sm mt-4">
          तुमची विनंती गटाच्या प्रशासकाकडे पाठवली आहे.
        </p>
        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
          Your request has been sent to the group admin.
        </p>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-orange-500 dark:text-orange-400">
          <div className="w-2 h-2 rounded-full bg-orange-400 dark:bg-orange-500 animate-pulse" />
          Checking for approval automatically...
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
          This page will redirect automatically once approved.
          <br />
          No need to refresh or do anything.
        </p>

        <button
          onClick={handleSignOut}
          className="mt-6 text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 underline transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
