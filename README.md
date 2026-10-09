# Loan Management System

Borrowers apply for loans online; internal executives move each loan through **Sanction → Disbursement → Collection**.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind · Node/Express · MongoDB/Mongoose · JWT + bcrypt (`bcryptjs`, pure JS so it installs everywhere)

## Quick start

Requires Node 18+ and **MongoDB 6+** (local, Docker, or Atlas).

```bash
docker compose up -d                 # optional: starts MongoDB on :27017

# API
cd backend
cp .env.example .env                 # set JWT_SECRET and MONGODB_URI
npm install
npm run seed                         # creates one account per role (prints them)
npm run dev                          # http://localhost:5000

# Web (new terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev                          # http://localhost:3000
```

`npm test` (backend) runs unit tests for the BRE and loan maths. `npm run build` works in both apps.

## Login credentials (created by `npm run seed`)

| Role         | Email                | Password     | Can access           |
| ------------ | -------------------- | ------------ | -------------------- |
| Admin        | admin@lms.com        | Admin@123    | All four modules     |
| Sales        | sales@lms.com        | Sales@123    | Sales                |
| Sanction     | sanction@lms.com     | Sanction@123 | Sanction             |
| Disbursement | disbursement@lms.com | Disburse@123 | Disbursement         |
| Collection   | collection@lms.com   | Collect@123  | Collection           |
| Borrower     | borrower@lms.com     | Borrower@123 | Borrower portal only |

The seed is idempotent (re-running resets these accounts). New sign-ups are always `BORROWER`; the public API cannot create staff.

## Loan lifecycle

```
APPLIED ──approve──▶ SANCTIONED ──disburse──▶ DISBURSED ──fully repaid (automatic)──▶ CLOSED
   └────reject (reason required)────▶ REJECTED
```

Transitions are atomic (`findOneAndUpdate` filtered on the current status), so two executives can't both act on the same loan. Every transition is stored in `statusHistory`.

## Design decisions

**Business rules (BRE)** – age 23–50 (inclusive, birthday-aware), salary ≥ ₹25,000, PAN `^[A-Z]{5}[0-9]{4}[A-Z]$`, not unemployed. It runs on the **server** (authoritative; a client can be bypassed) and is mirrored on the client only for instant hints. It is re-run when the loan is created. All failed rules are returned together.

**Loan maths** – `SI = P × 12 × T / (365 × 100)`, `Total = P + SI`, rounded to 2 decimals. The server recomputes everything; client values are only a preview. Limits: ₹50,000–₹5,00,000, 30–365 days (validated server-side).

**Payments** – UTR is globally unique (unique index, case-insensitive). Amount must be > 0 and ≤ outstanding; date can't be in the future or before disbursement. Outstanding = `totalRepayment − amountPaid`. The loan update uses optimistic concurrency, and the loan auto-closes when `amountPaid == totalRepayment`.

**RBAC** – roles stored on the user. `authenticate` → **401** (no/invalid token); `authorize(...roles)` → **403** (wrong role; ADMIN always passes). The role is re-read from the DB on every request. The frontend hides modules and shows a 403 screen, but the API enforces everything independently.

**Files** – PDF/JPG/PNG, max 5 MB, validated by extension, MIME type **and** magic bytes; stored under a random name; **not** served statically. Download goes through `GET /api/loans/:id/salary-slip`, which checks ownership/role.

**One active loan per borrower** – enforced by a partial unique index, not just a check.

**Sales leads** – borrowers with no loan yet, with a stage: registered only → details saved → slip uploaded (ready to apply) / failed eligibility (with reasons).

## API

| Method & path                                                                                | Role                                 | Purpose                                              |
| -------------------------------------------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------- |
| POST`/api/auth/signup`, `/login` · GET `/api/auth/me`                                 | public / any                         | Auth                                                 |
| GET`/api/borrower/application`                                                             | Borrower                             | Resume state (profile, slip, loans)                  |
| PUT`/api/borrower/profile`                                                                 | Borrower                             | Save details + run BRE (422 with reasons on failure) |
| POST`/api/borrower/salary-slip`                                                            | Borrower                             | Upload (multipart, field`salarySlip`)              |
| POST`/api/borrower/loans`                                                                  | Borrower                             | Apply`{principal, tenureDays}` → `APPLIED`      |
| GET`/api/loans/:id/salary-slip`                                                            | Owner, Sanction, Disbursement, Admin | Protected download                                   |
| GET`/api/sales/leads`                                                                      | Sales, Admin                         | Lead tracking                                        |
| GET`/api/sanction/loans?status=` · POST `/:id/approve` · POST `/:id/reject {reason}` | Sanction, Admin                      | Review                                               |
| GET`/api/disbursement/loans?status=` · POST `/:id/disburse`                             | Disbursement, Admin                  | Release funds                                        |
| GET`/api/collection/loans?status=` · GET/POST `/:id/payments {utr, amount, paidOn}`     | Collection, Admin                    | Repayments                                           |

Status codes: 400 validation · 401 not logged in · 403 wrong role · 404 · 409 conflict (duplicate UTR, wrong state, already applied) · 413 file too large · 422 rule failure (BRE, overpayment).

## Structure

```
backend/src  config/ middleware/ models/ routes/ services/ utils/ scripts/seed.ts
frontend/src app/ (login, signup, apply, dashboard/*) components/ lib/
```

## Demo script (3–5 min video)

1. Sign up as a new borrower → enter an **ineligible** profile (age 21 or salary 20,000) → show the rejection reasons.
2. Fix the details → upload a salary slip → move the sliders (live calculation) → **Apply**.
3. Log in as **Sales** → show the lead list (including the borrower who failed eligibility).
4. **Sanction** → open the slip → approve (also show a reject with reason on a second application).
5. **Disbursement** → mark disbursed.
6. **Collection** → record a partial payment, try a **duplicate UTR** and an **overpayment** (both blocked), then pay the balance → loan **closes**.
7. Log in as the borrower → status shows Closed. Optionally show a Sales user hitting `/dashboard/sanction` → 403.
