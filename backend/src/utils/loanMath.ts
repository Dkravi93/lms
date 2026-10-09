import { LOAN_LIMITS } from "../config/constants";

export const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

export interface LoanQuote {
  principal: number;
  tenureDays: number;
  interestRate: number;
  interest: number;
  totalRepayment: number;
}

/** Simple interest: SI = (P × R × T) / (365 × 100), T in days. */
export function calculateLoan(principal: number, tenureDays: number): LoanQuote {
  const rate = LOAN_LIMITS.ANNUAL_RATE_PERCENT;
  const interest = round2((principal * rate * tenureDays) / (365 * 100));
  return { principal, tenureDays, interestRate: rate, interest, totalRepayment: round2(principal + interest) };
}
