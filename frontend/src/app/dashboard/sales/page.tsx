"use client";
import { Protected } from "@/components/Protected";
import { Alert, DataTable, PageHeader, Spinner, StageBadge, stageLabel } from "@/components/ui";
import { formatDate, formatINR } from "@/lib/format";
import type { Lead, LeadStage } from "@/lib/types";
import { useFetch } from "@/lib/useFetch";

const ORDER: LeadStage[] = ["REGISTERED", "DETAILS_SAVED", "SLIP_UPLOADED", "BRE_REJECTED"];

export default function SalesPage() {
  return (
    <Protected roles={["SALES", "ADMIN"]}>
      <Leads />
    </Protected>
  );
}

function Leads() {
  const { data, error, loading, reload } = useFetch<{ leads: Lead[]; summary: Record<string, number>; total: number }>("/sales/leads");
  return (
    <>
      <PageHeader title="Sales leads" subtitle="Borrowers who have registered but not yet applied for a loan." />
      {error && <Alert>{error}</Alert>}
      {loading && !data && <Spinner />}
      {data && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {ORDER.map((s) => (
              <div key={s} className="card p-4"><p className="text-2xl font-semibold">{data.summary[s] ?? 0}</p><p className="text-sm text-ink-soft">{stageLabel(s)}</p></div>
            ))}
          </div>
          <div className="flex justify-end"><button className="btn-ghost" onClick={reload}>Refresh</button></div>
          <DataTable<Lead> rows={data.leads} empty="No open leads. Every registered borrower has applied."
            columns={[
              { header: "Lead", cell: (l) => <div><p className="font-medium">{l.profile?.fullName ?? l.name}</p><p className="text-xs text-ink-soft">{l.email}</p></div> },
              { header: "Stage", cell: (l) => <StageBadge stage={l.stage} /> },
              { header: "Salary", cell: (l) => (l.profile ? formatINR(l.profile.monthlySalary) : "—") },
              { header: "Employment", cell: (l) => l.profile?.employmentMode.replace("_", " ").toLowerCase() ?? "—", className: "capitalize" },
              { header: "Why rejected", cell: (l) => (l.stage === "BRE_REJECTED" ? <ul className="list-disc pl-4 text-xs text-red-800">{l.profile?.bre?.reasons.map((r) => <li key={r}>{r}</li>)}</ul> : "—") },
              { header: "Registered", cell: (l) => formatDate(l.createdAt) },
            ]} />
        </div>
      )}
    </>
  );
}
