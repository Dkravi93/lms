"use client";
import { useState } from "react";
import { Applicant, SlipButton } from "@/components/LoanCells";
import { Protected } from "@/components/Protected";
import { Alert, DataTable, Modal, PageHeader, Spinner, StatusBadge, Tabs } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { formatDate, formatINR } from "@/lib/format";
import type { Loan } from "@/lib/types";
import { useFetch } from "@/lib/useFetch";

const TABS = [
  { id: "APPLIED", label: "Pending review" },
  { id: "SANCTIONED", label: "Sanctioned" },
  { id: "REJECTED", label: "Rejected" },
  { id: "ALL", label: "All" },
] as const;
type Tab = (typeof TABS)[number]["id"];

export default function SanctionPage() {
  return (
    <Protected roles={["SANCTION", "ADMIN"]}>
      <Sanction />
    </Protected>
  );
}

function Sanction() {
  const [tab, setTab] = useState<Tab>("APPLIED");
  const { data, error, loading, reload } = useFetch<{ loans: Loan[] }>(`/sanction/loans?status=${tab}`);
  const [rejecting, setRejecting] = useState<Loan | null>(null);
  const [reason, setReason] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState("");

  async function act(fn: () => Promise<unknown>, id: string) {
    setBusyId(id);
    setActionError("");
    try {
      await fn();
      setRejecting(null);
      setReason("");
    } catch (e) {
      setActionError(e instanceof ApiError ? (e.reasons[0] ?? e.message) : "Action failed");
    } finally {
      setBusyId("");
      void reload();
    }
  }

  return (
    <>
      <PageHeader title="Sanction" subtitle="Review applications. Approving moves a loan to Disbursement; rejecting needs a reason." />
      <div className="mb-4"><Tabs tabs={[...TABS]} value={tab} onChange={setTab} /></div>
      {(error || actionError) && <div className="mb-4"><Alert>{actionError || error}</Alert></div>}
      {loading && !data ? <Spinner /> : (
        <DataTable<Loan> rows={data?.loans ?? []} empty="Nothing here."
          columns={[
            { header: "Applicant", cell: (l) => <Applicant loan={l} /> },
            { header: "Salary", cell: (l) => formatINR(l.applicant.monthlySalary) },
            { header: "Loan", cell: (l) => <div><p className="font-medium">{formatINR(l.principal)}</p><p className="text-xs text-ink-soft">{l.tenureDays} days · repay {formatINR(l.totalRepayment)}</p></div> },
            { header: "Applied", cell: (l) => formatDate(l.createdAt) },
            { header: "Salary slip", cell: (l) => <SlipButton loanId={l._id} /> },
            { header: "Status", cell: (l) => <div><StatusBadge status={l.status} />{l.sanction?.rejectionReason && <p className="mt-1 max-w-[200px] text-xs text-ink-soft">{l.sanction.rejectionReason}</p>}</div> },
            { header: "Actions", cell: (l) => l.status === "APPLIED" ? (
              <div className="flex gap-2">
                <button className="btn-primary px-3 py-1.5" disabled={busyId === l._id} onClick={() => act(() => api(`/sanction/loans/${l._id}/approve`, { method: "POST" }), l._id)}>Approve</button>
                <button className="btn-ghost px-3 py-1.5" disabled={busyId === l._id} onClick={() => { setRejecting(l); setActionError(""); }}>Reject</button>
              </div>) : "—" },
          ]} />
      )}

      {rejecting && (
        <Modal title="Reject application" onClose={() => setRejecting(null)}>
          <p className="mb-3 text-sm text-ink-soft">{rejecting.applicant.fullName} · {formatINR(rejecting.principal)}. The borrower will see this reason.</p>
          {actionError && <div className="mb-3"><Alert>{actionError}</Alert></div>}
          <label className="block space-y-1.5"><span className="text-sm font-medium">Reason</span>
            <textarea className="field min-h-24" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} /></label>
          <div className="mt-4 flex justify-end gap-3">
            <button className="btn-ghost" onClick={() => setRejecting(null)}>Cancel</button>
            <button className="btn-danger" disabled={reason.trim().length < 5 || busyId === rejecting._id}
              onClick={() => act(() => api(`/sanction/loans/${rejecting._id}/reject`, { method: "POST", body: { reason } }), rejecting._id)}>Reject loan</button>
          </div>
        </Modal>
      )}
    </>
  );
}
