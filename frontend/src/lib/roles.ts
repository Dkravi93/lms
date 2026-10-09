import type { Role } from "./types";

export const MODULES = [
  { href: "/dashboard/sales", label: "Sales", hint: "Leads who haven't applied", roles: ["SALES", "ADMIN"] },
  { href: "/dashboard/sanction", label: "Sanction", hint: "Review applications", roles: ["SANCTION", "ADMIN"] },
  { href: "/dashboard/disbursement", label: "Disbursement", hint: "Release funds", roles: ["DISBURSEMENT", "ADMIN"] },
  { href: "/dashboard/collection", label: "Collection", hint: "Record repayments", roles: ["COLLECTION", "ADMIN"] },
] as const satisfies readonly { href: string; label: string; hint: string; roles: readonly Role[] }[];

export const STAFF_ROLES: Role[] = ["ADMIN", "SALES", "SANCTION", "DISBURSEMENT", "COLLECTION"];

export const homeFor = (role: Role) =>
  role === "BORROWER" ? "/apply" : (MODULES.find((m) => (m.roles as readonly Role[]).includes(role))?.href ?? "/dashboard");
