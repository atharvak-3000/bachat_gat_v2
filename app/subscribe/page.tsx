"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function SubscribePage() {
  const router = useRouter()

  useEffect(() => {
    // Completely free - all features are free forever
    router.replace("/dashboard")
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50 dark:bg-[#0D1021]">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
          डॅशबोर्डवर नेत आहे... / Redirecting to dashboard...
        </p>
      </div>
    </div>
  )
}
