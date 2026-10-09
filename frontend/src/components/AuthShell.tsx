import type { ReactNode } from "react";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="hidden bg-brand p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <p className="text-lg font-semibold">LMS</p>
        <div>
          <h2 className="max-w-md text-4xl font-semibold leading-tight">Short-term loans, from application to final repayment.</h2>
          <p className="mt-4 max-w-md text-white/80">₹50,000 to ₹5,00,000 for 30 to 365 days at a flat 12% a year. No hidden charges.</p>
        </div>
        <p className="text-sm text-white/60">Borrowers apply here. Executives sign in to manage loans.</p>
      </section>
      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="mb-6 mt-1 text-sm text-ink-soft">{subtitle}</p>
          {children}
        </div>
      </section>
    </main>
  );
}
