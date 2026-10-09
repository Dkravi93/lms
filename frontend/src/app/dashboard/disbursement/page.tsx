"use client";
import { useState } from "react";
import { Applicant, SlipButton } from "@/components/LoanCells";
import { Protected } from "@/components/Protected";
import { Alert, DataTable, PageHeader, Spinner, StatusBadge, Tabs } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { formatDate, formatINR } from "@/lib/format";
import type { Loan } from "@/lib/types";
import { useFetch } from "@/lib/useFetch";

const TABS = [
  { id: "SANCTIONED", label: "Ready to disburse" },
  { id: "DISBURSED", label: "Disbursed" },
  { id: "ALL", label: "All" },
] as const;
type Tab = (typeof TABS)[number]["id"];

export default function DisbursementPage() {
  return (
    <Protected roles={["DISBURSEMENT", "ADMIN"]}>
      <Disbursement />
    </Protected>
  );
}

function Disbursement() {
  const [tab, setTab] = useState<Tab>("SANCTIONED");
  const { data, error, loading, reload } = useFetch<{ loans: Loan[] }>(`/disbursement/loans?status=${tab}`);
  const [busyId, setBusyId] = useState("");
  const [actionError, setActionError] = useState("");

  async function disburse(l: Loan) {
    if (!confirm(`Release ${formatINR(l.principal)} to ${l.applicant.fullName}? This can’t be undone.`)) return;
    setBusyId(l._id);
    setActionError("");
    try {
      await api(`/disbursement/loans/${l._id}/disburse`, { method: "POST" });
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : "Action failed");
    } finally {
      setBusyId("");
      void reload();
    }
  }

  return (
    <>
      <PageHeader title="Disbursement" subtitle="Sanctioned loans waiting for funds. Disbursing makes the loan active and hands it to Collection." />
      <div className="mb-4"><Tabs tabs={[...TABS]} value={tab} onChange={setTab} /></div>
      {(error || actionError) && <div className="mb-4"><Alert>{actionError || error}</Alert></div>}
      {loading && !data ? <Spinner /> : (
        <DataTable<Loan> rows={data?.loans ?? []} empty="No loans in this list."
          columns={[
            { header: "Borrower", cell: (l) => <Applicant loan={l} /> },
            { header: "Amount to release", cell: (l) => <span className="font-medium">{formatINR(l.principal)}</span> },
            { header: "Tenure", cell: (l) => `${l.tenureDays} days` },
            { header: "Total repayment", cell: (l) => formatINR(l.totalRepayment) },
            { header: "Salary slip", cell: (l) => <SlipButton loanId={l._id} /> },
            { header: "Status", cell: (l) => <div><StatusBadge status={l.status} />{l.disbursedAt && <p className="mt-1 text-xs text-ink-soft">{formatDate(l.disbursedAt)}</p>}</div> },
            { header: "Action", cell: (l) => l.status === "SANCTIONED" ? <button className="btn-primary px-3 py-1.5" disabled={busyId === l._id} onClick={() => disburse(l)}>Mark disbursed</button> : "—" },
          ]} />
      )}
    </>
  );
}
