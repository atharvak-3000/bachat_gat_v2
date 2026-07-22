"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [lang, setLang] = useState<"mr" | "en">("mr")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("bb_lang") as "mr" | "en"
      if (stored === "mr" || stored === "en") {
        setLang(stored)
      }
    }
  }, [])

  const T = {
    mr: {
      title: "पासवर्ड विसरलात?",
      sub: "कृपया तुमच्या बचत गटाच्या अध्यक्षांशी संपर्क साधा किंवा खाली तुमचा ईमेल टाका.",
      emailLabel: "ईमेल पत्ता",
      submitBtn: "पासवर्ड रीसेट करा",
      submitting: "प्रक्रिया करत आहे...",
      successMsg: "कृपया तुमच्या बचत गटाच्या अध्यक्षांशी संपर्क साधून तुमचा पासवर्ड रिसेट करून घ्या.",
      backToSignIn: "← लॉगिनवर परत जा",
      platform: "बचत गट ऑनलाइन",
    },
    en: {
      title: "Forgot Password?",
      sub: "Please contact your Bachat Gat superadmin or enter your email below.",
      emailLabel: "Email Address",
      submitBtn: "Reset Password",
      submitting: "Processing...",
      successMsg: "Please contact your Bachat Gat superadmin to reset your password.",
      backToSignIn: "← Back to Login",
      platform: "Bachatgat Online",
    },
  }
  const t = T[lang]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      setSuccess(true)
    } catch (err: any) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-[#0D1021] dark:to-[#0F1117] flex items-center justify-center p-4 transition-colors duration-250">
      <div className="absolute top-4 left-4 font-black text-lg text-orange-600 dark:text-orange-400">
        🪷 {t.platform}
      </div>

      <div className="w-full max-w-md">
        <Link
          href="/sign-in"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 mb-6 font-semibold transition"
        >
          {t.backToSignIn}
        </Link>

        <div className="bg-white dark:bg-[#1A1D27] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl p-8 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">
              {t.title}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-relaxed">
              {t.sub}
            </p>
          </div>

          {success ? (
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 rounded-2xl p-5 text-sm text-green-800 dark:text-green-400 font-medium leading-relaxed animate-fadeIn">
              ℹ️ {t.successMsg}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                  {t.emailLabel}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                />
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400 font-semibold animate-pulse">
                  ⚠️ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold py-3.5 rounded-xl text-center text-sm shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-50 transition duration-150"
              >
                {loading ? t.submitting : t.submitBtn}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
