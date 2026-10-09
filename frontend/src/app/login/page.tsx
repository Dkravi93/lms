"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthShell } from "@/components/AuthShell";
import { Alert, Field } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { homeFor } from "@/lib/roles";

const DEMO = [
  ["Admin", "admin@lms.com", "Admin@123"],
  ["Sales", "sales@lms.com", "Sales@123"],
  ["Sanction", "sanction@lms.com", "Sanction@123"],
  ["Disbursement", "disbursement@lms.com", "Disburse@123"],
  ["Collection", "collection@lms.com", "Collect@123"],
  ["Borrower", "borrower@lms.com", "Borrower@123"],
];

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const user = await login(email, password);
      router.replace(homeFor(user.role));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not sign in");
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Sign in" subtitle="Use your borrower or executive account.">
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <Field label="Email"><input className="field" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Password"><input className="field" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
      <p className="mt-4 text-sm text-ink-soft">New borrower? <Link className="font-medium text-brand underline" href="/signup">Create an account</Link></p>

      <details className="card mt-8 p-4 text-sm">
        <summary className="cursor-pointer font-medium">Demo accounts (click to fill)</summary>
        <ul className="mt-3 space-y-1.5">
          {DEMO.map(([role, e, p]) => (
            <li key={role}>
              <button type="button" className="w-full rounded px-2 py-1 text-left hover:bg-paper" onClick={() => { setEmail(e); setPassword(p); }}>
                <span className="font-medium">{role}</span> <span className="text-ink-soft">{e}</span>
              </button>
            </li>
          ))}
        </ul>
      </details>
    </AuthShell>
  );
}
