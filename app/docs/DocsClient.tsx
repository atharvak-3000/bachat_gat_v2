"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { 
  Search, 
  BookOpen, 
  UserPlus, 
  ShieldCheck, 
  CreditCard, 
  CalendarCheck, 
  FileText, 
  Calculator, 
  ArrowLeft, 
  Globe, 
  CheckCircle2, 
  ChevronRight,
  Download,
  HelpCircle,
  TrendingUp,
  Building2,
  Lock,
  Sparkles
} from "lucide-react"

interface DocStep {
  titleEn: string
  titleMr: string
  descEn: string
  descMr: string
  detailsEn: string[]
  detailsMr: string[]
  screenshot: string
  badgeEn: string
  badgeMr: string
}

interface DocModule {
  id: string
  icon: React.ElementType
  titleEn: string
  titleMr: string
  summaryEn: string
  summaryMr: string
  steps: DocStep[]
}

export default function DocsClient() {
  const [lang, setLang] = useState<"mr" | "en">("mr")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeModuleId, setActiveModuleId] = useState("onboarding")

  // Interactive Calculator State
  const [calcAmount, setCalcAmount] = useState<number>(10000)
  const [calcInterestRate, setCalcInterestRate] = useState<number>(2.0) // 2% per month
  const [calcTenureMonths, setCalcTenureMonths] = useState<number>(10)

  // Calculations
  const calculatedEmi = useMemo(() => {
    const monthlyRate = calcInterestRate / 100
    const principal = calcAmount
    const months = calcTenureMonths
    if (principal <= 0 || months <= 0) return { emi: 0, totalInterest: 0, totalAmount: 0 }

    // Equal Monthly Installment formula: P * r * (1+r)^n / ((1+r)^n - 1)
    if (monthlyRate === 0) {
      const emi = principal / months
      return { emi: Math.round(emi), totalInterest: 0, totalAmount: principal }
    }
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
    const totalAmount = emi * months
    const totalInterest = totalAmount - principal
    return {
      emi: Math.round(emi),
      totalInterest: Math.round(totalInterest),
      totalAmount: Math.round(totalAmount)
    }
  }, [calcAmount, calcInterestRate, calcTenureMonths])

  const modules: DocModule[] = [
    {
      id: "onboarding",
      icon: Building2,
      titleEn: "1. Bachat Gat Registration & Setup",
      titleMr: "१. बचत गट नोंदणी आणि सेटअप",
      summaryEn: "Register your Self-Help Group, set monthly savings rules, interest rates, and generate a unique Group Code.",
      summaryMr: "तुमचा स्वयंसहायता समूह नोंदवा, मासिक बचतीचे नियम, व्याज दर सेट करा आणि युनिक गट कोड तयार करा.",
      steps: [
        {
          titleEn: "Step 1: Access Registration Portal",
          titleMr: "पायरी १: नोंदणी पोर्टलवर जा",
          descEn: "Navigate to 'Register Group / गटाची नोंदणी करा' on the homepage or open /onboarding.",
          descMr: "मुख्यपृष्ठावरील 'गटाची नोंदणी करा' बटणावर क्लिक करा किंवा /onboarding उघडा.",
          detailsEn: [
            "Enter Bachat Gat Name in English & Marathi",
            "Select District, Taluka, and Village name",
            "Set contact person phone number and president email"
          ],
          detailsMr: [
            "इंग्रजी आणि मराठीत बचत गटाचे नाव प्रविष्ट करा",
            "जिल्हा, तालुका आणि गावाचे नाव निवडा",
            "संपर्क व्यक्तीचा फोन नंबर आणि अध्यक्षांचा ईमेल प्रविष्ट करा"
          ],
          screenshot: "/docs/screenshots/step1_gat_registration.png",
          badgeEn: "Group Setup",
          badgeMr: "गट सेटअप"
        },
        {
          titleEn: "Step 2: Define Group Rules & Parameters",
          titleMr: "पायरी २: गटाचे नियम आणि निकष निश्चित करा",
          descEn: "Set monthly savings contribution per member, default interest rate %, late fines, and maximum loan ceiling.",
          descMr: "प्रत्येक सदस्याची मासिक बचत रक्कम, डीफॉल्ट व्याज दर, उशिराचा दंड आणि कमाल कर्ज मर्यादा सेट करा.",
          detailsEn: [
            "Monthly Contribution Amount (e.g. ₹200/month)",
            "Default Monthly Interest Rate (e.g. 2.0% per month)",
            "Automatic 5-character Group Code Generation (e.g. SG001)"
          ],
          detailsMr: [
            "मासिक बचत रक्कम (उदा. ₹२००/महिना)",
            "डीफॉल्ट मासिक व्याज दर (उदा. २.०% दरमहा)",
            "स्वयंचलित ५-अक्षरी गट कोड निर्मिती (उदा. SG001)"
          ],
          screenshot: "/docs/screenshots/step1_gat_registration.png",
          badgeEn: "Financial Rules",
          badgeMr: "आर्थिक नियम"
        }
      ]
    },
    {
      id: "members",
      icon: UserPlus,
      titleEn: "2. Member Management & Joining",
      titleMr: "२. सदस्य व्यवस्थापन आणि सहभाग",
      summaryEn: "Add members manually, share the Group Code for self-registration, and manage roles.",
      summaryMr: "सदस्यांना मॅन्युअली जोडा, स्वयं-नोंदणीसाठी गट कोड शेअर करा आणि भूमिका व्यवस्थापित करा.",
      steps: [
        {
          titleEn: "Step 1: Admin Adds Members Directly",
          titleMr: "पायरी १: ॲडमिनद्वारे नवीन सदस्य जोडणे",
          descEn: "Gat President or Admin opens /members and clicks 'Add New Member'.",
          descMr: "गट अध्यक्ष किंवा ॲडमिन /members उघडून 'नवीन सदस्य जोडा' वर क्लिक करतात.",
          detailsEn: [
            "Input Full Name, Mobile Number, and Role (Admin / Member)",
            "Assign Member Roll Number (1, 2, 3...)",
            "System creates credentials and member record"
          ],
          detailsMr: [
            "पूर्ण नाव, मोबाईल नंबर आणि भूमिका (ॲडमिन / सदस्य) प्रविष्ट करा",
            "सदस्य क्रमांक (१, २, ३...) नियुक्त करा",
            "सिस्टम सदस्य खाते तयार करते"
          ],
          screenshot: "/docs/screenshots/step2_add_members.png",
          badgeEn: "Member Directory",
          badgeMr: "सदस्य यादी"
        },
        {
          titleEn: "Step 2: Self-Joining via Group Code",
          titleMr: "पायरी २: गट कोडद्वारे सदस्यांचा स्वयं-सहभाग",
          descEn: "Members visit /join, enter the Group Code (e.g. SG001), and submit request.",
          descMr: "सदस्य /join वर जाऊन गट कोड (उदा. SG001) प्रविष्ट करून अर्ज सादर करतात.",
          detailsEn: [
            "Instant verification of Group Code validity",
            "Admin receives approval prompt on dashboard",
            "Status moves from PENDING to ACTIVE upon admin approval"
          ],
          detailsMr: [
            "गट कोडच्या वैधतेची झटपट पडताळणी",
            "ॲडमिनला डॅशबोर्डवर मंजुरीची सूचना मिळते",
            "ॲडमिन मंजुरीनंतर स्टेटस ACTIVE होते"
          ],
          screenshot: "/docs/screenshots/step2_add_members.png",
          badgeEn: "Group Code Join",
          badgeMr: "गट कोड सहभाग"
        }
      ]
    },
    {
      id: "kyc",
      icon: ShieldCheck,
      titleEn: "3. Member KYC Document Verification",
      titleMr: "३. सदस्य केवायसी कागदपत्र पडताळणी",
      summaryEn: "Secure identity verification through Aadhaar, PAN card, and Bank account details.",
      summaryMr: "आधार, पॅन कार्ड आणि बँक खाते तपशीलांद्वारे सुरक्षित ओळख पडताळणी.",
      steps: [
        {
          titleEn: "Step 1: Member Uploads KYC Documents",
          titleMr: "पायरी १: सदस्याने केवायसी कागदपत्रे अपलोड करणे",
          descEn: "Members access /member/kyc from their portal to submit identity proof.",
          descMr: "सदस्य त्यांच्या पोर्टलवरून /member/kyc उघडून ओळख पुरावा सादर करतात.",
          detailsEn: [
            "Upload Aadhaar Card photo / document",
            "Upload PAN Card or Voter ID",
            "Enter Bank Account Number & IFSC for direct disbursements"
          ],
          detailsMr: [
            "आधार कार्ड फोटो / कागदपत्र अपलोड करा",
            "पॅन कार्ड किंवा मतदान ओळखपत्र अपलोड करा",
            "थेट वर्गणीसाठी बँक खाते क्रमांक आणि IFSC टाका"
          ],
          screenshot: "/docs/screenshots/step3_kyc_verification.png",
          badgeEn: "KYC Submission",
          badgeMr: "केवायसी सबमिशन"
        },
        {
          titleEn: "Step 2: Admin Verifies & Approves KYC",
          titleMr: "पायरी २: ॲडमिन केवायसी तपासून मंजूर करतो",
          descEn: "Admins review uploaded documents under Member KYC Reviews.",
          descMr: "ॲडमिन सदस्य केवायसी पुनरावलोकनांतर्गत अपलोड केलेली कागदपत्रे तपासतात.",
          detailsEn: [
            "Inspect high-resolution document previews",
            "Verify name matching bank account",
            "Click Approve or Reject with feedback comments"
          ],
          detailsMr: [
            "कागदपत्रांची अचूक तपासणी करा",
            "बँक खात्याशी नाव जुळत असल्याची खात्री करा",
            "मंजूर करा किंवा कारणासह नाकारा"
          ],
          screenshot: "/docs/screenshots/step3_kyc_verification.png",
          badgeEn: "KYC Approval",
          badgeMr: "केवायसी मंजुरी"
        }
      ]
    },
    {
      id: "loans",
      icon: CreditCard,
      titleEn: "4. Setting Up & Applying for a Loan",
      titleMr: "४. कर्जाची मागणी आणि अर्ज",
      summaryEn: "Flexible loan application system with purpose specification, tenure selection, and guarantor binding.",
      summaryMr: "कर्जाचे कारण, कालावधी आणि जामीनदारासह लवचिक कर्ज अर्ज प्रणाली.",
      steps: [
        {
          titleEn: "Step 1: Submitting a Loan Request",
          titleMr: "पायरी १: कर्जाचा नवीन अर्ज सादर करणे",
          descEn: "Members open /member/loans to request funds from the Gat's accumulated savings pool.",
          descMr: "सदस्य जमा बचतीमधून कर्जासाठी /member/loans उघडून अर्ज करतात.",
          detailsEn: [
            "Select Loan Amount (e.g. ₹10,000)",
            "Enter Purpose (e.g. Agriculture, Business, Health)",
            "Choose Repayment Period in months (e.g. 10 months)",
            "Select an active group member as Guarantor"
          ],
          detailsMr: [
            "कर्जाची रक्कम निवडा (उदा. ₹१०,०००)",
            "कारण टाका (उदा. शेती, व्यवसाय, वैद्यकीय)",
            "परतफेडीचा कालावधी महिन्यांत निवडा (उदा. १० महीने)",
            "सक्रिय सदस्याला जामीनदार म्हणून निवडा"
          ],
          screenshot: "/docs/screenshots/step4_loan_setup.png",
          badgeEn: "Loan Request",
          badgeMr: "कर्ज अर्ज"
        }
      ]
    },
    {
      id: "disbursement",
      icon: TrendingUp,
      titleEn: "5. Loan Approval, Disbursement & EMI Schedule",
      titleMr: "५. कर्ज मंजुरी, वितरण आणि ईएमआय वेळापत्रक",
      summaryEn: "Admin approval workflow, fund disbursement, and automated EMI calculation.",
      summaryMr: "ॲडमिन कर्ज मंजुरी प्रक्रिया, रक्कम वाटप आणि स्वयंचलित ईएमआय वेळापत्रक.",
      steps: [
        {
          titleEn: "Step 1: Admin Review & Approval",
          titleMr: "पायरी १: ॲडमिन पुनरावलोकन आणि मंजुरी",
          descEn: "Admins navigate to /loans, review pending requests, check member savings eligibility, and click Approve.",
          descMr: "ॲडमिन /loans वर जाऊन प्रलंबित अर्जांची पाहणी करतात आणि कर्ज मंजूर करतात.",
          detailsEn: [
            "Check member total savings balance & credit history",
            "Verify Guarantor confirmation status",
            "Click Approve Loan or Reject with reasons"
          ],
          detailsMr: [
            "सदस्याची एकूण बचत आणि पत तपासा",
            "जामीनदाराच्या संमतीची खात्री करा",
            "कर्ज मंजूर करा किंवा नाकारा"
          ],
          screenshot: "/docs/screenshots/step5_loan_disbursement.png",
          badgeEn: "Loan Approval",
          badgeMr: "कर्ज मंजुरी"
        },
        {
          titleEn: "Step 2: Disbursement & Automatic EMI Schedule",
          titleMr: "पायरी २: कर्ज वितरण आणि ईएमआय वेळापत्रक तयार होणे",
          descEn: "Upon disbursement, the system creates the monthly principal and interest installment calendar.",
          descMr: "रक्कम वितरित होताच सिस्टम मासिक मुद्दल आणि व्याजाचे ईएमआय वेळापत्रक तयार करते.",
          detailsEn: [
            "Generates month-by-month repayment breakdown",
            "Calculates Monthly Interest (e.g. 2% on remaining balance)",
            "Tracks payment statuses: PENDING, PAID, OVERDUE"
          ],
          detailsMr: [
            "महिनानिहाय परतफेड तक्ता तयार होतो",
            "मासिक व्याजाची अचूक गणना (उदा. २%)",
            "पेमेंट स्टेटस: PENDING, PAID, OVERDUE"
          ],
          screenshot: "/docs/screenshots/step6_emi_tracker.png",
          badgeEn: "EMI Calendar",
          badgeMr: "ईएमआय कॅलेंडर"
        }
      ]
    },
    {
      id: "meetings",
      icon: CalendarCheck,
      titleEn: "6. Monthly Meetings & Bachat Savings Ledger",
      titleMr: "६. मासिक बैठका आणि बचत लेजर",
      summaryEn: "Batch meeting execution, member attendance, monthly savings collection, and balance reconciliation.",
      summaryMr: "मासिक बैठका घेणे, उपस्थिती नोंदवणे, मासिक बचत जमा करणे आणि ताळेबंद जुळवणे.",
      steps: [
        {
          titleEn: "Step 1: Schedule & Start Monthly Meeting",
          titleMr: "पायरी १: मासिक बैठक सुरू करा",
          descEn: "Admins navigate to /meetings and start a meeting for the current month.",
          descMr: "ॲडमिन /meetings वर जाऊन चालू महिन्याची बैठक सुरू करतात.",
          detailsEn: [
            "Auto-loads all group members into attendance matrix",
            "Pre-fills default monthly savings contribution (e.g. ₹200)",
            "Displays active loan EMI obligations for each member"
          ],
          detailsMr: [
            "सर्व सदस्यांची हजेरी यादी आपोआप लोड होते",
            "मासिक बचत रक्कम (उदा. ₹२००) आपोआप येते",
            "सदस्यांची चालू ईएमआय परतफेड दिसते"
          ],
          screenshot: "/docs/screenshots/step7_monthly_meeting.png",
          badgeEn: "Meeting Entry",
          badgeMr: "बैठक नोंदणी"
        },
        {
          titleEn: "Step 2: Collect Payments & Finalize Ledger",
          titleMr: "पायरी २: रक्कम जमा करा आणि बैठक पूर्ण करा",
          descEn: "Mark attendance, record extra income/expenses, and click Finalize Meeting.",
          descMr: "हजेरी नोंदवा, इतर खर्च/जमा टाका आणि 'बैठक पूर्ण करा' वर क्लिक करा.",
          detailsEn: [
            "Updates group opening and closing cash balances",
            "Generates digital receipts for each member",
            "Locks monthly entries to prevent unauthorized tampering"
          ],
          detailsMr: [
            "गटाची सुरुवातीची व अखेरची शिल्लक अपडेट होते",
            "प्रत्येक सदस्यासाठी डिजिटल पावती तयार होते",
            "पारदर्शकतेसाठी महिन्याच्या नोंदी लॉक होतात"
          ],
          screenshot: "/docs/screenshots/step7_monthly_meeting.png",
          badgeEn: "Ledger Lock",
          badgeMr: "लेजर लॉक"
        }
      ]
    },
    {
      id: "passbook",
      icon: FileText,
      titleEn: "7. Digital Member Passbook & Transparency",
      titleMr: "७. डिजिटल सदस्य पासबुक आणि पारदर्शकता",
      summaryEn: "100% transparent member portal showing total savings, active loan details, and transaction history.",
      summaryMr: "एकूण बचत, चालू कर्ज आणि व्यवहारांच्या नोंदी दर्शवणारे १००% पारदर्शक सदस्य पासबुक.",
      steps: [
        {
          titleEn: "Step 1: Member Access to Passbook",
          titleMr: "पायरी १: सदस्याचे पासबुक पाहणे",
          descEn: "Members log in and open /member/passbook to inspect their ledger.",
          descMr: "सदस्य लॉग इन करून /member/passbook वर स्वतःचा हिशोब पाहतात.",
          detailsEn: [
            "View Total Savings Balance accumulated to date",
            "View Active Loan Outstanding Balance & next EMI due date",
            "Inspect complete meeting-by-meeting payment history"
          ],
          detailsMr: [
            "आजपर्यंत साचलेली एकूण बचत पहा",
            "चालू कर्जाची उर्वरित रक्कम व पुढील ईएमआय तारीख पहा",
            "प्रत्येक बैठकीच्या जमा-खर्चाचा इतिहास तपासा"
          ],
          screenshot: "/docs/screenshots/step8_member_passbook.png",
          badgeEn: "Passbook Ledger",
          badgeMr: "पासबुक लेजर"
        }
      ]
    }
  ]

  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return modules
    const q = searchQuery.toLowerCase()
    return modules.filter(
      (m) =>
        m.titleEn.toLowerCase().includes(q) ||
        m.titleMr.toLowerCase().includes(q) ||
        m.summaryEn.toLowerCase().includes(q) ||
        m.summaryMr.toLowerCase().includes(q) ||
        m.steps.some(
          (s) =>
            s.titleEn.toLowerCase().includes(q) ||
            s.titleMr.toLowerCase().includes(q) ||
            s.descEn.toLowerCase().includes(q) ||
            s.descMr.toLowerCase().includes(q)
        )
    )
  }, [searchQuery, modules])

  const currentModule = useMemo(() => {
    return modules.find((m) => m.id === activeModuleId) || modules[0]
  }, [activeModuleId, modules])

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Top Header Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 text-sm font-medium transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{lang === "mr" ? "मुख्यपृष्ठ" : "Home"}</span>
            </Link>
            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-lg">
                ब
              </div>
              <span className="font-bold text-lg text-slate-900 dark:text-white">
                BachatBook <span className="text-xs bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold">Docs</span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Language Switcher Toggle */}
            <button
              onClick={() => setLang(lang === "mr" ? "en" : "mr")}
              className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
            >
              <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{lang === "mr" ? "English Version" : "مراٹھੀ (मराठी) भाषा"}</span>
            </button>

            <Link
              href="/sign-in"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition"
            >
              {lang === "mr" ? "साइन इन करा" : "Sign In"}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner Section */}
      <section className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 shadow-inner">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{lang === "mr" ? "संपूर्ण वापरकर्ता मार्गदर्शिका आणि नियमावली" : "Complete User Manual & Documentation Portal"}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            {lang === "mr"
              ? "बचत गट वापराचे सर्व सोपे टप्पे शिकून घ्या"
              : "Master Every Feature of BachatBook"}
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto mb-8 leading-relaxed">
            {lang === "mr"
              ? "नवीन बचत गट नोंदणी करणे, सदस्य जोडणे, कर्ज अर्ज, व्याज आकारणी, मासिक बैठका आणि डिजिटल पासबुक बद्दलची सविस्तर माहिती."
              : "Step-by-step documentation for group registration, member management, loan approvals, EMI tracking, monthly meetings, and transparency."}
          </p>

          {/* Search Input Bar */}
          <div className="max-w-xl mx-auto relative">
            <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                lang === "mr"
                  ? "काहीही शोधा (उदा. कर्ज, व्याज, केवायसी, बैठक, पासबुक)..."
                  : "Search documentation (e.g. loans, EMI, KYC, meeting, passbook)..."
              }
              className="w-full bg-slate-950/80 backdrop-blur border border-slate-700 focus:border-emerald-500 text-white placeholder-slate-400 pl-11 pr-4 py-3 rounded-xl text-sm outline-none transition shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Sidebar Navigation */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm sticky top-20">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 px-2">
                {lang === "mr" ? "विभाग मार्गदर्शिका" : "Modules & Topics"}
              </h2>

              <nav className="space-y-1">
                {filteredModules.map((m) => {
                  const Icon = m.icon
                  const isActive = activeModuleId === m.id
                  return (
                    <button
                      key={m.id}
                      onClick={() => setActiveModuleId(m.id)}
                      className={`w-full flex items-start space-x-3 p-3 rounded-xl text-left transition ${
                        isActive
                          ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800/60"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">
                          {lang === "mr" ? m.titleMr : m.titleEn}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 font-normal">
                          {lang === "mr" ? m.summaryMr : m.summaryEn}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </nav>

              {/* Download Markdown Doc Link Box */}
              <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
                <a
                  href="/docs/USER_GUIDE.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center space-x-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition shadow-sm"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>{lang === "mr" ? "USER_GUIDE.md फाईल डाऊनलोड करा" : "Download USER_GUIDE.md"}</span>
                </a>
              </div>
            </div>

            {/* Interactive EMI Calculator Tool Box */}
            <div className="bg-gradient-to-br from-slate-900 to-teal-950 text-white rounded-2xl p-6 shadow-md border border-teal-800/40">
              <div className="flex items-center space-x-2 text-teal-400 mb-4">
                <Calculator className="w-5 h-5" />
                <h3 className="font-bold text-sm">
                  {lang === "mr" ? "थेट ईएमआय कॅल्क्युलेटर" : "Live Loan & EMI Calculator"}
                </h3>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1">
                    {lang === "mr" ? "कर्ज रक्कम (₹):" : "Loan Amount (₹):"}
                  </label>
                  <input
                    type="number"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(Number(e.target.value))}
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">
                    {lang === "mr" ? "मासिक व्याज दर (%):" : "Monthly Interest Rate (%):"}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={calcInterestRate}
                    onChange={(e) => setCalcInterestRate(Number(e.target.value))}
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">
                    {lang === "mr" ? "कालावधी (महिने):" : "Tenure (Months):"}
                  </label>
                  <input
                    type="number"
                    value={calcTenureMonths}
                    onChange={(e) => setCalcTenureMonths(Number(e.target.value))}
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono outline-none focus:border-teal-400"
                  />
                </div>

                <div className="pt-3 border-t border-slate-800 space-y-1.5">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>{lang === "mr" ? "मासिक हप्ता (EMI):" : "Monthly Installment (EMI):"}</span>
                    <span className="font-bold text-teal-300 text-sm font-mono">₹{calculatedEmi.emi.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400 text-[11px]">
                    <span>{lang === "mr" ? "एकूण व्याज:" : "Total Interest:"}</span>
                    <span className="font-mono">₹{calculatedEmi.totalInterest.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400 text-[11px]">
                    <span>{lang === "mr" ? "एकूण परतफेड:" : "Total Payable:"}</span>
                    <span className="font-mono">₹{calculatedEmi.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

          </aside>

          {/* Main Module Detail Content View */}
          <section className="lg:col-span-8 space-y-8">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  {React.createElement(currentModule.icon, { className: "w-5 h-5" })}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {lang === "mr" ? currentModule.titleMr : currentModule.titleEn}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {lang === "mr" ? currentModule.summaryMr : currentModule.summaryEn}
                  </p>
                </div>
              </div>

              <div className="space-y-10 mt-8">
                {currentModule.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/60 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <span>{lang === "mr" ? step.titleMr : step.titleEn}</span>
                      </h3>
                      <span className="text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-full">
                        {lang === "mr" ? step.badgeMr : step.badgeEn}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {lang === "mr" ? step.descMr : step.descEn}
                    </p>

                    {/* Step Details Bullet points */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-2">
                      <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                        {lang === "mr" ? "महत्त्वाची वैशिष्ट्ये आणि कृती:" : "Key Actions & Details:"}
                      </h4>
                      <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                        {(lang === "mr" ? step.detailsMr : step.detailsEn).map((item, itemIdx) => (
                          <li key={itemIdx} className="flex items-start space-x-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Step Screenshot Illustration */}
                    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm bg-slate-950 relative group">
                      <img
                        src={step.screenshot}
                        alt={lang === "mr" ? step.titleMr : step.titleEn}
                        className="w-full h-auto object-cover max-h-96"
                        onError={(e) => {
                          // Fallback display if screenshot is loading
                          const target = e.target as HTMLImageElement
                          target.style.display = "none"
                        }}
                      />
                      <div className="p-3 bg-slate-900/90 text-slate-300 text-[11px] flex items-center justify-between">
                        <span>📸 {lang === "mr" ? "स्क्रीनशॉट स्नॅपशॉट — " + step.badgeMr : "UI Screenshot — " + step.badgeEn}</span>
                        <span className="font-mono text-emerald-400">BachatBook UI</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8 px-4 text-center text-xs text-slate-500">
        <p>© 2026 BachatBook (बचत बुक). {lang === "mr" ? "सर्व हक्क राखीव." : "All rights reserved."}</p>
      </footer>
    </div>
  )
}
