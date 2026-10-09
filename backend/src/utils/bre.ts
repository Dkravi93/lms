import { BRE_RULES, EmploymentMode } from "../config/constants";

/** 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F). Input must be upper-cased first. */
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export interface BreInput {
  dateOfBirth: Date;
  monthlySalary: number;
  pan: string;
  employmentMode: EmploymentMode;
}

export interface BreResult {
  passed: boolean;
  reasons: string[];
}

/** Completed years between dob and today (UTC based, birthday-aware). */
export function calculateAge(dob: Date, today: Date = new Date()): number {
  let age = today.getUTCFullYear() - dob.getUTCFullYear();
  const beforeBirthday =
    today.getUTCMonth() < dob.getUTCMonth() ||
    (today.getUTCMonth() === dob.getUTCMonth() && today.getUTCDate() < dob.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

/** Business Rule Engine. Every rule is evaluated so the applicant sees all failures at once. */
export function runBre(input: BreInput, today: Date = new Date()): BreResult {
  const reasons: string[] = [];

  const age = calculateAge(input.dateOfBirth, today);
  if (age < BRE_RULES.MIN_AGE || age > BRE_RULES.MAX_AGE) {
    reasons.push(`Age must be between ${BRE_RULES.MIN_AGE} and ${BRE_RULES.MAX_AGE} years (you are ${age}).`);
  }
  if (input.monthlySalary < BRE_RULES.MIN_MONTHLY_SALARY) {
    reasons.push(`Monthly salary must be at least ₹${BRE_RULES.MIN_MONTHLY_SALARY.toLocaleString("en-IN")}.`);
  }
  if (!PAN_REGEX.test(input.pan)) {
    reasons.push("PAN is not in a valid format (expected 5 letters, 4 digits, 1 letter, e.g. ABCDE1234F).");
  }
  if (input.employmentMode === "UNEMPLOYED") {
    reasons.push("Unemployed applicants are not eligible for a loan.");
  }

  return { passed: reasons.length === 0, reasons };
}
