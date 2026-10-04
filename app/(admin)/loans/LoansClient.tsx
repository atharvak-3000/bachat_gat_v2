"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { formatRupees } from "@/lib/calculations"
import Link from "next/link"
import type { Loan, Member, Role } from "@/types"

interface LoanWithDetails extends Loan {
  member: Member
}

export default function LoansClient({
  loans,
  currentRole,
  activeTab: initialTab,
  members = []
}: {
  loans: LoanWithDetails[]
  currentRole: Role
  activeTab: string
  members?: Member[]
}) {
  const router = useRouter()
  const [tab, setTab] = useState(initialTab)
  const [loadingId, setLoadingId] = useState<string | null>(null)

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
      title: "कर्ज व्यवस्थापन",
      sub: "मागणी केलेल्या कर्जांना मंजुरी द्या, थकीत शिल्लक ट्रॅक करा आणि कर्ज वसुलीचे नियोजन करा.",
      activeLoans: "सक्रिय कर्ज",
      pendingApprovals: "मंजुरी प्रलंबित",
      totalOutstanding: "एकूण येणे कर्ज",
      tabAll: "सर्व",
      tabPending: "प्रलंबित",
      tabActive: "सक्रिय",
      tabClosed: "बंद झालेले",
      memberLabel: "सदस्य",
      guarantorLabel: "जामीनदार",
      loanAmountLabel: "कर्ज रक्कम",
      purposeLabel: "हेतू",
      rateLabel: "व्याज दर (% वार्षिक)",
      outstandingLabel: "येणे शिल्लक",
      disbursedDateLabel: "वितरण तारीख",
      statusLabel: "स्थिती",
      actionsLabel: "कृती",
      noLoansText: "या श्रेणीमध्ये कोणतेही कर्ज आढळले नाही.",
      approveBtn: "मंजूर करा",
      rejectBtn: "नाकारा",
      closeBtn: "कर्ज बंद करा",
      viewBtn: "पहा",
      pendingStatus: "Pending",
      activeStatus: "Active",
      closedStatus: "Closed",
      rejectedStatus: "Rejected",
      approveConfirm: "आपण नक्की हे कर्ज मंजूर करू इच्छिता? यामुळे कर्ज वितरित होईल.",
      rejectConfirmPrompt: "कर्ज नाकारण्याचे कारण प्रविष्ट करा (ऐच्छिक):",
      rejectReasonDefault: "अध्यक्षांद्वारे नाकारले",
      closeConfirm: "आपण नक्की हे कर्ज बंद करू इच्छिता? यामुळे थकीत शिल्लक 0 होईल.",
      noPurpose: "तपशील नाही",
      awaitingSuperAdminHint: "सचिव मंजूर (प्रलंबित)",
    },
    en: {
      title: "Loans Management",
      sub: "Approve requested loans, track outstanding balances, and manage recoveries.",
      activeLoans: "Active Loans",
      pendingApprovals: "Pending Approvals",
      totalOutstanding: "Total Outstanding",
      tabAll: "All",
      tabPending: "Pending",
      tabActive: "Active",
      tabClosed: "Closed",
      memberLabel: "Member",
      guarantorLabel: "Guarantor",
      loanAmountLabel: "Loan Amount",
      purposeLabel: "Purpose",
      rateLabel: "Rate (% p.a.)",
      outstandingLabel: "Outstanding",
      disbursedDateLabel: "Disbursed Date",
      statusLabel: "Status",
      actionsLabel: "Actions",
      noLoansText: "No loans found in this category.",
      approveBtn: "Approve",
      rejectBtn: "Reject",
      closeBtn: "Close Loan",
      viewBtn: "View",
      pendingStatus: "Pending",
      activeStatus: "Active",
      closedStatus: "Closed",
      rejectedStatus: "Rejected",
      approveConfirm: "Are you sure you want to approve this loan? This will disburse the loan.",
      rejectConfirmPrompt: "Please enter the reason for rejection (optional):",
      rejectReasonDefault: "Rejected by Admin",
      closeConfirm: "Are you sure you want to manually CLOSE this loan? This will set outstanding balance to 0.",
      noPurpose: "No purpose",
      awaitingSuperAdminHint: "View (Pending)",
    }
  }
  const t = T[lang]

  function LoanStatusBadge({ status }: { status: string }) {
    switch (status) {
      case 'PENDING':
        return <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30">{t.pendingStatus}</span>
      case 'ACTIVE':
        return <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30">{t.activeStatus}</span>
      case 'CLOSED':
        return <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 border border-green-200/50 dark:border-green-900/30">{t.closedStatus}</span>
      default:
        return <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200/50 dark:border-red-900/30">{t.rejectedStatus}</span>
    }
  }

  const isSuperAdmin = currentRole === 'SUPERADMIN'

  // Calculations for Stats
  const activeLoans = loans.filter(l => l.status === 'ACTIVE')
  const pendingLoans = loans.filter(l => l.status === 'PENDING')
  const closedLoans = loans.filter(l => l.status === 'CLOSED' || l.status === 'REJECTED')

  const totalOutstanding = activeLoans.reduce((sum, l) => sum + l.outstanding_amount, 0)

  // Filter based on selected tab
  const getFilteredLoans = () => {
    switch (tab) {
      case "pending": return pendingLoans
      case "active": return activeLoans
      case "closed": return closedLoans
      default: return loans
    }
  }

  const filteredLoans = getFilteredLoans()

  // Actions
  const handleApprove = async (loanId: string, guarantorId?: string) => {
    if (!confirm(t.approveConfirm)) return
    setLoadingId(loanId)
    try {
      const res = await fetch(`/api/loans/${loanId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guarantor_id: guarantorId || null })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || data.error || "Failed to approve loan")
      }
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoadingId(null)
    }
  }

  const handleReject = async (loanId: string) => {
    const reason = prompt(t.rejectConfirmPrompt)
    if (reason === null) return // User cancelled
    
    setLoadingId(loanId)
    try {
      const res = await fetch(`/api/loans/${loanId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason || t.rejectReasonDefault })
      })
      if (!res.ok) throw new Error("Failed to reject loan")
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoadingId(null)
    }
  }

  const handleClose = async (loanId: string) => {
    if (!confirm(t.closeConfirm)) return
    setLoadingId(loanId)
    try {
      const res = await fetch(`/api/loans/${loanId}/close`, { method: "POST" })
      if (!res.ok) throw new Error("Failed to close loan")
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1B2B6B] dark:text-white">
          {t.title}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 sm:mt-2 text-xs sm:text-sm">
          {t.sub}
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white border border-gray-100 dark:bg-[#1A1D27] dark:border-gray-800 p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl shadow-sm flex flex-col justify-between">
          <span className="text-[10px] md:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider leading-tight block">{t.activeLoans}</span>
          <h4 className="text-lg sm:text-xl md:text-2xl font-black text-[#2E4099] dark:text-blue-400 mt-1.5 md:mt-2">{activeLoans.length}</h4>
        </div>
        <div className="bg-white border border-gray-100 dark:bg-[#1A1D27] dark:border-gray-800 p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl shadow-sm flex flex-col justify-between">
          <span className="text-[10px] md:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider leading-tight block">{t.pendingApprovals}</span>
          <h4 className="text-lg sm:text-xl md:text-2xl font-black text-[#E85D26] dark:text-orange-400 mt-1.5 md:mt-2">{pendingLoans.length}</h4>
        </div>
        <div className="col-span-2 sm:col-span-1 bg-[#1B2B6B] border border-[#1B2B6B] dark:bg-[#0D1021] dark:border-blue-900/30 p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl shadow-md text-white flex flex-col justify-between">
          <span className="text-[10px] md:text-xs font-bold text-white/70 dark:text-white/60 uppercase tracking-wider leading-tight block">{t.totalOutstanding}</span>
          <h4 className="text-base sm:text-xl md:text-2xl font-black text-white mt-1.5 md:mt-2 break-all">{formatRupees(totalOutstanding)}</h4>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 gap-4 text-sm font-semibold overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none">

        {[
          { id: "all", label: `${t.tabAll} (${loans.length})` },
          { id: "pending", label: `${t.tabPending} (${pendingLoans.length})` },
          { id: "active", label: `${t.tabActive} (${activeLoans.length})` },
          { id: "closed", label: `${t.tabClosed} (${closedLoans.length})` }
        ].map(tInfo => (
          <button
            key={tInfo.id}
            onClick={() => setTab(tInfo.id)}
            className={`pb-3 relative transition-colors whitespace-nowrap flex-shrink-0 ${tab === tInfo.id ? "text-[#E85D26]" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"}`}
          >
            {tInfo.label}
            {tab === tInfo.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E85D26] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {filteredLoans.length === 0 ? (
        <div className="bg-white border border-gray-100 dark:bg-[#1A1D27] dark:border-gray-800 rounded-3xl p-12 text-center shadow-sm">
          <p className="text-gray-400 dark:text-gray-500 font-medium italic text-sm">{t.noLoansText}</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 dark:bg-[#1A1D27] dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
          {/* MOBILE LOAN CARDS */}
          <div className="md:hidden space-y-3 p-4 bg-gray-50/50 dark:bg-gray-950/20">
            {filteredLoans.map(loan => (
              <div key={loan.id} className="bg-white dark:bg-[#1A1D27] rounded-2xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm">

                {/* Member + Status */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">
                      {loan.member?.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {loan.purpose || t.noPurpose}
                    </p>
                    {loan.guarantor && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        <strong>{t.guarantorLabel}:</strong>{' '}
                        <Link href={`/members/${loan.guarantor.id}`} className="text-[#2E4099] dark:text-blue-400 hover:underline font-semibold">
                          {loan.guarantor.name}
                        </Link>
                      </p>
                    )}
                  </div>
                  <LoanStatusBadge status={loan.status} />
                </div>

                {/* Amount grid */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-gray-50 dark:bg-gray-950/40 rounded-xl p-2.5">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.loanAmountLabel}</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {formatRupees(loan.loan_amount)}
                    </p>
                  </div>
                  <div className="bg-[#E85D26]/10 dark:bg-[#E85D26]/5 rounded-xl p-2.5">
                    <p className="text-xs text-[#E85D26] dark:text-orange-400 font-semibold">{t.outstandingLabel}</p>
                    <p className="text-sm font-bold text-[#E85D26] dark:text-orange-400">
                      {formatRupees(loan.outstanding_amount)}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-950/40 rounded-xl p-2.5">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.rateLabel.split(' ')[0]}</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {loan.interest_rate}%
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-950/40 rounded-xl p-2.5">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.disbursedDateLabel}</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {loan.disbursed_date ? new Date(loan.disbursed_date).toLocaleDateString('en-IN') : '—'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-wrap pt-2 border-t border-gray-100 dark:border-gray-800">
                  <Link href={`/loans/${loan.id}`}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#2E4099] dark:border-blue-900/50 text-[#2E4099] dark:text-blue-400 hover:bg-[#2E4099]/10 dark:hover:bg-blue-950/20 bg-white dark:bg-gray-950">
                    {t.viewBtn}
                  </Link>
                  {loan.status === 'PENDING' && 
                   currentRole === 'SUPERADMIN' && (
                    <div className="w-full space-y-2 mt-2">
                      <select
                        id={`guarantor-select-mobile-${loan.id}`}
                        className="w-full text-xs border rounded-lg p-2 dark:bg-gray-950 dark:text-white dark:border-gray-800"
                        defaultValue=""
                      >
                        <option value="">{lang === 'mr' ? 'जामीनदार निवडा (पर्यायी)' : 'Select Guarantor (Optional)'}</option>
                        {members
                          .filter(m => m.id !== loan.member_id)
                          .map(m => (
                            <option key={m.id} value={m.id}>
                              {lang === 'mr' && m.name_marathi ? m.name_marathi : m.name}
                            </option>
                          ))}
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const selectEl = document.getElementById(`guarantor-select-mobile-${loan.id}`) as HTMLSelectElement
                            handleApprove(loan.id, selectEl?.value || undefined)
                          }}
                          className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 text-center">
                          {t.approveBtn}
                        </button>
                        <button
                          onClick={() => handleReject(loan.id)}
                          className="flex-1 px-3 py-2 border border-red-300 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-950/20 text-center">
                          {t.rejectBtn}
                        </button>
                      </div>
                    </div>
                  )}
                  {loan.status === 'ACTIVE' && 
                   currentRole === 'SUPERADMIN' && (
                    <button
                      onClick={() => handleClose(loan.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-500 dark:border-red-900/50 text-red-500 dark:text-red-400 hover:bg-red-500 hover:text-white transition">
                      {t.closeBtn}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-950 text-[#1B2B6B]/80 dark:text-white/80 font-bold text-xs border-b border-gray-100 dark:border-gray-800 uppercase tracking-wider">
                  <th className="px-6 py-4">{t.memberLabel}</th>
                  <th className="px-6 py-4">{t.guarantorLabel}</th>
                  <th className="px-6 py-4">{t.loanAmountLabel}</th>
                  <th className="px-6 py-4">{t.purposeLabel}</th>
                  <th className="px-6 py-4 text-center">{t.rateLabel}</th>
                  <th className="px-6 py-4">{t.outstandingLabel}</th>
                  <th className="px-6 py-4">{t.disbursedDateLabel}</th>
                  <th className="px-6 py-4">{t.statusLabel}</th>
                  <th className="px-6 py-4 text-right">{t.actionsLabel}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm font-medium">
                {filteredLoans.map(l => {
                  const rowBg = "hover:bg-[#2E4099]/5 dark:hover:bg-blue-950/10"
                  
                  return (
                    <tr key={l.id} className={`${rowBg} transition-colors`}>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 dark:text-white">{l.member?.name}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {l.guarantor ? (
                          <Link href={`/members/${l.guarantor.id}`} className="hover:underline text-[#2E4099] dark:text-blue-400 font-semibold">
                            {l.guarantor.name}
                          </Link>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-900 dark:text-white">{formatRupees(l.loan_amount)}</td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs truncate max-w-[150px]" title={l.purpose}>
                        {l.purpose || t.noPurpose}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-300">{l.interest_rate}%</td>
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{formatRupees(l.outstanding_amount)}</td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs">
                        {l.disbursed_date ? new Date(l.disbursed_date).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <LoanStatusBadge status={l.status} />
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {l.status === 'PENDING' && (
                          <>
                            {isSuperAdmin ? (
                              <div className="inline-flex flex-col gap-1 items-end">
                                <select
                                  id={`guarantor-select-${l.id}`}
                                  className="text-xs border rounded-lg p-1 bg-white dark:bg-gray-950 dark:text-white dark:border-gray-800 w-44"
                                  defaultValue=""
                                >
                                  <option value="">{lang === 'mr' ? 'जामीनदार निवडा (पर्यायी)' : 'Select Guarantor (Optional)'}</option>
                                  {members
                                    .filter(m => m.id !== l.member_id)
                                    .map(m => (
                                      <option key={m.id} value={m.id}>
                                        {lang === 'mr' && m.name_marathi ? m.name_marathi : m.name}
                                      </option>
                                    ))}
                                </select>
                                <div className="inline-flex gap-2">
                                  <button
                                    disabled={loadingId === l.id}
                                    onClick={() => {
                                      const selectEl = document.getElementById(`guarantor-select-${l.id}`) as HTMLSelectElement
                                      handleApprove(l.id, selectEl?.value || undefined)
                                    }}
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs active:scale-95 transition"
                                  >
                                    {t.approveBtn}
                                  </button>
                                  <button
                                    disabled={loadingId === l.id}
                                    onClick={() => handleReject(l.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs active:scale-95 transition"
                                  >
                                    {t.rejectBtn}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <span 
                                title="Awaiting SuperAdmin approval" 
                                className="inline-block bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 font-semibold px-3 py-1.5 rounded-xl text-xs cursor-help border border-gray-200/50 dark:border-gray-700/50"
                              >
                                {t.awaitingSuperAdminHint}
                              </span>
                            )}
                          </>
                        )}

                        {l.status === 'ACTIVE' && (
                          <div className="inline-flex gap-2">
                            <Link
                              href={`/loans/${l.id}`}
                              className="inline-flex border border-[#2E4099] dark:border-blue-900/50 text-[#2E4099] dark:text-blue-400 hover:bg-[#2E4099]/10 dark:hover:bg-blue-950/20 font-bold px-3 py-1.5 rounded-xl text-xs active:scale-95 transition bg-white dark:bg-gray-950"
                            >
                              {t.viewBtn}
                            </Link>
                            {isSuperAdmin && (
                              <button
                                disabled={loadingId === l.id}
                                onClick={() => handleClose(l.id)}
                                className="bg-white dark:bg-gray-950 border border-red-500 dark:border-red-900/50 text-red-500 dark:text-red-400 hover:bg-red-500 hover:text-white transition-colors font-bold px-3 py-1.5 rounded-xl text-xs active:scale-95 transition"
                              >
                                {t.closeBtn.split(' ')[0]}
                              </button>
                            )}
                          </div>
                        )}

                        {(l.status === 'CLOSED' || l.status === 'REJECTED') && (
                          <Link
                            href={`/loans/${l.id}`}
                            className="inline-flex border border-[#2E4099] dark:border-blue-900/50 text-[#2E4099] dark:text-blue-400 hover:bg-[#2E4099]/10 dark:hover:bg-blue-950/20 font-bold px-3 py-1.5 rounded-xl text-xs active:scale-95 transition bg-white dark:bg-gray-950"
                          >
                            {t.viewBtn}
                          </Link>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
