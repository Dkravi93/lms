"use client";
import { useState } from "react";
import { Alert } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { LIMITS, quote } from "@/lib/loan";
import type { Loan } from "@/lib/types";

export function LoanStep({ onBack, onApplied }: { onBack: () => void; onApplied: (l: Loan) => void }) {
  const [amount, setAmount] = useState(100_000);
  const [tenure, setTenure] = useState(90);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string[]>([]);
  const q = quote(amount, tenure);

  async function apply() {
    setBusy(true);
    setError([]);
    try {
      const res = await api<{ loan: Loan }>("/borrower/loans", { method: "POST", body: { principal: amount, tenureDays: tenure } });
      onApplied(res.loan);
    } catch (err) {
      setError(err instanceof ApiError ? (err.reasons.length ? err.reasons : [err.message]) : ["Could not submit application"]);
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="space-y-8">
        {error.length > 0 && <Alert><ul className="list-disc pl-4">{error.map((m) => <li key={m}>{m}</li>)}</ul></Alert>}
        <div>
          <div className="mb-2 flex items-baseline justify-between"><label htmlFor="amt" className="text-sm font-medium">Loan amount</label><output className="text-xl font-semibold">{formatINR(amount)}</output></div>
          <input id="amt" type="range" className="w-full" min={LIMITS.minAmount} max={LIMITS.maxAmount} step={1000} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          <div className="flex justify-between text-xs text-ink-faint"><span>{formatINR(LIMITS.minAmount)}</span><span>{formatINR(LIMITS.maxAmount)}</span></div>
        </div>
        <div>
          <div className="mb-2 flex items-baseline justify-between"><label htmlFor="ten" className="text-sm font-medium">Tenure</label><output className="text-xl font-semibold">{tenure} days</output></div>
          <input id="ten" type="range" className="w-full" min={LIMITS.minTenure} max={LIMITS.maxTenure} step={1} value={tenure} onChange={(e) => setTenure(Number(e.target.value))} />
          <div className="flex justify-between text-xs text-ink-faint"><span>{LIMITS.minTenure} days</span><span>{LIMITS.maxTenure} days</span></div>
        </div>
        <div className="flex gap-3">
          <button className="btn-ghost" onClick={onBack} disabled={busy}>Back</button>
          <button className="btn-primary" onClick={apply} disabled={busy}>{busy ? "Submitting…" : "Apply for this loan"}</button>
        </div>
      </div>

      <aside aria-live="polite" className="card self-start bg-brand-light/60 p-5">
        <h3 className="font-semibold">Your repayment</h3>
        <dl className="mt-4 space-y-3 text-sm">
          <Row k="Principal" v={formatINR(amount)} />
          <Row k={`Interest at ${LIMITS.rate}% a year for ${tenure} days`} v={formatINR(q.interest)} />
          <div className="border-t border-brand/20 pt-3"><Row k="Total repayment" v={formatINR(q.total)} strong /></div>
        </dl>
        <p className="mt-4 text-xs text-ink-soft">Simple interest: principal × 12 × days ÷ (365 × 100). The lender confirms the final figures when you apply.</p>
      </aside>
    </div>
  );
}

const Row = ({ k, v, strong }: { k: string; v: string; strong?: boolean }) => (
  <div className="flex justify-between gap-4"><dt className="text-ink-soft">{k}</dt><dd className={strong ? "text-lg font-semibold" : "font-medium"}>{v}</dd></div>
);
