"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import type { Role } from "@/types"

export type RoleBadgeProps = {
  role: Role | string
  className?: string
  lang?: 'mr' | 'en'
}

const roleMap: Record<string, { mr: string; en: string; className: string }> = {
  SUPERADMIN: {
    mr: "महाअध्यक्ष",
    en: "SuperAdmin",
    className: "bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800/50"
  },
  ADMIN: {
    mr: "अध्यक्ष",
    en: "Admin",
    className: "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/50"
  },
  MEMBER: {
    mr: "सदस्य",
    en: "Member",
    className: "bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700/50"
  }
}

export default function RoleBadge({ role, className, lang: propsLang }: RoleBadgeProps) {
  const [lang, setLang] = useState<'mr'|'en'>(propsLang || 'mr')

  useEffect(() => {
    if (propsLang) {
      setLang(propsLang)
      return
    }
    if (typeof window !== 'undefined') {
      setLang((localStorage.getItem('bb_lang') as 'mr'|'en') || 'mr')
    }
    const handler = (e: Event) => {
      setLang((e as CustomEvent).detail)
    }
    window.addEventListener('bb-lang-change', handler)
    return () => window.removeEventListener('bb-lang-change', handler)
  }, [propsLang])

  const info = roleMap[role] || roleMap.MEMBER
  const label = lang === 'mr' ? info.mr : info.en

  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", info.className, className)}>
      {label}
    </span>
  )
}

