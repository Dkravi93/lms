export const LIMITS = { minAmount: 50_000, maxAmount: 500_000, minTenure: 30, maxTenure: 365, rate: 12 } as const;

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Mirrors the server: SI = (P × R × T) / (365 × 100). The server recomputes on apply; this is for the live preview. */
export function quote(principal: number, tenureDays: number) {
  const interest = round2((principal * LIMITS.rate * tenureDays) / (365 * 100));
  return { interest, total: round2(principal + interest) };
}
