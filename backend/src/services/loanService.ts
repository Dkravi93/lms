import { ALLOWED_TRANSITIONS, LoanStatus } from "../config/constants";
import { Loan } from "../models/Loan";
import { AppError } from "../utils/errors";

/**
 * Atomically moves a loan from `from` -> `to`.
 * The status is part of the query filter, so two executives clicking at the same time
 * cannot both succeed (no double sanction / double disbursement).
 */
export async function transitionLoan(
  loanId: string,
  from: LoanStatus,
  to: LoanStatus,
  actorId: string,
  set: Record<string, unknown> = {},
  note?: string,
) {
  if (!ALLOWED_TRANSITIONS[from].includes(to)) throw new AppError(500, `Illegal transition ${from} -> ${to}`);

  const loan = await Loan.findOneAndUpdate(
    { _id: loanId, status: from },
    { $set: { status: to, ...set }, $push: { statusHistory: { status: to, by: actorId, at: new Date(), note } } },
    { new: true },
  ).populate("borrower", "name email");

  if (!loan) {
    const exists = await Loan.exists({ _id: loanId });
    if (!exists) throw new AppError(404, "Loan not found");
    throw new AppError(409, `Loan is no longer in ${from} state`);
  }
  return loan;
}

/** Lists loans for a dashboard module, restricted to the statuses that module is allowed to see. */
export async function listLoans(allowed: LoanStatus[], defaultStatus: LoanStatus, requested?: string) {
  const statuses = !requested ? [defaultStatus] : requested === "ALL" ? allowed : [requested as LoanStatus];
  if (!statuses.every((s) => allowed.includes(s))) {
    throw new AppError(400, `status must be one of: ${allowed.join(", ")}, ALL`);
  }
  return Loan.find({ status: { $in: statuses } })
    .populate("borrower", "name email")
    .sort({ updatedAt: -1 })
    .limit(200);
}
