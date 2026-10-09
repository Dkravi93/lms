"use client";
import { useRef, useState } from "react";
import { Alert } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { formatBytes } from "@/lib/format";
import type { SalarySlip } from "@/lib/types";

const TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX = 5 * 1024 * 1024;

export function SlipStep({ current, onUploaded, onBack, onNext }: { current: SalarySlip | null; onUploaded: (s: SalarySlip) => void; onBack: () => void; onNext: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function pick(file?: File) {
    if (!file) return;
    setError("");
    if (!TYPES.includes(file.type)) return setError("Only PDF, JPG or PNG files are allowed.");
    if (file.size > MAX) return setError(`File is ${formatBytes(file.size)}. The limit is 5 MB.`);

    setBusy(true);
    try {
      const form = new FormData();
      form.append("salarySlip", file);
      const res = await api<{ salarySlip: SalarySlip }>("/borrower/salary-slip", { method: "POST", form });
      onUploaded(res.salarySlip);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="space-y-5">
      {error && <Alert>{error}</Alert>}
      <div className="rounded-lg border-2 border-dashed border-line p-8 text-center">
        <p className="font-medium">Upload your latest salary slip</p>
        <p className="mt-1 text-sm text-ink-soft">PDF, JPG or PNG, up to 5 MB</p>
        <input ref={input} id="slip" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
        <label htmlFor="slip" className={`btn-ghost mt-4 cursor-pointer ${busy ? "pointer-events-none opacity-50" : ""}`}>
          {busy ? "Uploading…" : current ? "Replace file" : "Choose file"}
        </label>
      </div>
      {current && (
        <Alert tone="success" title="Salary slip uploaded">
          {current.originalName} · {formatBytes(current.size)}
        </Alert>
      )}
      <div className="flex gap-3">
        <button className="btn-ghost" onClick={onBack}>Back</button>
        <button className="btn-primary" disabled={!current || busy} onClick={onNext}>Continue</button>
      </div>
    </div>
  );
}
