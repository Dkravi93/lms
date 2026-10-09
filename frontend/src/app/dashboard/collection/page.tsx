"use client";
import { useState, type FormEvent } from "react";
import { Applicant } from "@/components/LoanCells";
import { Protected } from "@/components/Protected";
import { Alert, DataTable, Field, Modal, PageHeader, Spinner, StatusBadge, Tabs } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { formatDate, formatINR, todayISO } from "@/lib/format";
import type { Loan, Payment } from "@/lib/types";
import { useFetch } from "@/lib/useFetch";

const TABS = [
  { id: "DISBURSED", label: "Active" },
  { id: "CLOSED", label: "Closed" },
  { id: "ALL", label: "All" },
] as const;
type Tab = (typeof TABS)[number]["id"];

export default function CollectionPage() {
  return (
    <Protected roles={["COLLECTION", "ADMIN"]}>
      <Collection />
    </Protected>
  );
}

function Collection() {
  const [tab, setTab] = useState<Tab>("DISBURSED");
  const { data, error, loading, reload } = useFetch<{ loans: Loan[] }>(`/collection/loans?status=${tab}`);
  const [paying, setPaying] = useState<Loan | null>(null);
  const [history, setHistory] = useState<Loan | null>(null);
  const [notice, setNotice] = useState("");

  return (
    <>
      <PageHeader title="Collection" subtitle="Record repayments against active loans. A loan closes automatically when fully repaid." />
      <div className="mb-4"><Tabs tabs={[...TABS]} value={tab} onChange={setTab} /></div>
      {notice && <div className="mb-4"><Alert tone="success">{notice}</Alert></div>}
      {error && <div className="mb-4"><Alert>{error}</Alert></div>}
      {loading && !data ? <Spinner /> : (
        <DataTable<Loan> rows={data?.loans ?? []} empty="No loans in this list."
          columns={[
            { header: "Borrower", cell: (l) => <Applicant loan={l} /> },
            { header: "Total repayment", cell: (l) => formatINR(l.totalRepayment) },
            { header: "Paid", cell: (l) => formatINR(l.amountPaid) },
            { header: "Outstanding", cell: (l) => (
              <div className="min-w-[110px]"><p className="font-medium">{formatINR(l.outstanding)}</p>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full bg-brand" style={{ width: `${Math.min(100, (l.amountPaid / l.totalRepayment) * 100)}%` }} /></div></div>) },
            { header: "Disbursed", cell: (l) => formatDate(l.disbursedAt) },
            { header: "Status", cell: (l) => <StatusBadge status={l.status} /> },
            { header: "Actions", cell: (l) => (
              <div className="flex gap-2">
                {l.status === "DISBURSED" && <button className="btn-primary px-3 py-1.5" onClick={() => { setPaying(l); setNotice(""); }}>Record payment</button>}
                <button className="btn-ghost px-3 py-1.5" onClick={() => setHistory(l)}>History</button>
              </div>) },
          ]} />
      )}
      {paying && <PaymentModal loan={paying} onClose={() => setPaying(null)} onSaved={(closed) => { setPaying(null); setNotice(closed ? "Payment recorded. The loan is fully repaid and has been closed." : "Payment recorded."); void reload(); }} />}
      {history && <HistoryModal loan={history} onClose={() => setHistory(null)} />}
    </>
  );
}

function PaymentModal({ loan, onClose, onSaved }: { loan: Loan; onClose: () => void; onSaved: (closed: boolean) => void }) {
  const [utr, setUtr] = useState("");
  const [amount, setAmount] = useState(String(loan.outstanding));
  const [paidOn, setPaidOn] = useState(todayISO());
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const amt = Number(amount);
  const tooHigh = amt > loan.outstanding;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors([]);
    try {
      const res = await api<{ loan: Loan }>(`/collection/loans/${loan._id}/payments`, { method: "POST", body: { utr, amount: amt, paidOn } });
      onSaved(res.loan.status === "CLOSED");
    } catch (err) {
      setErrors(err instanceof ApiError ? (err.reasons.length ? err.reasons : [err.message]) : ["Could not record payment"]);
      setBusy(false);
    }
  }

  return (
    <Modal title="Record payment" onClose={onClose}>
      <p className="mb-4 text-sm text-ink-soft">{loan.applicant.fullName} · outstanding <span className="font-medium text-ink">{formatINR(loan.outstanding)}</span></p>
      <form onSubmit={submit} className="space-y-4">
        {errors.length > 0 && <Alert><ul className="list-disc pl-4">{errors.map((m) => <li key={m}>{m}</li>)}</ul></Alert>}
        <Field label="UTR number" hint="Must be unique across all payments"><input className="field uppercase" required value={utr} onChange={(e) => setUtr(e.target.value.trim())} maxLength={35} /></Field>
        <Field label="Amount (₹)" error={tooHigh ? `Cannot exceed ${formatINR(loan.outstanding)}` : undefined}>
          <input className="field" type="number" required step="0.01" min="0.01" max={loan.outstanding} value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Payment date"><input className="field" type="date" required max={todayISO()} value={paidOn} onChange={(e) => setPaidOn(e.target.value)} /></Field>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy || tooHigh || !(amt > 0)}>{busy ? "Saving…" : "Save payment"}</button>
        </div>
      </form>
    </Modal>
  );
}

function HistoryModal({ loan, onClose }: { loan: Loan; onClose: () => void }) {
  const { data, error, loading } = useFetch<{ payments: Payment[] }>(`/collection/loans/${loan._id}/payments`);
  return (
    <Modal title={`Payments — ${loan.applicant.fullName}`} onClose={onClose}>
      {loading && <Spinner />}
      {error && <Alert>{error}</Alert>}
      {data && (data.payments.length === 0 ? <p className="text-sm text-ink-soft">No payments recorded yet.</p> : (
        <ul className="divide-y divide-line text-sm">
          {data.payments.map((p) => (
            <li key={p._id} className="flex justify-between py-2.5"><div><p className="font-medium">{p.utr}</p><p className="text-xs text-ink-soft">{formatDate(p.paidOn)}</p></div><p className="font-medium">{formatINR(p.amount)}</p></li>
          ))}
        </ul>
      ))}
    </Modal>
  );
}
