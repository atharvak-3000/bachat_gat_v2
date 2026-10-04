"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import NotificationBell from "./NotificationBell"
import { getTranslation } from "@/lib/translations"
import DarkModeToggle from "../ui/DarkModeToggle"

export default function MemberLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [lang, setLang] = useState<"en" | "mr">("en")

  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop()?.split(";").shift() as "en" | "mr"
      return "en"
    }
    setLang(getCookie("language") || "en")
  }, [])

  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(lang, key)

  const toggleLanguage = () => {
    const newLang = lang === "en" ? "mr" : "en"
    document.cookie = `language=${newLang}; path=/; max-age=31536000` // 1 year
    setLang(newLang)
    window.location.reload()
  }

  const navItems = [
    {
      href: "/member",
      label: t("home"),
      exact: true,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      href: "/member/passbook",
      label: t("passbook"),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
  ]

  const isLinkActive = (item: typeof navItems[0]) => {
    if (item.exact) {
      return pathname === item.href
    }
    return pathname.startsWith(item.href)
  }

  return (
    <div className="min-h-screen bg-[#F5F6FA] dark:bg-[#0F1117] pb-20 md:pb-8 transition-colors duration-150">
      {/* Header */}
      <header className="bg-[#1B2B6B] dark:bg-[#0D1021] sticky top-0 z-50 border-b border-white/10 transition-colors duration-150 shadow-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 sm:px-6 h-16">
          {/* Logo & Desktop Navigation */}
          <div className="flex items-center gap-6">
            <Link href="/member" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#E85D26] to-amber-400 flex items-center justify-center text-white font-black text-sm shadow">
                BG
              </div>
              <span className="font-bold text-white text-base sm:text-lg tracking-tight">
                BachatGat<span className="text-[#E85D26]">Online</span>
              </span>
            </Link>

            <nav className="hidden sm:flex items-center gap-2 ml-4">
              {navItems.map((item) => {
                const active = isLinkActive(item)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all ${
                      active
                        ? "text-white bg-white/20 border-b-2 border-[#E85D26] shadow-sm"
                        : "text-blue-100 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Controls & Sign Out */}
          <div className="flex items-center gap-2 sm:gap-3">
            <DarkModeToggle />

            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-white/20 text-white bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-xs font-bold"
              title="Switch Language / भाषा बदलें"
            >
              <span>🌐</span>
              <span className="hidden xs:inline">{lang === "en" ? "मराठी" : "English"}</span>
            </button>

            <div className="text-white hover:text-blue-200 flex items-center justify-center p-1">
              <NotificationBell />
            </div>

            {/* Sign Out Button */}
            <form action="/auth/signout" method="post" className="flex items-center">
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 hover:text-white border border-red-400/30 text-xs sm:text-sm px-3 py-1.5 rounded-lg transition font-medium active:scale-95"
                title={t("signOut")}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline font-semibold">{t("signOut")}</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</main>

      {/* Mobile Bottom Navigation */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-[#1B2B6B] dark:bg-[#0D1021] border-t border-white/10 z-40 flex items-center justify-around py-2 px-4 shadow-lg">
        {navItems.map((item) => {
          const active = isLinkActive(item)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
                active ? "text-white font-bold bg-white/15" : "text-blue-200 hover:text-white"
              }`}
            >
              {item.icon}
              <span className="text-[11px] leading-none">{item.label}</span>
            </Link>
          )
        })}

        {/* Mobile Sign Out */}
        <form action="/auth/signout" method="post" className="flex items-center">
          <button
            type="submit"
            className="flex flex-col items-center gap-1 py-1 px-4 text-red-300 hover:text-red-100 transition-all"
            title={t("signOut")}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-[11px] leading-none font-medium">{t("signOut")}</span>
          </button>
        </form>
      </nav>
    </div>
  )
}
