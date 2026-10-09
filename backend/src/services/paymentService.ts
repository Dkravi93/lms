import { Loan } from "../models/Loan";
import { Payment } from "../models/Payment";
import { AppError } from "../utils/errors";
import { round2 } from "../utils/loanMath";

export interface PaymentInput {
  utr: string;
  amount: number;
  paidOn: Date;
}

/**
 * Records a repayment and auto-closes the loan once the full amount is received.
 * Rules: loan must be DISBURSED, amount > 0 and <= outstanding, date not in the future and not
 * before disbursement, UTR globally unique.
 */
export async function recordPayment(loanId: string, input: PaymentInput, actorId: string) {
  const loan = await Loan.findById(loanId);
  if (!loan) throw new AppError(404, "Loan not found");
  if (loan.status === "CLOSED") throw new AppError(409, "Loan is already closed");
  if (loan.status !== "DISBURSED") throw new AppError(409, "Payments can only be recorded for disbursed loans");

  const outstanding = round2(loan.totalRepayment - loan.amountPaid);
  if (input.amount > outstanding) {
    throw new AppError(422, `Amount exceeds the outstanding balance of ₹${outstanding.toFixed(2)}`);
  }
  // Dates arrive as UTC midnight; allow up to one day ahead so users east of UTC can pick their local "today".
  if (input.paidOn.getTime() > startOfUtcDay(new Date()) + DAY_MS) throw new AppError(422, "Payment date cannot be in the future");
  if (loan.disbursedAt && input.paidOn.getTime() < startOfUtcDay(loan.disbursedAt)) {
    throw new AppError(422, "Payment date cannot be before the disbursement date");
  }

  // The unique index on `utr` is the source of truth; this is only a friendlier early check.
  let payment;
  try {
    payment = await Payment.create({ loan: loan._id, ...input, recordedBy: actorId });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      throw new AppError(409, `UTR ${input.utr.toUpperCase()} has already been recorded`);
    }
    throw err;
  }

  const newPaid = round2(loan.amountPaid + input.amount);
  const fullyPaid = newPaid >= loan.totalRepayment;
  const now = new Date();

  // Optimistic concurrency: only update if nobody else changed amountPaid since we read it.
  const updated = await Loan.findOneAndUpdate(
    { _id: loan._id, status: "DISBURSED", amountPaid: loan.amountPaid },
    {
      $set: { amountPaid: newPaid, ...(fullyPaid ? { status: "CLOSED", closedAt: now } : {}) },
      ...(fullyPaid
        ? { $push: { statusHistory: { status: "CLOSED", by: actorId, at: now, note: "Fully repaid" } } }
        : {}),
    },
    { new: true },
  ).populate("borrower", "name email");

  if (!updated) {
    await Payment.deleteOne({ _id: payment._id });
    throw new AppError(409, "The loan was modified by someone else. Please refresh and try again.");
  }
  return { payment, loan: updated };
}

const DAY_MS = 24 * 60 * 60 * 1000;
const startOfUtcDay = (d: Date): number => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
