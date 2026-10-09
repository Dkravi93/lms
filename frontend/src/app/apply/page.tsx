"use client";
import { useCallback, useEffect, useState } from "react";
import { LoanStep } from "@/components/apply/LoanStep";
import { LoanTracker } from "@/components/apply/LoanTracker";
import { PersonalStep } from "@/components/apply/PersonalStep";
import { SlipStep } from "@/components/apply/SlipStep";
import { Protected } from "@/components/Protected";
import { Alert, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Loan, Profile, SalarySlip } from "@/lib/types";

interface Overview { profile: Profile | null; salarySlip: SalarySlip | null; loans: Loan[] }

const STEP_LABELS = ["Personal details", "Salary slip", "Loan details"];

export default function ApplyPage() {
  return (
    <Protected roles={["BORROWER"]}>
      <Portal />
    </Protected>
  );
}

function Portal() {
  const { user, logout } = useAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);
  const [newApplication, setNewApplication] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await api<Overview>("/borrower/application");
      setData(d);
      setStep(!d.profile?.bre.passed ? 0 : !d.salarySlip ? 1 : 2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your application");
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const latest = data?.loans[0];
  const showTracker = !!latest && !newApplication;

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <p className="font-semibold text-brand">LMS</p>
          <div className="flex items-center gap-3 text-sm"><span className="hidden text-ink-soft sm:inline">{user?.name}</span><button className="btn-ghost" onClick={logout}>Sign out</button></div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {error && <Alert>{error}</Alert>}
        {!data && !error && <Spinner />}
        {data && (
          <div className="card p-5 sm:p-7">
            {showTracker ? (
              <>
                <h1 className="mb-5 text-xl font-semibold">Your loan</h1>
                <LoanTracker loan={latest} onNew={() => { setNewApplication(true); setStep(2); }} />
              </>
            ) : (
              <>
                <h1 className="text-xl font-semibold">Apply for a loan</h1>
                <ol className="my-5 flex gap-2" aria-label="Application steps">
                  {STEP_LABELS.map((label, i) => (
                    <li key={label} className="flex-1">
                      <div className={`h-1.5 rounded-full ${i <= step ? "bg-brand" : "bg-line"}`} />
                      <p className={`mt-1.5 text-xs sm:text-sm ${i === step ? "font-medium" : "text-ink-soft"}`}>{i + 1}. {label}</p>
                    </li>
                  ))}
                </ol>
                {step === 0 && <PersonalStep initial={data.profile} defaultName={user?.name ?? ""} onDone={(profile) => { setData({ ...data, profile }); setStep(1); }} />}
                {step === 1 && <SlipStep current={data.salarySlip} onUploaded={(salarySlip) => setData({ ...data, salarySlip })} onBack={() => setStep(0)} onNext={() => setStep(2)} />}
                {step === 2 && <LoanStep onBack={() => setStep(1)} onApplied={(loan) => { setData({ ...data, loans: [loan, ...data.loans] }); setNewApplication(false); }} />}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
