"use client";
import { Alert, StatusBadge } from "@/components/ui";
import { formatDate, formatINR } from "@/lib/format";
import type { Loan } from "@/lib/types";

const STEPS = [
  { key: "APPLIED", label: "Applied" },
  { key: "SANCTIONED", label: "Sanctioned" },
  { key: "DISBURSED", label: "Disbursed" },
  { key: "CLOSED", label: "Closed" },
] as const;

export function LoanTracker({ loan, onNew }: { loan: Loan; onNew: () => void }) {
  const rejected = loan.status === "REJECTED";
  const reached = STEPS.findIndex((s) => s.key === loan.status);
  const pct = loan.totalRepayment ? Math.min(100, (loan.amountPaid / loan.totalRepayment) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-sm text-ink-soft">Application submitted {formatDate(loan.createdAt)}</p><p className="text-2xl font-semibold">{formatINR(loan.principal)}</p></div>
        <StatusBadge status={loan.status} />
      </div>

      {rejected ? (
        <Alert title="Your application was not approved">{loan.sanction?.rejectionReason && <p className="mt-1">Reason: {loan.sanction.rejectionReason}</p>}</Alert>
      ) : (
        <ol className="grid grid-cols-4 gap-2" aria-label="Loan progress">
          {STEPS.map((s, i) => (
            <li key={s.key} className="text-center">
              <div className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${i <= reached ? "bg-brand text-white" : "bg-line text-ink-faint"}`}>{i <= reached ? "✓" : i + 1}</div>
              <p className={`mt-1.5 text-xs ${i <= reached ? "font-medium" : "text-ink-faint"}`}>{s.label}</p>
            </li>
          ))}
        </ol>
      )}

      <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <Item k="Tenure" v={`${loan.tenureDays} days`} />
        <Item k="Interest" v={formatINR(loan.interest)} />
        <Item k="Total repayment" v={formatINR(loan.totalRepayment)} />
        <Item k="Outstanding" v={formatINR(loan.outstanding)} />
      </dl>

      {(loan.status === "DISBURSED" || loan.status === "CLOSED") && (
        <div>
          <div className="mb-1 flex justify-between text-xs text-ink-soft"><span>Repaid {formatINR(loan.amountPaid)}</span><span>{pct.toFixed(0)}%</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-line"><div className="h-full bg-brand" style={{ width: `${pct}%` }} /></div>
        </div>
      )}
      {(rejected || loan.status === "CLOSED") && <button className="btn-primary" onClick={onNew}>Apply for a new loan</button>}
    </div>
  );
}

const Item = ({ k, v }: { k: string; v: string }) => (<div><dt className="text-ink-soft">{k}</dt><dd className="font-medium">{v}</dd></div>);
