"use client";
import { useState } from "react";
import { openSalarySlip } from "@/lib/api";
import type { Loan } from "@/lib/types";

export const borrowerOf = (l: Loan) => (typeof l.borrower === "string" ? { name: l.applicant.fullName, email: "" } : l.borrower);

export function Applicant({ loan }: { loan: Loan }) {
  const b = borrowerOf(loan);
  return (
    <div>
      <p className="font-medium">{loan.applicant.fullName}</p>
      <p className="text-xs text-ink-soft">{b.email}</p>
      <p className="text-xs text-ink-faint">PAN {loan.applicant.pan}</p>
    </div>
  );
}

export function SlipButton({ loanId }: { loanId: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button className="text-sm font-medium text-brand underline disabled:opacity-50" disabled={busy}
      onClick={async () => { setBusy(true); try { await openSalarySlip(loanId); } catch { alert("Could not open the salary slip"); } finally { setBusy(false); } }}>
      {busy ? "Opening…" : "View"}
    </button>
  );
}
