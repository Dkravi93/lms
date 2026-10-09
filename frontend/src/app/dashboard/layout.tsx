"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Protected } from "@/components/Protected";
import { useAuth } from "@/lib/auth";
import { MODULES, STAFF_ROLES } from "@/lib/roles";
import type { Role } from "@/lib/types";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Protected roles={STAFF_ROLES}>
      <Shell>{children}</Shell>
    </Protected>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Only modules this role may use are rendered. The API enforces the same rule server-side.
  const links = MODULES.filter((m) => (m.roles as readonly Role[]).includes(user!.role));

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <header className="flex items-center justify-between border-b border-line bg-white px-4 py-3 lg:hidden">
        <p className="font-semibold text-brand">LMS Operations</p>
        <button className="btn-ghost" aria-expanded={open} onClick={() => setOpen(!open)}>Menu</button>
      </header>
      <aside className={`${open ? "block" : "hidden"} border-r border-line bg-white p-4 lg:flex lg:min-h-screen lg:flex-col lg:justify-between`}>
        <div>
          <p className="mb-6 hidden px-2 text-lg font-semibold text-brand lg:block">LMS Operations</p>
          <nav aria-label="Modules" className="space-y-1">
            {links.map((m) => {
              const active = pathname.startsWith(m.href);
              return (
                <Link key={m.href} href={m.href} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined}
                  className={`block rounded-md px-3 py-2 ${active ? "bg-brand-light text-brand-dark" : "hover:bg-paper"}`}>
                  <span className="block text-sm font-medium">{m.label}</span>
                  <span className="block text-xs text-ink-soft">{m.hint}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="mt-6 border-t border-line pt-4 text-sm">
          <p className="font-medium">{user!.name}</p>
          <p className="text-xs text-ink-soft">{user!.role.toLowerCase()}</p>
          <button className="btn-ghost mt-3 w-full" onClick={logout}>Sign out</button>
        </div>
      </aside>
      <main className="min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
