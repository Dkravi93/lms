export const ROLES = ["ADMIN", "SALES", "SANCTION", "DISBURSEMENT", "COLLECTION", "BORROWER"] as const;
export type Role = (typeof ROLES)[number];

export const LOAN_STATUSES = ["APPLIED", "SANCTIONED", "REJECTED", "DISBURSED", "CLOSED"] as const;
export type LoanStatus = (typeof LOAN_STATUSES)[number];

/** A borrower can hold at most one loan in these states at a time. */
export const ACTIVE_LOAN_STATUSES: LoanStatus[] = ["APPLIED", "SANCTIONED", "DISBURSED"];

export const EMPLOYMENT_MODES = ["SALARIED", "SELF_EMPLOYED", "UNEMPLOYED"] as const;
export type EmploymentMode = (typeof EMPLOYMENT_MODES)[number];

/**
 * Loan lifecycle state machine.
 *   APPLIED    -> SANCTIONED | REJECTED   (Sanction executive)
 *   SANCTIONED -> DISBURSED               (Disbursement executive)
 *   DISBURSED  -> CLOSED                  (automatic, when fully repaid)
 */
export const ALLOWED_TRANSITIONS: Record<LoanStatus, LoanStatus[]> = {
  APPLIED: ["SANCTIONED", "REJECTED"],
  SANCTIONED: ["DISBURSED"],
  DISBURSED: ["CLOSED"],
  REJECTED: [],
  CLOSED: [],
};

export const LOAN_LIMITS = {
  MIN_AMOUNT: 50_000,
  MAX_AMOUNT: 500_000,
  MIN_TENURE_DAYS: 30,
  MAX_TENURE_DAYS: 365,
  ANNUAL_RATE_PERCENT: 12,
} as const;

export const BRE_RULES = {
  MIN_AGE: 23,
  MAX_AGE: 50,
  MIN_MONTHLY_SALARY: 25_000,
} as const;

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
