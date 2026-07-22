export type Role = 'SUPERADMIN' | 'ADMIN' | 'MEMBER';
export type MemberStatus = 'ACTIVE' | 'PENDING' | 'REJECTED';
export type KycStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type MeetingStatus = 'DRAFT' | 'FINALIZED';
export type LoanStatus = 'PENDING' | 'ACTIVE' | 'CLOSED' | 'REJECTED';
export type EmiStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL';

export interface Organization {
  id: string;
  name: string;
  name_marathi?: string;
  nameMarathi?: string;
  village: string;
  taluka?: string;
  district: string;
  group_code: string;
  groupCode?: string;
  meeting_frequency: string;
  meetingFrequency?: string;
  monthly_saving_amount: number; // paise
  monthlySavingAmount?: number | bigint;
  default_interest_rate: number; // annual %
  defaultInterestRate?: number | string;
  default_penalty_amount: number; // paise
  defaultPenaltyAmount?: number | bigint;
  max_loan_limit: number; // paise, 0=unlimited
  maxLoanLimit?: number | bigint;
  subscription_plan: string;
  subscriptionPlan?: string;
  subscription_status: string;
  subscriptionStatus?: string;
  subscription_expires_at?: string;
  subscriptionExpiresAt?: string | null;
  trial_ends_at?: string;
  trialEndsAt?: string | null;
  max_members?: number;
  maxMembers?: number;
  max_guarantor_loans?: number;
  maxGuarantorLoans?: number;
  is_approved: boolean;
  isApproved?: boolean;
  is_email_verified?: boolean;
  isEmailVerified?: boolean;
  logo_url?: string;
  logoUrl?: string;
  created_at: string;
  createdAt?: string | Date;
}

export interface Member {
  id: string;
  organization_id: string;
  organizationId: string;
  user_id?: string;
  userId?: string;
  name: string;
  name_marathi?: string;
  nameMarathi?: string;
  phone: string;
  email?: string;
  address?: string;
  role: Role;
  status: MemberStatus;
  is_active: boolean;
  isActive?: boolean;
  kyc_status: KycStatus;
  kycStatus?: KycStatus;
  kyc_notes?: string;
  kycNotes?: string;
  kyc_verified_by?: string;
  kycVerifiedBy?: string;
  kyc_verified_at?: string;
  kycVerifiedAt?: string;
  member_number: number;
  memberNumber?: number;
  joining_date: string;
  joiningDate?: string | Date;
  created_at: string;
  createdAt?: string | Date;
  organization?: Organization;
}

export interface Meeting {
  id: string;
  organization_id: string;
  organizationId: string;
  meeting_date: string;
  meetingDate?: string | Date;
  month_year: string; // 'YYYY-MM'
  monthYear?: string;
  status: MeetingStatus;
  opening_balance: number; // paise — auto-carried from prev meeting
  openingBalance?: number | bigint;
  notes?: string;
  closing_date?: string;
  closingDate?: string | Date;
  created_by?: string;
  createdBy?: string;
  created_at: string;
  createdAt?: string | Date;
}

export interface MeetingContribution {
  id: string;
  meeting_id: string;
  meetingId?: string;
  member_id: string;
  memberId?: string;
  savings_amount: number; // paise
  savingsAmount?: number | bigint;
  loan_repayment: number; // paise
  loanRepayment?: number | bigint;
  interest_paid: number; // paise
  interestPaid?: number | bigint;
  penalty_paid: number; // paise
  penaltyPaid?: number | bigint;
  other_amount: number; // paise
  otherAmount?: number | bigint;
  is_present: boolean;
  isPresent?: boolean;
  member?: Member;
}

export interface MeetingExpense {
  id: string;
  meeting_id: string;
  meetingId?: string;
  category: string;
  amount: number; // paise
  description?: string;
}

export interface MeetingIncome {
  id: string;
  meeting_id: string;
  meetingId?: string;
  category: string;
  amount: number; // paise
  description?: string;
}

export interface Loan {
  id: string;
  organization_id: string;
  organizationId: string;
  member_id: string;
  memberId?: string;
  guarantor_id?: string | null;
  guarantorId?: string | null;
  loan_amount: number; // paise
  loanAmount?: number | bigint;
  outstanding_amount: number; // paise
  outstandingAmount?: number | bigint;
  interest_rate: number; // annual %
  interestRate?: number | string;
  disbursed_date: string;
  disbursedDate?: string | Date;
  purpose?: string;
  term_months: number;
  termMonths?: number;
  status: LoanStatus;
  approved_by?: string;
  approvedBy?: string;
  approved_at?: string;
  approvedAt?: string | Date;
  rejection_reason?: string;
  rejectionReason?: string;
  created_at: string;
  createdAt?: string | Date;
  member?: Member;
  guarantor?: { id: string; name: string; name_marathi?: string } | null;
}

export interface LoanEmi {
  id: string;
  loan_id: string;
  loanId?: string;
  month_year: string;
  monthYear?: string;
  due_date: string;
  dueDate?: string | Date;
  principal_due: number; // paise
  principalDue?: number | bigint;
  interest_due: number; // paise
  interestDue?: number | bigint;
  principal_paid: number; // paise
  principalPaid?: number | bigint;
  interest_paid: number; // paise
  interestPaid?: number | bigint;
  fine_amount: number; // paise
  fineAmount?: number | bigint;
  status: EmiStatus;
  paid_at?: string;
  paidAt?: string | Date;
}

export interface MeetingTotals {
  total_savings: number;
  total_penalty: number;
  total_loan_repayment: number;
  total_interest: number;
  total_other_income: number;
  total_receipts: number;
  total_loans_issued: number;
  total_other_expenses: number;
  total_expenses: number;
  closing_balance: number;
}

export interface ActivityLog {
  id: string;
  organization_id: string;
  organizationId: string;
  performed_by: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: Record<string, unknown>;
  created_at: string;
  member?: Pick<Member, 'id' | 'name'>;
}

export interface PaymentProof {
  id: string;
  organization_id: string;
  organizationId: string;
  member_id: string;
  meeting_id?: string;
  amount: number;
  upi_reference?: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verified_by?: string;
  verified_at?: string;
  rejection_reason?: string;
  created_at: string;
  member?: Member;
}

export interface LoanWithMember extends Loan {
  member: Member;
}

export interface LoanWithEmis extends Loan {
  member: Member;
  loan_emis: LoanEmi[];
}

export interface MeetingContributionWithMember extends MeetingContribution {
  member: Member;
}

export interface MeetingWithDetails extends Meeting {
  meeting_contributions: MeetingContributionWithMember[];
  meeting_expenses: MeetingExpense[];
  meeting_income: MeetingIncome[];
}

export type MemberWithOrg = Member & { organization: Organization };
