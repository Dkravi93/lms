"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "./api";

/** Small data hook: GET `path`, expose loading/error and a reload() for after mutations. */
export function useFetch<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await api<T>(path));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => { void reload(); }, [reload]);
  return { data, error, loading, reload };
}
