"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthShell } from "@/components/AuthShell";
import { Alert, Field } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) return setErrors(["Passwords do not match"]);
    setBusy(true);
    setErrors([]);
    try {
      await signup(form.name, form.email, form.password);
      router.replace("/apply");
    } catch (err) {
      setErrors(err instanceof ApiError ? (err.reasons.length ? err.reasons : [err.message]) : ["Could not create account"]);
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Create your account" subtitle="Takes a minute. You’ll fill in your loan details next.">
      <form onSubmit={submit} className="space-y-4">
        {errors.length > 0 && <Alert><ul className="list-disc pl-4">{errors.map((m) => <li key={m}>{m}</li>)}</ul></Alert>}
        <Field label="Full name"><input className="field" required value={form.name} onChange={set("name")} autoComplete="name" /></Field>
        <Field label="Email"><input className="field" type="email" required value={form.email} onChange={set("email")} autoComplete="email" /></Field>
        <Field label="Password" hint="At least 8 characters with a letter and a number"><input className="field" type="password" required minLength={8} value={form.password} onChange={set("password")} autoComplete="new-password" /></Field>
        <Field label="Confirm password"><input className="field" type="password" required value={form.confirm} onChange={set("confirm")} autoComplete="new-password" /></Field>
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
      </form>
      <p className="mt-4 text-sm text-ink-soft">Already registered? <Link className="font-medium text-brand underline" href="/login">Sign in</Link></p>
    </AuthShell>
  );
}
