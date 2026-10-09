"use client";
import { useMemo, useState, type FormEvent } from "react";
import { Alert, Field } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { previewBre } from "@/lib/bre";
import { todayISO } from "@/lib/format";
import type { EmploymentMode, Profile } from "@/lib/types";

export function PersonalStep({ initial, defaultName, onDone }: { initial: Profile | null; defaultName: string; onDone: (p: Profile) => void }) {
  const [fullName, setFullName] = useState(initial?.fullName ?? defaultName);
  const [pan, setPan] = useState(initial?.pan ?? "");
  const [dob, setDob] = useState(initial?.dateOfBirth?.slice(0, 10) ?? "");
  const [salary, setSalary] = useState(initial ? String(initial.monthlySalary) : "");
  const [mode, setMode] = useState<EmploymentMode | "">(initial?.employmentMode ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ title: string; reasons: string[] } | null>(null);

  const hints = useMemo(() => previewBre({ dob, salary, pan, mode }), [dob, salary, pan, mode]);
  const today = todayISO();

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ profile: Profile }>("/borrower/profile", {
        method: "PUT",
        body: { fullName, pan, dateOfBirth: dob, monthlySalary: Number(salary), employmentMode: mode },
      });
      onDone(res.profile);
    } catch (err) {
      if (err instanceof ApiError) setError({ title: err.status === 422 ? "We can’t offer you a loan right now" : err.message, reasons: err.reasons });
      else setError({ title: "Something went wrong", reasons: [] });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && (
        <Alert title={error.title}>
          {error.reasons.length > 0 && <ul className="mt-1 list-disc pl-5">{error.reasons.map((r) => <li key={r}>{r}</li>)}</ul>}
        </Alert>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name"><input className="field" required value={fullName} onChange={(e) => setFullName(e.target.value)} /></Field>
        <Field label="PAN" hint="Format: ABCDE1234F"><input className="field uppercase" required maxLength={10} value={pan} onChange={(e) => setPan(e.target.value.toUpperCase())} /></Field>
        <Field label="Date of birth" hint="You must be 23 to 50 years old"><input className="field" type="date" required max={today} value={dob} onChange={(e) => setDob(e.target.value)} /></Field>
        <Field label="Monthly salary (₹)" hint="Minimum ₹25,000"><input className="field" type="number" required min={1} inputMode="numeric" value={salary} onChange={(e) => setSalary(e.target.value)} /></Field>
        <Field label="Employment mode">
          <select className="field" required value={mode} onChange={(e) => setMode(e.target.value as EmploymentMode)}>
            <option value="" disabled>Select…</option>
            <option value="SALARIED">Salaried</option>
            <option value="SELF_EMPLOYED">Self-employed</option>
            <option value="UNEMPLOYED">Unemployed</option>
          </select>
        </Field>
      </div>
      {hints.length > 0 && (
        <Alert tone="warn" title="Heads up — you may not pass the eligibility check">
          <ul className="mt-1 list-disc pl-5">{hints.map((h) => <li key={h}>{h}</li>)}</ul>
        </Alert>
      )}
      <button className="btn-primary" disabled={busy}>{busy ? "Checking eligibility…" : "Check eligibility and continue"}</button>
    </form>
  );
}
