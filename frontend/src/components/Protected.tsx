"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { homeFor } from "@/lib/roles";
import type { Role } from "@/lib/types";
import { Spinner } from "./ui";

/** Frontend guard. The API enforces the same rules independently, so this is UX, not security. */
export function Protected({ roles, children }: { roles: readonly Role[]; children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) return <Spinner />;
  if (!roles.includes(user.role)) {
    return (
      <div className="mx-auto mt-20 max-w-md p-6 text-center">
        <p className="text-5xl font-semibold text-ink-faint">403</p>
        <h1 className="mt-3 text-xl font-semibold">You don’t have access to this page</h1>
        <p className="mt-2 text-sm text-ink-soft">Your account ({user.role.toLowerCase()}) isn’t allowed to open this area.</p>
        <div className="mt-5 flex justify-center gap-3">
          <Link href={homeFor(user.role)} className="btn-primary">Go to my page</Link>
          <button onClick={logout} className="btn-ghost">Sign out</button>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
