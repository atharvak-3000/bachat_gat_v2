"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { formatRupees } from "@/lib/calculations"
import Link from "next/link"
import type { Loan, Member } from "@/types"

interface LoanWithMember extends Loan {
  member: Member
}

export default function LoanDetailClient({
  loan,
  role
}: {
  loan: LoanWithMember
  role?: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

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

  const T = {
    mr: {
      backToList: "← कर्ज सूचीवर परत जा",
      loanDetailsHeader: "कर्ज माहिती",
      guarantorLabel: "जामीनदार",
      purposeLabel: "हेतू:",
      rateLabel: "व्याज दर:",
      monthsLabel: "महिने:",
      repaymentProgress: "परतफेड प्रगती",
      paidPercent: "भरले",
      repaidAmount: "एकूण परतफेड:",
      outstandingAmount: "थकीत रक्कम:",
      statusLabel: "कर्ज स्थिती",
      pendingApproval: "मंजुरी प्रलंबित",
      activeStatus: "चालू",
      closedStatus: "बंद",
      rejectedStatus: "नाकारले",
      reasonLabel: "कारण:",
      defaultPurpose: "वैयक्तिक / सर्वसाधारण",
      closeLoanBtn: "कर्ज बंद करा",
      closeLoanConfirm: "तुम्हाला खात्री आहे का हे कर्ज बंद करायचे आहे? यामुळे शिल्लक रक्कम ० होईल.",
      disbursedLabel: "वितरण तारीख:",
      loanAmountLabel: "कर्ज रक्कम:",
      repaymentNote: "परतफेड बैठकांमध्ये नोंदवली जाते.",
    },
    en: {
      backToList: "← Back to Loans List",
      loanDetailsHeader: "Loan Details",
      guarantorLabel: "Guarantor",
      purposeLabel: "Purpose:",
      rateLabel: "Rate:",
      monthsLabel: "Months:",
      repaymentProgress: "Repayment Progress",
      paidPercent: "Paid",
      repaidAmount: "Repaid:",
      outstandingAmount: "Outstanding:",
      statusLabel: "Loan Status",
      pendingApproval: "Pending Approval",
      activeStatus: "Active",
      closedStatus: "Closed",
      rejectedStatus: "Rejected",
      reasonLabel: "Reason:",
      defaultPurpose: "Personal / General",
      closeLoanBtn: "Close Loan",
      closeLoanConfirm: "Are you sure you want to manually close this loan? This will set outstanding balance to 0.",
      disbursedLabel: "Disbursed:",
      loanAmountLabel: "Loan Amount:",
      repaymentNote: "Repayments are recorded via meetings.",
    }
  }
  const t = T[lang]

  const progressPercent = loan.loan_amount > 0
    ? Math.min(100, Math.round(((loan.loan_amount - loan.outstanding_amount) / loan.loan_amount) * 100))
    : 0

  const handleCloseLoan = async () => {
    if (!confirm(t.closeLoanConfirm)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/loans/${loan.id}/close`, { method: "POST" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to close loan")
      }
      router.refresh()
      router.push("/loans")
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Back Link */}
      <Link href="/loans" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400 transition font-medium">
        {t.backToList}
      </Link>

      {/* Main Loan Info Card */}
      <div className="bg-white border border-gray-100 dark:bg-[#1A1D27] dark:border-gray-800 rounded-3xl p-6 md:p-8 shadow-sm grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-5">
          <div>
            <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">{t.loanDetailsHeader}</span>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mt-1">
              {loan.member?.name} — {formatRupees(loan.loan_amount)}
            </h1>
            {loan.guarantor && (
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                {t.guarantorLabel}:{' '}
                <Link href={`/members/${loan.guarantor.id}`} className="text-[#2E4099] dark:text-blue-400 hover:underline font-bold">
                  {loan.guarantor.name}
                </Link>
              </p>
            )}
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-gray-50 dark:bg-gray-950/60 rounded-2xl p-3.5">
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t.loanAmountLabel.replace(':', '')}</p>
              <p className="text-base font-black text-gray-900 dark:text-white mt-0.5">{formatRupees(loan.loan_amount)}</p>
            </div>
            <div className="bg-orange-50/60 dark:bg-orange-950/10 rounded-2xl p-3.5">
              <p className="text-[10px] font-bold text-orange-500/80 uppercase tracking-wider">{t.outstandingAmount.replace(':', '')}</p>
              <p className="text-base font-black text-orange-600 dark:text-orange-400 mt-0.5">{formatRupees(loan.outstanding_amount)}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-950/60 rounded-2xl p-3.5">
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t.rateLabel.replace(':', '')}</p>
              <p className="text-base font-black text-gray-900 dark:text-white mt-0.5">{loan.interest_rate}% p.a.</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-950/60 rounded-2xl p-3.5">
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t.purposeLabel.replace(':', '')}</p>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-0.5 truncate">{loan.purpose || t.defaultPurpose}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-950/60 rounded-2xl p-3.5">
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t.monthsLabel.replace(':', '')}</p>
              <p className="text-base font-black text-gray-900 dark:text-white mt-0.5">{loan.term_months}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-950/60 rounded-2xl p-3.5">
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t.disbursedLabel.replace(':', '')}</p>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-0.5">
                {loan.disbursed_date ? new Date(loan.disbursed_date).toLocaleDateString('en-IN') : '—'}
              </p>
            </div>
          </div>

          {/* Repayment Progress */}
          {(loan.status === 'ACTIVE' || loan.status === 'CLOSED') && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-gray-500 dark:text-gray-400">
                <span>{t.repaymentProgress}</span>
                <span className="text-orange-600 dark:text-orange-400">{progressPercent}% {t.paidPercent}</span>
              </div>
              <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                <span>{t.repaidAmount} {formatRupees(loan.loan_amount - loan.outstanding_amount)}</span>
                <span>{t.outstandingAmount} {formatRupees(loan.outstanding_amount)}</span>
              </div>
            </div>
          )}

          {/* Note about repayment tracking */}
          <div className="flex items-center gap-2 bg-blue-50/60 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30 rounded-xl px-3.5 py-2.5 text-xs text-blue-700 dark:text-blue-400 font-medium">
            <span>ℹ️</span>
            <span>{t.repaymentNote}</span>
          </div>
        </div>

        {/* Status + Action Panel */}
        <div className="bg-gray-50 dark:bg-gray-950 p-6 rounded-2xl flex flex-col justify-center items-center text-center space-y-3">
          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">{t.statusLabel}</span>
          <div>
            {loan.status === 'PENDING' ? (
              <span className="inline-flex px-4 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30">
                {t.pendingApproval}
              </span>
            ) : loan.status === 'ACTIVE' ? (
              <span className="inline-flex px-4 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200 dark:border-blue-900/30">
                {t.activeStatus}
              </span>
            ) : loan.status === 'CLOSED' ? (
              <span className="inline-flex px-4 py-1.5 rounded-full text-xs font-bold bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 border border-green-200 dark:border-green-900/30">
                {t.closedStatus}
              </span>
            ) : (
              <span className="inline-flex px-4 py-1.5 rounded-full text-xs font-bold bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-900/30">
                {t.rejectedStatus}
              </span>
            )}
          </div>
          {loan.status === 'ACTIVE' && role === 'SUPERADMIN' && (
            <button
              onClick={handleCloseLoan}
              disabled={loading}
              className="mt-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border border-red-500/60 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 transition disabled:opacity-50"
            >
              {loading ? "..." : t.closeLoanBtn}
            </button>
          )}
          {loan.rejection_reason && (
            <p className="text-xs text-red-500 dark:text-red-400 font-medium">{t.reasonLabel} {loan.rejection_reason}</p>
          )}
        </div>
      </div>
    </div>
  )
}
