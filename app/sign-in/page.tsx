"use client"
import { useState, useEffect, useMemo } from "react"
import Image from "next/image"

type Screen = "landing" | "select" | "superadmin" | "member"

interface BachatGat {
  id: string
  name: string
  nameMarathi?: string
  village: string
  taluka?: string
  district: string
  groupCode: string
  memberCount: number
}

export default function SignInPage() {
  const [screen, setScreen] = useState<Screen>("landing")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Bachat Gats data state
  const [organizations, setOrganizations] = useState<BachatGat[]>([])
  const [loadingOrgs, setLoadingOrgs] = useState(true)
  const [orgsError, setOrgsError] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGat, setSelectedGat] = useState<BachatGat | null>(null)

  // Direct Group Code fallback
  const [showCodeInput, setShowCodeInput] = useState(false)
  const [groupCodeInput, setGroupCodeInput] = useState("")
  const [codeLoading, setCodeLoading] = useState(false)
  const [codeError, setCodeError] = useState("")

  const [lang, setLang] = useState<"mr" | "en">("mr")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("bb_lang") as "mr" | "en"
      if (savedLang && (savedLang === "mr" || savedLang === "en")) {
        setLang(savedLang)
      }

      // Load cached organizations immediately for instant display
      try {
        const cached = localStorage.getItem("bb_cached_orgs")
        if (cached) {
          const parsed = JSON.parse(cached)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setOrganizations(parsed)
            setLoadingOrgs(false)
          }
        }
      } catch {}
    }
    fetchOrganizations()
  }, [])

  const setLanguage = (l: "mr" | "en") => {
    setLang(l)
    if (typeof window !== "undefined") {
      localStorage.setItem("bb_lang", l)
    }
  }

  // Fetch Bachat Gats with automatic retry
  const fetchOrganizations = async (retryCount = 0) => {
    setOrgsError(false)
    try {
      const res = await fetch("/api/organizations")
      if (res.ok) {
        const data = await res.json()
        if (data.organizations && Array.isArray(data.organizations)) {
          setOrganizations(data.organizations)
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem("bb_cached_orgs", JSON.stringify(data.organizations))
            } catch {}
          }
          setLoadingOrgs(false)
          return
        }
      }
      throw new Error("Failed to load")
    } catch (err) {
      console.warn(`[SignIn] Fetch organizations failed (attempt ${retryCount + 1}):`, err)
      if (retryCount < 2) {
        setTimeout(() => fetchOrganizations(retryCount + 1), 1000)
        return
      }
      setOrgsError(true)
    } finally {
      setLoadingOrgs(false)
    }
  }

  async function handleFindGatByCode(e: React.FormEvent) {
    e.preventDefault()
    if (!groupCodeInput.trim()) return
    setCodeLoading(true)
    setCodeError("")
    try {
      const res = await fetch(`/api/organizations/by-code?code=${groupCodeInput.trim().toUpperCase()}`)
      const data = await res.json()
      if (!res.ok || data.error) {
        setCodeError(lang === "mr" ? "अवैध गट कोड. कृपया पुन्हा तपासा." : "Invalid group code. Please check again.")
        setCodeLoading(false)
        return
      }
      handleSelectGat({
        id: data.id,
        name: data.name,
        village: data.village,
        district: data.district,
        groupCode: data.group_code,
        memberCount: 0,
      })
    } catch {
      setCodeError(lang === "mr" ? "गट शोधण्यात त्रुटी आली." : "Error finding group.")
    } finally {
      setCodeLoading(false)
    }
  }

  const filteredOrgs = useMemo(() => {
    if (!searchQuery.trim()) return organizations
    const query = searchQuery.toLowerCase().trim()
    return organizations.filter((org) => {
      const name = (org.name || "").toLowerCase()
      const nameMarathi = (org.nameMarathi || "").toLowerCase()
      const village = (org.village || "").toLowerCase()
      const taluka = (org.taluka || "").toLowerCase()
      const district = (org.district || "").toLowerCase()
      const code = (org.groupCode || "").toLowerCase()
      return (
        name.includes(query) ||
        nameMarathi.includes(query) ||
        village.includes(query) ||
        taluka.includes(query) ||
        district.includes(query) ||
        code.includes(query)
      )
    })
  }, [organizations, searchQuery])

  const T = {
    mr: {
      createGat: "नवीन बचत गट तयार करा",
      createSub: "तुमचा गट नोंदवा आणि सुरुवात करा",
      loginGat: "विद्यमान गटात लॉगिन करा",
      loginSub: "तुमच्या गटाचे डॅशबोर्ड उघडा",
      selectGatTitle: "विद्यमान बचत गटात लॉगिन करा",
      selectGatSub: "लॉगिन करण्यासाठी खालील यादीतून तुमचा गट निवडा",
      searchPlaceholder: "गटाचे नाव, गाव किंवा जिल्हा शोधा...",
      noGatsFound: "कोणताही बचत गट आढळला नाही",
      noGatsSub: "शोधलेले नाव किंवा स्थान तपासा अथवा नवीन गट तयार करा",
      loadingGats: "बचत गट लोड होत आहेत...",
      selectedGatLabel: "निवडलेला बचत गट",
      changeGat: "गट बदला",
      membersCount: "सदस्य",
      trustedBy: "महाराष्ट्रातील बचत गटांचा विश्वास",
      loginAs: "म्हणून लॉगिन करा",
      chooseRole: "सुरू ठेवण्यासाठी तुमची भूमिका निवडा",
      superadmin: "महाध्यक्ष",
      superadminDesc: "गट, सदस्य, सभा आणि कर्ज व्यवस्थापित करा",
      superadminEmail: "ईमेलसह लॉगिन करा",
      member: "सदस्य",
      memberDesc: "बचत, कर्ज आणि व्यवहारांचा इतिहास पहा",
      memberPhone: "मोबाईल नंबरसह लॉगिन करा",
      phone: "मोबाईल नंबर",
      password: "पासवर्ड",
      signIn: "साइन इन करा",
      signingIn: "साइन इन करत आहे...",
      back: "← मागे",
      changeRole: "← भूमिका बदला",
      invalidMember: "अवैध फोन नंबर किंवा पासवर्ड. तुमच्या गट अध्यक्षांशी संपर्क साधा.",
      invalidAdmin: "अवैध ईमेल किंवा पासवर्ड.",
      noCredentials: "लॉगिन माहिती नाही? तुमच्या गट महाध्यक्षांना विचारा.",
      logoSub: "बचत गट व्यवस्थापन",
      logoDesc: "Digital platform for Bachat Gat management",
      adminLoginTitle: "महाध्यक्ष लॉगिन",
      adminLoginSub: "तुमच्या ईमेलने साइन इन करा",
      memberLoginTitle: "सदस्य लॉगिन",
      memberLoginSub: "अध्यक्षांकडून मिळालेली माहिती वापरा",
      totalGatsAvailable: "उपलब्ध गट",
    },
    en: {
      createGat: "Create New Bachat Gat",
      createSub: "Register your group and get started",
      loginGat: "Login to Existing Gat",
      loginSub: "Access your group's dashboard",
      selectGatTitle: "Login to Existing Bachat Gat",
      selectGatSub: "Select your group below to proceed",
      searchPlaceholder: "Search by group name, village or district...",
      noGatsFound: "No Bachat Gats found",
      noGatsSub: "Check search query or register a new group",
      loadingGats: "Loading Bachat Gats...",
      selectedGatLabel: "Selected Bachat Gat",
      changeGat: "Change Gat",
      membersCount: "members",
      trustedBy: "Trusted by Bachat Gats across Maharashtra",
      loginAs: "Login As",
      chooseRole: "Choose your role to continue",
      superadmin: "Superadmin",
      superadminDesc: "Manage gat, members, meetings & loans",
      superadminEmail: "Login with Email",
      member: "Member",
      memberDesc: "View savings, loans & transaction history",
      memberPhone: "Login with Phone Number",
      phone: "Phone Number",
      password: "Password",
      signIn: "Sign In",
      signingIn: "Signing in...",
      back: "← Back",
      changeRole: "← Change Role",
      invalidMember: "Invalid phone number or password. Contact your group admin.",
      invalidAdmin: "Invalid email or password.",
      noCredentials: "Don't have credentials? Ask your group superadmin.",
      logoSub: "Bachat Gat Management",
      logoDesc: "Digital platform for Bachat Gat management",
      adminLoginTitle: "Superadmin Login",
      adminLoginSub: "Sign in with your email",
      memberLoginTitle: "Member Login",
      memberLoginSub: "Use credentials from your admin",
      totalGatsAvailable: "Available Groups",
    },
  }
  const t = T[lang]

  const LangToggle = () => (
    <div
      className="absolute top-4 right-4 flex items-center 
                    gap-1 bg-white dark:bg-[#1A1D27] rounded-full border 
                    border-gray-200 dark:border-gray-800 p-1 shadow-sm z-50"
    >
      <button
        type="button"
        onClick={() => setLanguage("mr")}
        className={`px-2.5 py-1 rounded-full text-xs font-bold 
                    transition ${
                      lang === "mr"
                        ? "bg-[#E85D26] text-white"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
                    }`}
      >
        मराठी
      </button>
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`px-2.5 py-1 rounded-full text-xs font-bold 
                    transition ${
                      lang === "en"
                        ? "bg-[#E85D26] text-white"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
                    }`}
      >
        English
      </button>
    </div>
  )

  function reset() {
    setError("")
    setEmail("")
    setPhone("")
    setPassword("")
  }

  function handleSelectGat(gat: BachatGat) {
    setSelectedGat(gat)
    reset()
    setScreen("select")
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const endpoint = screen === "member" ? "/api/auth/login-phone" : "/api/auth/login-email"
      const payload: any =
        screen === "member"
          ? {
              phone,
              password,
              organizationId: selectedGat?.id,
              groupCode: selectedGat?.groupCode,
            }
          : {
              email,
              password,
              organizationId: selectedGat?.id,
              groupCode: selectedGat?.groupCode,
            }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || (screen === "member" ? t.invalidMember : t.invalidAdmin))
        setLoading(false)
        return
      }

      const member = data.member
      if (!member) {
        window.location.href = "/onboarding"
        return
      }
      if (member.status === "PENDING") {
        window.location.href = "/pending"
        return
      }
      if (member.status === "REJECTED") {
        window.location.href = "/rejected"
        return
      }
      window.location.href = member.role === "MEMBER" ? "/member" : "/dashboard"
    } catch (err: any) {
      setError(screen === "member" ? t.invalidMember : t.invalidAdmin)
      setLoading(false)
    }
  }

  // --- SCREEN 1: LANDING / GAT SELECTION SCREEN ---
  if (screen === "landing")
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-[#1B2B6B] to-[#2E4099] dark:from-[#0D1021] dark:to-[#0F1117] flex items-center justify-center p-4 py-12 transition-colors duration-200">
        <a
          href="/"
          className="absolute top-4 left-4 flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition"
        >
          {lang === "mr" ? "← मुख्यपृष्ठ" : "← Home"}
        </a>
        <LangToggle />
        <div className="w-full max-w-md">
          {/* Header & Logo */}
          <div className="text-center mb-8 flex flex-col items-center">
            <div className="relative h-16 w-64 mb-2">
              <Image
                src="/logo-horizontal.png"
                alt="BachatGatOnline"
                fill
                sizes="256px"
                className="object-contain brightness-0 invert"
                priority
              />
            </div>
            <p className="text-orange-300 dark:text-orange-400 font-medium mt-1">{t.logoSub}</p>
            <p className="text-blue-100 dark:text-blue-200 text-sm mt-1">{t.logoDesc}</p>
          </div>

          <div className="space-y-4">
            {/* Create New Bachat Gat Card */}
            <a
              href="/sign-up"
              className="flex items-center gap-4 p-4 sm:p-5 bg-gradient-to-r from-[#E85D26] to-[#F17336] text-white rounded-2xl shadow-lg hover:shadow-orange-500/20 hover:brightness-105 transition-all active:scale-[0.98] group"
            >
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <span className="text-2xl">✨</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-lg leading-tight">{t.createGat}</p>
                  <span className="text-white/80 group-hover:translate-x-1 transition-transform">→</span>
                </div>
                <p className="text-orange-100 text-xs sm:text-sm mt-0.5">{t.createSub}</p>
              </div>
            </a>

            {/* Existing Bachat Gats Section */}
            <div className="bg-white dark:bg-[#1A1D27] rounded-3xl p-5 border border-white/20 dark:border-gray-800 shadow-2xl">
              <div className="mb-3.5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-[#1B2B6B] dark:text-white text-base sm:text-lg flex items-center gap-2">
                    <span>🏛️</span> {t.selectGatTitle}
                  </h3>
                  {organizations.length > 0 && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 bg-orange-50 dark:bg-orange-950/40 text-[#E85D26] rounded-full border border-orange-200 dark:border-orange-900/50">
                      {organizations.length} {t.totalGatsAvailable}
                    </span>
                  )}
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                  {t.selectGatSub}
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative mb-3.5">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full pl-9 pr-8 py-2.5 bg-gray-50 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-transparent transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Bachat Gats List */}
              <div className="max-h-[300px] overflow-y-auto space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
                {loadingOrgs && organizations.length === 0 ? (
                  <div className="py-8 text-center space-y-2">
                    <div className="w-8 h-8 border-3 border-[#E85D26] border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.loadingGats}</p>
                  </div>
                ) : orgsError && organizations.length === 0 ? (
                  <div className="py-6 text-center px-4 space-y-3">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {lang === "mr" ? "सर्व्हरशी संपर्क जोडण्यात अडचण आली." : "Connection issue reaching server."}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {lang === "mr" ? "कृपया पुन्हा प्रयत्न करा किंवा तुमचा गट कोड टाका." : "Please retry or enter your group code."}
                    </p>
                    <div className="flex flex-col gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => fetchOrganizations()}
                        className="px-4 py-2 bg-[#E85D26] text-white text-xs font-bold rounded-xl hover:bg-[#D04E1A] transition active:scale-95 shadow-sm"
                      >
                        🔄 {lang === "mr" ? "पुन्हा प्रयत्न करा (Retry)" : "Retry"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCodeInput(true)}
                        className="text-xs text-[#E85D26] hover:underline font-semibold"
                      >
                        {lang === "mr" ? "गट कोड टाकून लॉगिन करा →" : "Login using Group Code →"}
                      </button>
                    </div>
                  </div>
                ) : filteredOrgs.length === 0 ? (
                  <div className="py-8 text-center px-4 space-y-2">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-1 text-xl text-gray-400">
                      🔍
                    </div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t.noGatsFound}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.noGatsSub}</p>
                    <button
                      type="button"
                      onClick={() => setShowCodeInput(!showCodeInput)}
                      className="text-xs text-[#E85D26] hover:underline font-semibold pt-1 block mx-auto"
                    >
                      {lang === "mr" ? "गट कोडने शोधा" : "Find by Group Code"}
                    </button>
                  </div>
                ) : (
                  filteredOrgs.map((gat) => {
                    const locationParts = [gat.village, gat.taluka, gat.district].filter(Boolean)
                    const locationStr = locationParts.join(", ")

                    return (
                      <button
                        key={gat.id}
                        type="button"
                        onClick={() => handleSelectGat(gat)}
                        className="w-full text-left p-3.5 bg-gray-50 dark:bg-gray-900/60 hover:bg-orange-50/70 dark:hover:bg-orange-950/20 border border-gray-200/80 dark:border-gray-800 hover:border-[#E85D26] dark:hover:border-[#E85D26] rounded-2xl transition-all duration-150 active:scale-[0.99] group shadow-sm flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white truncate group-hover:text-[#E85D26] transition-colors">
                              {gat.name}
                            </h4>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                              <span>📍</span>
                              <span className="truncate max-w-[160px] sm:max-w-[200px]">{locationStr || "Maharashtra"}</span>
                            </span>

                            <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 rounded-md">
                              👥 {gat.memberCount} {t.membersCount}
                            </span>
                          </div>
                        </div>

                        <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0 text-gray-400 group-hover:text-white group-hover:bg-[#E85D26] group-hover:border-[#E85D26] transition-all">
                          <span className="text-sm font-bold">→</span>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>

              {/* Optional Group Code direct search toggle */}
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-center">
                {!showCodeInput ? (
                  <button
                    type="button"
                    onClick={() => setShowCodeInput(true)}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-[#E85D26] dark:hover:text-[#E85D26] transition font-medium"
                  >
                    {lang === "mr" ? "किंवा गट कोड (Group Code) ने शोधा 🔑" : "Or enter Group Code directly 🔑"}
                  </button>
                ) : (
                  <form onSubmit={handleFindGatByCode} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={groupCodeInput}
                        onChange={(e) => setGroupCodeInput(e.target.value.toUpperCase())}
                        placeholder={lang === "mr" ? "उदा. ABCD12" : "e.g. ABCD12"}
                        className="flex-1 px-3 py-2 text-xs font-mono uppercase bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E85D26]"
                      />
                      <button
                        type="submit"
                        disabled={codeLoading || !groupCodeInput.trim()}
                        className="px-3.5 py-2 bg-[#E85D26] hover:bg-[#D04E1A] text-white text-xs font-bold rounded-xl disabled:opacity-50 transition active:scale-95"
                      >
                        {codeLoading ? "..." : (lang === "mr" ? "शोधा" : "Find")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCodeInput(false)
                          setCodeError("")
                        }}
                        className="text-xs text-gray-400 hover:text-gray-600 px-1"
                      >
                        ✕
                      </button>
                    </div>
                    {codeError && <p className="text-[11px] text-red-500 font-medium text-left">{codeError}</p>}
                  </form>
                )}
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-blue-200 dark:text-gray-400 mt-6">{t.trustedBy}</p>
        </div>
      </div>
    )

  // --- SCREEN 2: ROLE SELECTION FOR THE CHOSEN GAT ---
  if (screen === "select")
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-[#1B2B6B] to-[#2E4099] dark:from-[#0D1021] dark:to-[#0F1117] flex items-center justify-center p-4 transition-colors duration-200">
        <LangToggle />
        <div className="w-full max-w-sm">
          <button
            onClick={() => setScreen("landing")}
            className="flex items-center gap-1.5 text-sm text-blue-200 hover:text-white mb-5 transition"
          >
            {t.changeGat ? `← ${t.changeGat}` : t.back}
          </button>

          {/* Selected Gat Pill / Badge */}
          {selectedGat && (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 mb-6 text-white flex items-center justify-between gap-3 shadow-lg">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-300">
                  {t.selectedGatLabel}
                </span>
                <p className="font-bold text-base truncate">{selectedGat.name}</p>
                <p className="text-xs text-blue-200 truncate mt-0.5">
                  📍 {[selectedGat.village, selectedGat.district].filter(Boolean).join(", ")}
                </p>
              </div>
              <button
                onClick={() => setScreen("landing")}
                className="text-xs font-semibold px-2.5 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg shrink-0 transition"
              >
                {t.changeGat}
              </button>
            </div>
          )}

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white">{t.loginAs}</h2>
            <p className="text-blue-200 dark:text-gray-400 text-sm mt-1">{t.chooseRole}</p>
          </div>

          <div className="space-y-3">
            {/* Superadmin / Mahadhyaksh Button */}
            <button
              onClick={() => {
                reset()
                setScreen("superadmin")
              }}
              className="w-full flex items-center gap-4 p-5 bg-white dark:bg-[#1A1D27] border border-transparent dark:border-gray-800 rounded-2xl hover:border-[#E85D26] hover:bg-orange-50/50 dark:hover:bg-orange-950/10 transition-all active:scale-[0.98] text-left shadow-sm group"
            >
              <div className="w-14 h-14 bg-orange-100 dark:bg-orange-950/20 text-[#E85D26] rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Image src="/Bachat Gat icons/Superadmin.svg" alt="Superadmin" width={32} height={32} />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-lg">{t.superadmin}</p>
                <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">{t.superadminDesc}</p>
                <p className="text-[#E85D26] dark:text-orange-400 text-xs mt-1.5 font-semibold">
                  {t.superadminEmail} →
                </p>
              </div>
            </button>

            {/* Member Button */}
            <button
              onClick={() => {
                reset()
                setScreen("member")
              }}
              className="w-full flex items-center gap-4 p-5 bg-white dark:bg-[#1A1D27] border border-transparent dark:border-gray-800 rounded-2xl hover:border-[#E85D26] hover:bg-orange-50/50 dark:hover:bg-orange-950/10 transition-all active:scale-[0.98] text-left shadow-sm group"
            >
              <div className="w-14 h-14 bg-orange-100 dark:bg-orange-950/20 text-[#E85D26] rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Image src="/Bachat Gat icons/Member.svg" alt="Member" width={32} height={32} />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-lg">{t.member}</p>
                <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">{t.memberDesc}</p>
                <p className="text-[#E85D26] dark:text-orange-400 text-xs mt-1.5 font-semibold">
                  {t.memberPhone} →
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    )

  // --- SCREEN 3 & 4: CREDENTIAL LOGIN FOR MAHADHYAKSH OR MEMBER ---
  const isMember = screen === "member"

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#1B2B6B] to-[#2E4099] dark:from-[#0D1021] dark:to-[#0F1117] flex items-center justify-center p-4 transition-colors duration-200">
      <LangToggle />
      <div className="w-full max-w-sm">
        <button
          onClick={() => {
            setScreen("select")
            reset()
          }}
          className="flex items-center gap-1.5 text-sm text-blue-200 hover:text-white mb-4 transition"
        >
          {t.changeRole}
        </button>

        {/* Selected Gat header banner */}
        {selectedGat && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 mb-4 text-white flex items-center justify-between gap-2 shadow-md">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-300">
                {t.selectedGatLabel}
              </span>
              <p className="font-bold text-sm truncate">{selectedGat.name}</p>
              <p className="text-[11px] text-blue-200 truncate">
                📍 {[selectedGat.village, selectedGat.district].filter(Boolean).join(", ")}
              </p>
            </div>
            <button
              onClick={() => {
                reset()
                setScreen("landing")
              }}
              className="text-[11px] font-semibold px-2 py-1 bg-white/20 hover:bg-white/30 rounded-lg shrink-0 transition"
            >
              {t.changeGat}
            </button>
          </div>
        )}

        <div className="bg-white dark:bg-[#1A1D27] rounded-3xl border border-white/10 dark:border-gray-800 shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                isMember
                  ? "bg-orange-100 dark:bg-orange-950/20 text-[#E85D26]"
                  : "bg-blue-50 dark:bg-blue-950/20 text-[#1B2B6B] dark:text-blue-400"
              }`}
            >
              <Image
                src={isMember ? "/Bachat Gat icons/Member.svg" : "/Bachat Gat icons/Superadmin.svg"}
                alt={isMember ? "Member" : "Superadmin"}
                width={28}
                height={28}
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1B2B6B] dark:text-white">
                {isMember ? t.memberLoginTitle : t.adminLoginTitle}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
                {isMember ? t.memberLoginSub : t.adminLoginSub}
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {isMember ? (
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t.phone}
                </label>
                <div className="flex items-stretch bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#E85D26] focus-within:border-transparent transition-all">
                  <span className="flex items-center px-3 bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-300 font-semibold select-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="9876543210"
                    className="flex-1 bg-transparent text-gray-900 dark:text-white px-4 py-3 text-sm focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-transparent"
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {t.password}
                </label>
                {!isMember && (
                  <a
                    href="/forgot-password"
                    className="text-xs text-[#E85D26] hover:underline font-semibold"
                  >
                    {lang === 'mr' ? 'पासवर्ड विसरलात?' : 'Forgot password?'}
                  </a>
                )}
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-transparent"
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (isMember && phone.length !== 10)}
              className="w-full text-white rounded-xl py-3.5 text-sm font-bold disabled:opacity-50 transition-colors mt-2 bg-[#E85D26] hover:bg-[#D04E1A] active:scale-95"
            >
              {loading ? t.signingIn : t.signIn}
            </button>
          </form>

          {isMember && (
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
              {t.noCredentials}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
