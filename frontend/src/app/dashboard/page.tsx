"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { homeFor } from "@/lib/roles";

export default function DashboardIndex() {
  const { user } = useAuth();
  const router = useRouter();
  useEffect(() => { if (user) router.replace(homeFor(user.role)); }, [user, router]);
  return <Spinner />;
}
