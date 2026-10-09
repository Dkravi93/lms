"use client";
import { useEffect, type ReactNode } from "react";
import type { LeadStage, LoanStatus } from "@/lib/types";

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-2 p-6 text-sm text-ink-soft">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-brand" />
      {label}
    </div>
  );
}

export function Alert({ tone = "error", title, children }: { tone?: "error" | "success" | "warn"; title?: string; children?: ReactNode }) {
  const styles = {
    error: "border-red-200 bg-red-50 text-red-900",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    warn: "border-amber-200 bg-amber-50 text-amber-900",
  }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-md border px-4 py-3 text-sm ${styles}`}>
      {title && <p className="font-medium">{title}</p>}
      {children}
    </div>
  );
}

export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-ink">{label}</span>
      {children}
      {hint && !error && <span className="block text-xs text-ink-faint">{hint}</span>}
      {error && <span className="block text-xs text-red-700">{error}</span>}
    </label>
  );
}

const STATUS_STYLE: Record<LoanStatus, string> = {
  APPLIED: "bg-amber-100 text-amber-900",
  SANCTIONED: "bg-sky-100 text-sky-900",
  REJECTED: "bg-red-100 text-red-900",
  DISBURSED: "bg-brand-light text-brand-dark",
  CLOSED: "bg-slate-200 text-slate-800",
};
const STATUS_LABEL: Record<LoanStatus, string> = {
  APPLIED: "Applied",
  SANCTIONED: "Sanctioned",
  REJECTED: "Rejected",
  DISBURSED: "Disbursed",
  CLOSED: "Closed",
};
export const StatusBadge = ({ status }: { status: LoanStatus }) => (
  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}>{STATUS_LABEL[status]}</span>
);

const STAGE: Record<LeadStage, { label: string; cls: string }> = {
  REGISTERED: { label: "Registered only", cls: "bg-slate-200 text-slate-800" },
  BRE_REJECTED: { label: "Failed eligibility", cls: "bg-red-100 text-red-900" },
  DETAILS_SAVED: { label: "Details saved", cls: "bg-amber-100 text-amber-900" },
  SLIP_UPLOADED: { label: "Ready to apply", cls: "bg-brand-light text-brand-dark" },
};
export const StageBadge = ({ stage }: { stage: LeadStage }) => (
  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGE[stage].cls}`}>{STAGE[stage].label}</span>
);
export const stageLabel = (s: LeadStage) => STAGE[s].label;

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded p-1 text-ink-soft hover:bg-paper">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

export function DataTable<T extends { _id: string }>({ columns, rows, empty }: { columns: Column<T>[]; rows: T[]; empty: string }) {
  if (rows.length === 0) return <div className="card p-10 text-center text-sm text-ink-soft">{empty}</div>;
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-line bg-paper text-xs text-ink-soft">
          <tr>
            {columns.map((c) => (
              <th key={c.header} className={`px-4 py-3 font-medium ${c.className ?? ""}`}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r) => (
            <tr key={r._id} className="align-top">
              {columns.map((c) => (
                <td key={c.header} className={`px-4 py-3 ${c.className ?? ""}`}>{c.cell(r)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div role="tablist" className="flex flex-wrap gap-1 rounded-lg border border-line bg-white p-1">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${value === t.id ? "bg-brand text-white" : "text-ink-soft hover:bg-paper"}`}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export const PageHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <header className="mb-5">
    <h1 className="text-2xl font-semibold">{title}</h1>
    <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>
  </header>
);
