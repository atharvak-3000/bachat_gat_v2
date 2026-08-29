"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import type { MemberWithOrg } from "@/types"
import NotificationBell from "./NotificationBell"
import DarkModeToggle from "../ui/DarkModeToggle"

export default function Sidebar({ member, pendingCount = 0 }: { member: MemberWithOrg; pendingCount?: number }) {
  const pathname = usePathname()
  const router = useRouter()
  const [lang, setLang] = useState<'mr'|'en'>('mr')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLang((localStorage.getItem('bb_lang') as 'mr'|'en') || 'mr')
    }
    const handler = (e: Event) => {
      setLang((e as CustomEvent).detail)
    }
    window.addEventListener('bb-lang-change', handler)
    return () => window.removeEventListener('bb-lang-change', handler)
  }, [])

  const roleText = lang === 'mr'
    ? (member.role === 'SUPERADMIN' ? 'महाअध्यक्ष' : member.role === 'ADMIN' ? 'अध्यक्ष' : 'सदस्य')
    : (member.role === 'SUPERADMIN' ? 'SuperAdmin' : member.role === 'ADMIN' ? 'Admin' : 'Member')

  const navItems = [
    { href: "/dashboard", label: lang === 'mr' ? 'डॅशबोर्ड' : 'Dashboard' },
    { href: "/members", label: `${lang === 'mr' ? 'सदस्य' : 'Members'}${pendingCount > 0 ? ` (${pendingCount})` : ""}` },
    { href: "/meetings", label: lang === 'mr' ? 'सभा' : 'Meetings' },
    { href: "/loans", label: lang === 'mr' ? 'कर्ज' : 'Loans' },
    { href: "/reports", label: lang === 'mr' ? 'अहवाल' : 'Reports' },
  ]

  const signOut = async () => {
    await fetch("/api/auth/signout", { method: "POST" })
    router.push('/sign-in')
  }

  return (
    <aside className="w-60 border-r border-white/10 dark:border-white/5 bg-[#1B2B6B] dark:bg-[#0D1021] p-4 flex flex-col h-screen sticky top-0 text-white transition-colors duration-150">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <p className="font-bold text-white text-base truncate max-w-[150px]">{member.organization.name}</p>
          <p className="text-xs text-blue-200 mt-0.5">{roleText}</p>
        </div>
        <NotificationBell />
      </div>
      <nav className="space-y-1.5 flex-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              pathname.startsWith(item.href)
                ? 'bg-[#E85D26] text-white shadow'
                : 'text-blue-100 hover:bg-white/10 dark:text-blue-200'
            }`}
          >
            {item.label}
          </Link>
        ))}
        {member.role === 'SUPERADMIN' ? (
          <Link
            href="/settings"
            className={`block rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              pathname.startsWith('/settings')
                ? 'bg-[#E85D26] text-white shadow'
                : 'text-blue-100 hover:bg-white/10 dark:text-blue-200'
            }`}
          >
            Settings
          </Link>
        ) : null}
      </nav>
      <div className="mt-auto border-t border-white/10 pt-4 flex items-center gap-2">
        <DarkModeToggle />
        <button
          onClick={signOut}
          className="flex-1 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/10 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </aside>
  )
}
