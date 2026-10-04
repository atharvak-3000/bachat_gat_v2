import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { calcMemberStats, formatRupees, formatMonthYear } from "@/lib/calculations"
import type { MeetingContribution, Meeting, Loan } from "@/types"
import { cookies } from "next/headers"
import { getTranslation } from "@/lib/translations"

export default async function MemberPage() {
  const cookieStore = await cookies()
  const lang = (cookieStore.get("language")?.value || "en") as "en" | "mr"
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(lang, key)

  let performer
  try {
    performer = await requireAuth()
  } catch {
    redirect("/sign-in")
  }

  const [contribs, loans] = await Promise.all([
    prisma.meetingContribution.findMany({
      where: { memberId: performer.id },
      include: { meeting: true },
    }),
    prisma.loan.findMany({
      where: { memberId: performer.id },
      orderBy: { createdAt: "desc" },
    }),
  ])

  const memberContribs = contribs.map((c: any) => ({
    ...c,
    meeting_id: c.meetingId,
    member_id: c.memberId,
    savings_amount: Number(c.savingsAmount),
    loan_repayment: Number(c.loanRepayment),
    interest_paid: Number(c.interestPaid),
    penalty_paid: Number(c.penaltyPaid),
    other_amount: Number(c.otherAmount),
    is_present: c.isPresent,
    meeting: {
      ...c.meeting,
      organization_id: c.meeting.organizationId,
      month_year: c.meeting.monthYear,
      meeting_date: c.meeting.meetingDate.toISOString().split("T")[0],
      opening_balance: Number(c.meeting.openingBalance),
      created_at: c.meeting.createdAt.toISOString(),
    },
  })) as unknown as (MeetingContribution & { meeting: Meeting })[]

  const memberLoans = loans.map((l: any) => ({
    ...l,
    organization_id: l.organizationId,
    member_id: l.memberId,
    guarantor_id: l.guarantorId,
    loan_amount: Number(l.loanAmount),
    outstanding_amount: Number(l.outstandingAmount),
    interest_rate: Number(l.interestRate),
    disbursed_date: l.disbursedDate ? l.disbursedDate.toISOString().split("T")[0] : null,
    term_months: l.termMonths,
    created_at: l.createdAt.toISOString(),
  })) as unknown as Loan[]

  const stats = calcMemberStats(
    memberContribs.map((c: any) => ({
      savings_amount: c.savings_amount,
      interest_paid: c.interest_paid,
      is_present: c.is_present,
    })),
    memberLoans.map((l: any) => ({
      outstanding_amount: l.outstanding_amount,
      status: l.status,
    }))
  )

  const activeLoan = memberLoans.find((l: any) => l.status === "ACTIVE")
  const pendingLoans = memberLoans.filter((l: any) => l.status === "PENDING")
  const closedLoans = memberLoans.filter((l: any) => l.status === "CLOSED" || l.status === "REJECTED")

  let loanProgressPercent = 0
  if (activeLoan && activeLoan.loan_amount > 0) {
    const repaid = activeLoan.loan_amount - activeLoan.outstanding_amount
    loanProgressPercent = Math.min(100, Math.max(0, Math.round((repaid / activeLoan.loan_amount) * 100)))
  }

  const orgMembers = await prisma.member.findMany({
    where: { organizationId: performer.organization_id },
    select: { id: true },
  })

  const memberIds = orgMembers.map((m: any) => m.id)

  let orgSavings = 0
  let orgInterest = 0
  let orgFines = 0

  if (memberIds.length > 0) {
    const orgContribs = await prisma.meetingContribution.findMany({
      where: { memberId: { in: memberIds } },
      select: { savingsAmount: true, interestPaid: true, penaltyPaid: true },
    })

    orgSavings = orgContribs.reduce((sum: number, c: any) => sum + Number(c.savingsAmount), 0)
    orgInterest = orgContribs.reduce((sum: number, c: any) => sum + Number(c.interestPaid), 0)
    orgFines = orgContribs.reduce((sum: number, c: any) => sum + Number(c.penaltyPaid), 0)
  }

  const activeOrgLoans = await prisma.loan.findMany({
    where: {
      organizationId: performer.organization_id,
      status: "ACTIVE",
    },
    select: { outstandingAmount: true },
  })

  const orgLoansOut = activeOrgLoans.reduce((sum: number, l: any) => sum + Number(l.outstandingAmount), 0)

  const sortedContributions = [...memberContribs]
    .sort((a, b) => new Date(b.meeting.meeting_date).getTime() - new Date(a.meeting.meeting_date).getTime())
    .slice(0, 12)

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Welcome Card */}
      <div className="bg-gradient-to-br from-[#1B2B6B] via-[#243782] to-[#2E4099] rounded-2xl p-6 sm:p-8 text-white shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-blue-200 text-xs font-semibold uppercase tracking-wider">{t("welcome")}</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-0.5 tracking-tight">{performer.name} 👋</h1>
            <p className="text-blue-200 text-xs sm:text-sm mt-1">{performer.organization.name}</p>
          </div>
          <div className="inline-flex items-center gap-2 self-start sm:self-auto bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-1.5 rounded-full text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{t("memberName")}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 pt-2 border-t border-white/10">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 sm:p-4 text-center">
            <p className="text-blue-200 text-[10px] sm:text-xs font-medium uppercase tracking-wider">{t("memberNo")}</p>
            <p className="text-white font-black text-lg sm:text-2xl mt-0.5">#{performer.member_number}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 sm:p-4 text-center">
            <p className="text-blue-200 text-[10px] sm:text-xs font-medium uppercase tracking-wider">{t("groupCode")}</p>
            <p className="text-white font-black text-lg sm:text-2xl mt-0.5 font-mono">{performer.organization.group_code}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 sm:p-4 text-center flex flex-col justify-center items-center">
            <p className="text-blue-200 text-[10px] sm:text-xs font-medium uppercase tracking-wider mb-1">{t("kyc")}</p>
            {performer.kyc_status === "VERIFIED" ? (
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full text-xs font-bold">
                ✓ {t("verified")}
              </span>
            ) : performer.kyc_status === "REJECTED" ? (
              <span className="bg-red-500/20 text-red-300 border border-red-400/30 px-2.5 py-0.5 rounded-full text-xs font-bold">
                ✗ {t("rejected")}
              </span>
            ) : (
              <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full text-xs font-bold">
                ⏳ {t("pending")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* KYC Warning/Status Card */}
      {performer.kyc_status !== "VERIFIED" && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border-l-4 border-[#E85D26] rounded-2xl p-5 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#E85D26]/10 text-[#E85D26] flex items-center justify-center shrink-0 text-xl font-bold">
            ℹ️
          </div>
          <div className="space-y-1">
            <h3 className="text-[#1B2B6B] dark:text-white font-bold text-sm sm:text-base">
              {performer.kyc_status === "REJECTED" ? t("kycNotApproved") : t("completeKyc")}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm leading-relaxed">
              {performer.kyc_status === "REJECTED" ? t("kycNotApprovedDesc") : t("completeKycDesc")}
            </p>
          </div>
        </div>
      )}

      {/* Personal Stats Grid: Fully responsive for Mobile, Tablet (2x2), and Desktop (4-col) */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Savings */}
        <div className="bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">
              {t("mySavings")}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm font-bold">
              💰
            </div>
          </div>
          <div className="mt-3">
            <h4 className="text-xl sm:text-2xl font-extrabold text-[#1B2B6B] dark:text-white break-all">
              {formatRupees(stats.total_savings)}
            </h4>
            <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold mt-1 block">
              ✓ {t("verified")}
            </span>
          </div>
        </div>

        {/* Active Loan Due */}
        <div className="bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">
              {t("activeLoanDue")}
            </span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-[#E85D26] flex items-center justify-center text-sm font-bold">
              🏦
            </div>
          </div>
          <div className="mt-3">
            <h4 className="text-xl sm:text-2xl font-extrabold text-[#E85D26] dark:text-orange-400 break-all">
              {formatRupees(stats.outstanding_loan)}
            </h4>
            <span className="text-gray-400 dark:text-gray-500 text-[11px] font-medium mt-1 block">
              {activeLoan ? `${activeLoan.interest_rate}% p.a.` : t("notSpecified")}
            </span>
          </div>
        </div>

        {/* Interest Paid */}
        <div className="bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">
              {t("interestPaid")}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-bold">
              📈
            </div>
          </div>
          <div className="mt-3">
            <h4 className="text-xl sm:text-2xl font-extrabold text-[#1B2B6B] dark:text-white break-all">
              {formatRupees(stats.total_interest_paid)}
            </h4>
            <span className="text-gray-400 dark:text-gray-500 text-[11px] font-medium mt-1 block">
              {t("paid")}
            </span>
          </div>
        </div>

        {/* Attendance */}
        <div className="bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">
              {t("attendance")}
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center text-sm font-bold">
              📅
            </div>
          </div>
          <div className="mt-3">
            <h4 className="text-xl sm:text-2xl font-extrabold text-[#2E4099] dark:text-blue-400">
              {stats.attendance_percent}%
            </h4>
            <span className="text-gray-400 dark:text-gray-500 text-[11px] font-medium mt-1 block">
              {stats.meetings_attended} / {stats.total_meetings} {t("meetings")}
            </span>
          </div>
        </div>
      </div>

      {/* Active Loan Details Card */}
      {activeLoan && (
        <div className="bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b border-gray-100 dark:border-gray-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h2 className="text-lg font-bold text-[#1B2B6B] dark:text-white">{t("activeLoanTitle")}</h2>
              </div>
              {activeLoan.disbursed_date && (
                <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                  {t("disbursedOn")}: {new Date(activeLoan.disbursed_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              )}
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 self-start sm:self-auto">
              ✓ {t("verified")}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Repayment Progress */}
            <div className="space-y-4">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-gray-500 dark:text-gray-400">{t("repaymentProgress")}</span>
                <span className="text-[#E85D26] dark:text-orange-400 font-extrabold">{loanProgressPercent}% {t("paid")}</span>
              </div>
              <div className="w-full h-4 bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden p-0.5 border border-gray-200 dark:border-gray-800">
                <div
                  className="h-full bg-gradient-to-r from-[#1B2B6B] to-[#2E4099] dark:from-blue-600 dark:to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${loanProgressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 font-semibold pt-1">
                <span>{t("repaid")}: <strong className="text-gray-800 dark:text-white">{formatRupees(activeLoan.loan_amount - activeLoan.outstanding_amount)}</strong></span>
                <span>{t("remainingOutstanding")}: <strong className="text-[#E85D26] dark:text-orange-400">{formatRupees(activeLoan.outstanding_amount)}</strong></span>
              </div>
            </div>

            {/* Loan Specs */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50/70 dark:bg-gray-950/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
              <div>
                <span className="text-gray-400 dark:text-gray-500 block font-medium">{t("totalSanctionedLoan")}</span>
                <p className="text-base font-extrabold text-gray-900 dark:text-white mt-1">{formatRupees(activeLoan.loan_amount)}</p>
              </div>
              <div>
                <span className="text-gray-400 dark:text-gray-500 block font-medium">{t("monthlyInterestRate")}</span>
                <p className="text-base font-extrabold text-gray-900 dark:text-white mt-1">{activeLoan.interest_rate}% p.a.</p>
              </div>
              <div>
                <span className="text-gray-400 dark:text-gray-500 block font-medium">{t("term")}</span>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mt-1">{activeLoan.term_months} {t("months")}</p>
              </div>
              {activeLoan.purpose && (
                <div>
                  <span className="text-gray-400 dark:text-gray-500 block font-medium">{t("purpose")}</span>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mt-1 truncate">{activeLoan.purpose}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pending Loan Requests (if any) */}
      {pendingLoans.length > 0 && (
        <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">⏳</span>
            <h3 className="font-bold text-amber-900 dark:text-amber-200 text-sm sm:text-base">{t("pendingApproval")}</h3>
          </div>
          {pendingLoans.map((loan) => (
            <div key={loan.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white/80 dark:bg-gray-900/60 p-3.5 rounded-xl text-xs">
              <div>
                <span className="font-extrabold text-gray-900 dark:text-white text-sm">{formatRupees(loan.loan_amount)}</span>
                <span className="text-gray-500 dark:text-gray-400 ml-2">({loan.term_months} {t("months")})</span>
              </div>
              <span className="text-amber-700 dark:text-amber-400 font-semibold">{t("awaitingSuperAdmin")}</span>
            </div>
          ))}
        </div>
      )}

      {/* Past Closed / Rejected Loans (if any) */}
      {closedLoans.length > 0 && (
        <div className="bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-[#1B2B6B] dark:text-white text-base border-b border-gray-100 dark:border-gray-800 pb-3">
            📜 {t("loanHistory")}
          </h3>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {closedLoans.map((loan) => (
              <div key={loan.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-gray-800 dark:text-gray-200">{formatRupees(loan.loan_amount)}</p>
                  <p className="text-gray-400 dark:text-gray-500 text-[11px]">
                    {loan.disbursed_date ? `${t("disbursedOn")}: ${loan.disbursed_date}` : t("notSpecified")}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                  loan.status === "CLOSED"
                    ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                }`}>
                  {loan.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Responsive Section Grid: My Savings History + Gat Transparency */}
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Savings History Table (2 Columns on Large Screens, full width on Mobile/Tablet) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-gray-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
            <h2 className="text-base sm:text-lg font-bold text-[#1B2B6B] dark:text-white">
              💳 {t("mySavingsHistory")}
            </h2>
            <span className="text-xs text-gray-400 font-medium">{sortedContributions.length} {t("meetings")}</span>
          </div>

          {sortedContributions.length === 0 ? (
            <p className="text-gray-400 dark:text-gray-500 text-xs italic py-8 text-center">{t("noContributions")}</p>
          ) : (
            <div className="overflow-x-auto -mx-2 sm:mx-0 rounded-xl border border-gray-100 dark:border-gray-800">
              <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-[#1B2B6B] dark:bg-gray-950 text-white text-xs font-semibold uppercase tracking-wider">
                    <th className="px-3.5 py-3">{t("month")}</th>
                    <th className="px-3.5 py-3 text-center">{t("attendance")}</th>
                    <th className="px-3.5 py-3">{t("savings")}</th>
                    <th className="px-3.5 py-3">{t("repaid")}</th>
                    <th className="px-3.5 py-3">{t("interest")}</th>
                    <th className="px-3.5 py-3">{t("penalty")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium text-gray-700 dark:text-gray-300">
                  {sortedContributions.map((c) => (
                    <tr key={c.id} className="odd:bg-white odd:dark:bg-[#1A1D27] even:bg-gray-50/60 even:dark:bg-gray-950/30 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors">
                      <td className="px-3.5 py-3 font-bold text-gray-900 dark:text-white whitespace-nowrap">
                        {formatMonthYear(c.meeting.month_year)}
                      </td>
                      <td className="px-3.5 py-3 text-center whitespace-nowrap">
                        {c.is_present ? (
                          <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                            ✓ {t("present")}
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400 font-bold text-[11px]">
                            ✗ {t("absent")}
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-3 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                        {formatRupees(c.savings_amount)}
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap">{formatRupees(c.loan_repayment)}</td>
                      <td className="px-3.5 py-3 text-[#E85D26] dark:text-orange-400 font-semibold whitespace-nowrap">
                        {formatRupees(c.interest_paid)}
                      </td>
                      <td className="px-3.5 py-3 text-red-500 dark:text-red-400 font-semibold whitespace-nowrap">
                        {formatRupees(c.penalty_paid)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Gat Transparency Section (1 Column on Desktop, full width or side-by-side on Tablet) */}
        <div className="lg:col-span-1 bg-white dark:bg-[#1A1D27] border border-gray-100 dark:border-gray-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="border-b border-gray-100 dark:border-gray-800 pb-3">
            <h2 className="text-base sm:text-lg font-bold text-[#1B2B6B] dark:text-white flex items-center gap-2">
              <span>📊</span>
              <span>{t("gatTransparency")}</span>
            </h2>
            <p className="text-gray-400 dark:text-gray-500 text-[11px] mt-1 leading-normal">
              {t("transparencyDesc")}
            </p>
          </div>

          <div className="space-y-3.5 pt-1">
            <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-gray-800/80">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">{t("totalGroupSavings")}</span>
              <strong className="text-sm font-extrabold text-gray-900 dark:text-white">{formatRupees(orgSavings)}</strong>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-gray-800/80">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">{t("outstandingLoans")}</span>
              <strong className="text-sm font-extrabold text-gray-900 dark:text-white">{formatRupees(orgLoansOut)}</strong>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-gray-800/80">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">{t("interestCollected")}</span>
              <strong className="text-sm font-extrabold text-[#E85D26] dark:text-orange-400">{formatRupees(orgInterest)}</strong>
            </div>
            <div className="flex justify-between items-center py-2.5">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">{t("finesCollected")}</span>
              <strong className="text-sm font-extrabold text-red-500 dark:text-red-400">{formatRupees(orgFines)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
