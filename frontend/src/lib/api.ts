const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
const TOKEN_KEY = "lms_token";

export const tokenStore = {
  get: () => (typeof window === "undefined" ? null : window.localStorage.getItem(TOKEN_KEY)),
  set: (t: string) => window.localStorage.setItem(TOKEN_KEY, t),
  clear: () => window.localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: any,
  ) {
    super(message);
  }
  /** Human readable bullet list for validation / BRE failures. */
  get reasons(): string[] {
    if (Array.isArray(this.details?.reasons)) return this.details.reasons;
    if (Array.isArray(this.details)) return this.details.map((d: any) => (d.field ? `${d.field}: ${d.message}` : String(d)));
    return [];
  }
}

interface Options {
  method?: string;
  body?: unknown;
  form?: FormData;
}

async function request(path: string, { method = "GET", body, form }: Options = {}): Promise<Response> {
  const headers: Record<string, string> = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { method, headers, body: form ?? (body !== undefined ? JSON.stringify(body) : undefined) });
  } catch {
    throw new ApiError(0, "Cannot reach the server. Check that the API is running.");
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && !path.startsWith("/auth/login") && !path.startsWith("/auth/signup")) {
      tokenStore.clear();
      if (typeof window !== "undefined" && window.location.pathname !== "/login") window.location.assign("/login");
    }
    throw new ApiError(res.status, data.message ?? "Something went wrong", data.details);
  }
  return res;
}

export async function api<T>(path: string, options?: Options): Promise<T> {
  return (await request(path, options)).json() as Promise<T>;
}

/** Salary slips are access-controlled, so fetch with the token and open the blob. */
export async function openSalarySlip(loanId: string): Promise<void> {
  const res = await request(`/loans/${loanId}/salary-slip`);
  const url = URL.createObjectURL(await res.blob());
  window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
