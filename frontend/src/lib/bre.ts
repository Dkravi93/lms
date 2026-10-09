import type { EmploymentMode } from "./types";

export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

/**
 * Instant hints while typing. The SERVER is the source of truth (the client can be bypassed),
 * so this never blocks submission on its own.
 */
export function previewBre(v: { dob: string; salary: string; pan: string; mode: EmploymentMode | "" }): string[] {
  const out: string[] = [];
  if (v.dob) {
    const d = new Date(`${v.dob}T00:00:00Z`);
    const t = new Date();
    let age = t.getUTCFullYear() - d.getUTCFullYear();
    if (t.getUTCMonth() < d.getUTCMonth() || (t.getUTCMonth() === d.getUTCMonth() && t.getUTCDate() < d.getUTCDate())) age -= 1;
    if (age < 23 || age > 50) out.push(`Age must be 23–50 (you are ${age}).`);
  }
  if (v.salary && Number(v.salary) < 25_000) out.push("Monthly salary must be at least ₹25,000.");
  if (v.pan && !PAN_REGEX.test(v.pan.toUpperCase())) out.push("PAN format looks wrong (e.g. ABCDE1234F).");
  if (v.mode === "UNEMPLOYED") out.push("Unemployed applicants are not eligible.");
  return out;
}
