"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import DarkModeToggle from "@/components/ui/DarkModeToggle"

type Step1Data = {
  name: string
  village: string
  taluka: string
  district: string
  meeting_frequency: "WEEKLY" | "MONTHLY"
}

type Step2Data = {
  monthly_saving_amount: string
  default_interest_rate: string
  default_penalty_amount: string
  max_loan_limit: string
}

const ONBOARD_T = {
  mr: {
    title: "बचत गट ऑनलाईन",
    step1Title: "तुमच्या बचत गटाची माहिती",
    step2Title: "आर्थिक सेटिंग्ज",
    gatName: "गटाचे नाव *",
    gatNamePlaceholder: "उदा. जय भवानी महिला बचत गट",
    village: "गाव / शहर *",
    villagePlaceholder: "उदा. पुणे",
    taluka: "तालुका",
    talukaPlaceholder: "पर्यायी",
    district: "जिल्हा *",
    districtPlaceholder: "उदा. पुणे",
    frequency: "बैठकीची वारंवारता",
    monthly: "मासिक (Monthly)",
    weekly: "साप्ताहिक (Weekly)",
    next: "पुढे जा →",
    back: "← मागे जा",
    createGatBtn: "गट तयार करा 🎉",
    monthlySaving: "मासिक बचत ₹ *",
    interestRate: "व्याज दर % / महिना",
    penaltyAmount: "दंड रक्कम ₹",
    maxLoan: "कर्ज मर्यादा ₹",
    summaryTitle: "सारांश / Summary",
    fillFields: "कृपया सर्व आवश्यक फील्ड भरा",
    creationSuccess: "बचत गटाची माहिती यशस्वीरित्या जतन झाली!",
    submitting: "जतन होत आहे...",
    goToDashboard: "डॅशबोर्डवर जा →",
  },
  en: {
    title: "BachatGatOnline",
    step1Title: "Your Bachat Gat Details",
    step2Title: "Financial Settings",
    gatName: "Gat Name *",
    gatNamePlaceholder: "e.g. Jai Bhavani Mahila Bachat Gat",
    village: "Village / City *",
    villagePlaceholder: "e.g. Pune",
    taluka: "Taluka",
    talukaPlaceholder: "Optional",
    district: "District *",
    districtPlaceholder: "e.g. Pune",
    frequency: "Meeting Frequency",
    monthly: "Monthly",
    weekly: "Weekly",
    next: "Next →",
    back: "← Back",
    createGatBtn: "Create Gat 🎉",
    monthlySaving: "Monthly Saving Amount ₹ *",
    interestRate: "Interest Rate % / Month",
    penaltyAmount: "Fine Amount ₹",
    maxLoan: "Max Loan Limit ₹",
    summaryTitle: "Summary",
    fillFields: "Please fill all required fields",
    creationSuccess: "Bachat Gat details saved successfully!",
    submitting: "Saving...",
    goToDashboard: "Go to Dashboard →",
  },
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [currentMember, setCurrentMember] = useState<any>(null)
  const [lang, setLang] = useState<"mr" | "en">("mr")

  useEffect(() => {
    if (typeof window !== "undefined") {
      setLang((localStorage.getItem("bb_lang") as "mr" | "en") || "mr")
    }
  }, [])

  const toggleLanguage = () => {
    const newLang = lang === "en" ? "mr" : "en"
    setLang(newLang)
    localStorage.setItem("bb_lang", newLang)
    window.dispatchEvent(new CustomEvent("bb-lang-change", { detail: newLang }))
  }

  const t = ONBOARD_T[lang]

  const [step1, setStep1] = useState<Step1Data>({
    name: "",
    village: "",
    taluka: "",
    district: "",
    meeting_frequency: "MONTHLY",
  })

  const [step2, setStep2] = useState<Step2Data>({
    monthly_saving_amount: "",
    default_interest_rate: "2",
    default_penalty_amount: "0",
    max_loan_limit: "",
  })

  useEffect(() => {
    const checkExisting = async () => {
      try {
        const res = await fetch("/api/auth/me")
        if (!res.ok) {
          router.push("/sign-up")
          return
        }

        const { member } = await res.json()

        if (member) {
          if (member.role === "MEMBER") {
            router.push("/member")
            return
          }

          setCurrentMember(member)

          // If the organization was already created (e.g. initial sign-up),
          // DO NOT auto-redirect to dashboard!
          // Instead, prefill any values so the user can easily review, customize,
          // and set their actual Gat Name, village, monthly savings, and interest rate!
          if (member.organization) {
            const org = member.organization
            const isPlaceholderName = !org.name || org.name.includes("'s Bachat Gat")
            setStep1((prev) => ({
              ...prev,
              name: isPlaceholderName ? "" : org.name,
              village: org.village === "Pune" ? "" : (org.village || ""),
              taluka: org.taluka || "",
              district: org.district === "Pune" ? "" : (org.district || ""),
              meeting_frequency: (org.meetingFrequency || "MONTHLY") as "WEEKLY" | "MONTHLY",
            }))
            setStep2((prev) => ({
              ...prev,
              monthly_saving_amount: org.monthlySavingAmount && org.monthlySavingAmount !== 10000
                ? (Number(org.monthlySavingAmount) / 100).toString()
                : "",
              default_interest_rate: org.defaultInterestRate != null ? org.defaultInterestRate.toString() : "2",
              default_penalty_amount: org.defaultPenaltyAmount != null ? (Number(org.defaultPenaltyAmount) / 100).toString() : "0",
              max_loan_limit: org.maxLoanLimit ? (Number(org.maxLoanLimit) / 100).toString() : "",
            }))
          }
        }
      } catch (err) {
        console.error("Error checking session:", err)
      } finally {
        setChecking(false)
      }
    }
    checkExisting()
  }, [router])

  const handleSubmit = async () => {
    setLoading(true)
    try {
      let res: Response
      const payload = {
        name: step1.name,
        village: step1.village,
        taluka: step1.taluka,
        district: step1.district,
        meeting_frequency: step1.meeting_frequency,
        monthly_saving_amount: parseFloat(step2.monthly_saving_amount) || 0,
        default_interest_rate: parseFloat(step2.default_interest_rate) || 2,
        default_penalty_amount: parseFloat(step2.default_penalty_amount) || 0,
        max_loan_limit: parseFloat(step2.max_loan_limit) || 0,
      }

      if (currentMember?.organization?.id) {
        // Update existing organization with user's customized parameters
        res = await fetch(`/api/organizations/${currentMember.organization.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      } else {
        // Create new organization
        res = await fetch("/api/organizations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save organization")
      toast.success(t.creationSuccess)

      router.push("/dashboard")
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50 dark:bg-[#0D1021] transition-colors duration-200">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-orange-50 dark:bg-[#0D1021] transition-colors duration-200">
      <header className="flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🪷</span>
          <span className="font-black text-lg text-[#1B2B6B] dark:text-white uppercase tracking-wider">{t.title}</span>
        </div>
        <div className="flex items-center gap-3">
          {currentMember?.organization && (
            <Link
              href="/dashboard"
              className="text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1A1D27] transition shadow-sm"
            >
              {t.goToDashboard}
            </Link>
          )}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-orange-200 dark:border-gray-800 text-xs font-bold text-orange-600 dark:text-orange-400 bg-white dark:bg-[#1A1D27] hover:bg-orange-50 dark:hover:bg-orange-950/20 active:scale-95 transition-all shadow-sm"
          >
            <span>🌐</span>
            <span className="font-extrabold">{lang === "en" ? "मराठी" : "English"}</span>
          </button>
          <DarkModeToggle className="bg-white hover:bg-orange-50 text-gray-700 border border-orange-200 dark:bg-[#1A1D27] dark:hover:bg-gray-800 dark:text-white dark:border-gray-800" />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg bg-white dark:bg-[#1A1D27] rounded-3xl shadow-xl p-8 border border-orange-100 dark:border-gray-800 transition-all duration-300">
          <div className="flex items-center justify-center gap-4 mb-8">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    step === s
                      ? "bg-orange-600 text-white"
                      : step > s
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {step > s ? "✓" : s}
                </div>
                <span
                  className={`text-xs font-bold hidden sm:block ${
                    step === s ? "text-orange-600 dark:text-orange-400" : "text-gray-400"
                  }`}
                >
                  {s === 1 ? t.step1Title : t.step2Title}
                </span>
                {s < 2 && <div className={`w-12 h-0.5 ${step > s ? "bg-green-500" : "bg-gray-200 dark:bg-gray-800"}`} />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-black text-[#1B2B6B] dark:text-white pb-1 border-b border-gray-100 dark:border-gray-800">
                {t.step1Title}
              </h2>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  {t.gatName}
                </label>
                <input
                  type="text"
                  required
                  value={step1.name}
                  onChange={(e) => setStep1({ ...step1, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 dark:bg-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition text-sm"
                  placeholder={t.gatNamePlaceholder}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    {t.village}
                  </label>
                  <input
                    type="text"
                    required
                    value={step1.village}
                    onChange={(e) => setStep1({ ...step1, village: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 dark:bg-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition text-sm"
                    placeholder={t.villagePlaceholder}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    {t.taluka}
                  </label>
                  <input
                    type="text"
                    value={step1.taluka}
                    onChange={(e) => setStep1({ ...step1, taluka: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 dark:bg-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition text-sm"
                    placeholder={t.talukaPlaceholder}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  {t.district}
                </label>
                <input
                  type="text"
                  required
                  value={step1.district}
                  onChange={(e) => setStep1({ ...step1, district: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 dark:bg-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition text-sm"
                  placeholder={t.districtPlaceholder}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  {t.frequency}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStep1({ ...step1, meeting_frequency: "MONTHLY" })}
                    className={`py-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      step1.meeting_frequency === "MONTHLY"
                        ? "border-orange-500 bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400"
                        : "border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    <span>📅</span>
                    <span>{t.monthly}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep1({ ...step1, meeting_frequency: "WEEKLY" })}
                    className={`py-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      step1.meeting_frequency === "WEEKLY"
                        ? "border-orange-500 bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400"
                        : "border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    <span>📆</span>
                    <span>{t.weekly}</span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!step1.name || !step1.village || !step1.district) {
                    toast.error(t.fillFields)
                    return
                  }
                  setStep(2)
                }}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md transition active:scale-95"
              >
                {t.next}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-black text-[#1B2B6B] dark:text-white pb-1 border-b border-gray-100 dark:border-gray-800">
                {t.step2Title}
              </h2>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  {t.monthlySaving}
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={step2.monthly_saving_amount}
                  onChange={(e) => setStep2({ ...step2, monthly_saving_amount: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 dark:bg-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition text-sm"
                  placeholder="उदा. 500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    {t.interestRate}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={step2.default_interest_rate}
                    onChange={(e) => setStep2({ ...step2, default_interest_rate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 dark:bg-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition text-sm"
                    placeholder="2.0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    {t.penaltyAmount}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={step2.default_penalty_amount}
                    onChange={(e) => setStep2({ ...step2, default_penalty_amount: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 dark:bg-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition text-sm"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  {t.maxLoan}
                </label>
                <input
                  type="number"
                  min="0"
                  value={step2.max_loan_limit}
                  onChange={(e) => setStep2({ ...step2, max_loan_limit: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 dark:bg-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition text-sm"
                  placeholder="0"
                />
              </div>

              <div className="bg-orange-50/50 dark:bg-orange-950/10 rounded-xl p-4 border border-orange-100 dark:border-orange-950/20 space-y-2">
                <p className="text-xs font-bold text-orange-600 uppercase tracking-wider">{t.summaryTitle}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  📍 <strong>{step1.name}</strong> — {step1.village}, {step1.district}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  📅 {step1.meeting_frequency === "MONTHLY" ? t.monthly : t.weekly}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  💰 {t.monthlySaving.replace(" *", "")}: ₹{step2.monthly_saving_amount || 0} | {t.interestRate}: {step2.default_interest_rate || 2}%
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-gray-300 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition active:scale-95"
                >
                  {t.back}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !step2.monthly_saving_amount}
                  className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    t.createGatBtn
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-gray-400 dark:text-gray-600">
        © 2026 BachatGatOnline. All rights reserved.
      </footer>
    </div>
  )
}
