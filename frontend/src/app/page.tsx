"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { homeFor } from "@/lib/roles";

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading) router.replace(user ? homeFor(user.role) : "/login");
  }, [user, loading, router]);
  return <Spinner />;
}
