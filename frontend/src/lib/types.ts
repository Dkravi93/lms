export type Role = "ADMIN" | "SALES" | "SANCTION" | "DISBURSEMENT" | "COLLECTION" | "BORROWER";
export type LoanStatus = "APPLIED" | "SANCTIONED" | "REJECTED" | "DISBURSED" | "CLOSED";
export type EmploymentMode = "SALARIED" | "SELF_EMPLOYED" | "UNEMPLOYED";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Profile {
  fullName: string;
  pan: string;
  dateOfBirth: string;
  monthlySalary: number;
  employmentMode: EmploymentMode;
  bre: { passed: boolean; reasons: string[] };
}

export interface SalarySlip {
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt?: string;
}

export interface Loan {
  _id: string;
  borrower: string | { _id: string; name: string; email: string };
  applicant: { fullName: string; pan: string; dateOfBirth: string; monthlySalary: number; employmentMode: EmploymentMode };
  salarySlip: SalarySlip;
  principal: number;
  tenureDays: number;
  interestRate: number;
  interest: number;
  totalRepayment: number;
  amountPaid: number;
  outstanding: number;
  status: LoanStatus;
  sanction?: { rejectionReason?: string; at?: string };
  disbursedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  _id: string;
  utr: string;
  amount: number;
  paidOn: string;
}

export type LeadStage = "REGISTERED" | "BRE_REJECTED" | "DETAILS_SAVED" | "SLIP_UPLOADED";
export interface Lead {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  stage: LeadStage;
  profile?: { fullName: string; pan: string; monthlySalary: number; employmentMode: EmploymentMode; bre?: { passed: boolean; reasons: string[] } };
}
