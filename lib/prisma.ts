import { PrismaClient } from '@prisma/client'

// Global BigInt JSON serialization fix
if (typeof (BigInt.prototype as any).toJSON !== 'function') {
  (BigInt.prototype as any).toJSON = function () {
    const num = Number(this)
    return Number.isSafeInteger(num) ? num : this.toString()
  }
}

/**
 * Recursively converts Prisma objects (BigInt, Decimal, Date) to plain JSON-serializable primitives.
 */
export function toPlainObject<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (typeof obj === 'bigint') {
    const num = Number(obj)
    return (Number.isSafeInteger(num) ? num : obj.toString()) as any
  }

  if (typeof obj === 'object') {
    // Decimal instance check (Prisma Decimal has toNumber function or d, e, s properties)
    if ('toNumber' in obj && typeof (obj as any).toNumber === 'function') {
      return (obj as any).toNumber()
    }

    if (obj instanceof Date) {
      return obj.toISOString() as any
    }

    if (Array.isArray(obj)) {
      return obj.map(toPlainObject) as any
    }

    const plainObj: Record<string, any> = {}
    for (const [key, value] of Object.entries(obj)) {
      plainObj[key] = toPlainObject(value)
    }
    return plainObj as T
  }

  return obj
}

const FIELD_MAP: Record<string, string> = {
  meetingDate: 'meeting_date',
  monthYear: 'month_year',
  openingBalance: 'opening_balance',
  closingDate: 'closing_date',
  createdBy: 'created_by',
  organizationId: 'organization_id',
  memberId: 'member_id',
  meetingId: 'meeting_id',
  guarantorId: 'guarantor_id',
  savingsAmount: 'savings_amount',
  loanRepayment: 'loan_repayment',
  interestPaid: 'interest_paid',
  penaltyPaid: 'penalty_paid',
  otherAmount: 'other_amount',
  isPresent: 'is_present',
  loanAmount: 'loan_amount',
  outstandingAmount: 'outstanding_amount',
  interestRate: 'interest_rate',
  disbursedDate: 'disbursed_date',
  termMonths: 'term_months',
  requestedBy: 'requested_by',
  approvedBy: 'approved_by',
  approvedAt: 'approved_at',
  rejectionReason: 'rejection_reason',
  monthlySavingAmount: 'monthly_saving_amount',
  defaultInterestRate: 'default_interest_rate',
  defaultPenaltyAmount: 'default_penalty_amount',
  maxLoanLimit: 'max_loan_limit',
  maxGuarantorLoans: 'max_guarantor_loans',
  nameMarathi: 'name_marathi',
  groupCode: 'group_code',
  meetingFrequency: 'meeting_frequency',
  memberNumber: 'member_number',
  joiningDate: 'joining_date',
  passwordHash: 'password_hash',
  kycStatus: 'kyc_status',
  kycNotes: 'kyc_notes',
  kycVerifiedBy: 'kyc_verified_by',
  kycVerifiedAt: 'kyc_verified_at',
  isActive: 'is_active',
}

/**
 * Recursively converts Prisma objects to plain JSON objects and attaches snake_case aliases for camelCase fields.
 */
export function normalizePrismaObject<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj
  }

  const plain = toPlainObject(obj)
  if (typeof plain !== 'object') {
    return plain
  }

  if (Array.isArray(plain)) {
    return plain.map(normalizePrismaObject) as any
  }

  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(plain)) {
    const normValue = typeof value === 'object' && value !== null ? normalizePrismaObject(value) : value
    result[key] = normValue
    if (FIELD_MAP[key]) {
      result[FIELD_MAP[key]] = normValue
    }
  }

  return result as T
}


const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
