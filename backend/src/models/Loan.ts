import { Schema, Types, model } from "mongoose";
import { ACTIVE_LOAN_STATUSES, EMPLOYMENT_MODES, LOAN_STATUSES, LoanStatus } from "../config/constants";
import { round2 } from "../utils/loanMath";
import { fileSchema } from "./shared";

export interface LoanDoc {
  borrower: Types.ObjectId;
  applicant: {
    fullName: string;
    pan: string;
    dateOfBirth: Date;
    monthlySalary: number;
    employmentMode: (typeof EMPLOYMENT_MODES)[number];
  };
  salarySlip: { originalName: string; storedName: string; mimeType: string; size: number };
  principal: number;
  tenureDays: number;
  interestRate: number;
  interest: number;
  totalRepayment: number;
  amountPaid: number;
  status: LoanStatus;
  statusHistory: { status: LoanStatus; by: Types.ObjectId; at: Date; note?: string }[];
  sanction?: { by: Types.ObjectId; at: Date; rejectionReason?: string };
  disbursedAt?: Date;
  disbursedBy?: Types.ObjectId;
  closedAt?: Date;
}

const loanSchema = new Schema<LoanDoc>(
  {
    borrower: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    applicant: {
      fullName: { type: String, required: true },
      pan: { type: String, required: true },
      dateOfBirth: { type: Date, required: true },
      monthlySalary: { type: Number, required: true },
      employmentMode: { type: String, enum: EMPLOYMENT_MODES, required: true },
    },
    salarySlip: { type: fileSchema, required: true },
    principal: { type: Number, required: true },
    tenureDays: { type: Number, required: true },
    interestRate: { type: Number, required: true },
    interest: { type: Number, required: true },
    totalRepayment: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    status: { type: String, enum: LOAN_STATUSES, default: "APPLIED", index: true },
    statusHistory: [
      {
        _id: false,
        status: { type: String, enum: LOAN_STATUSES, required: true },
        by: { type: Schema.Types.ObjectId, ref: "User", required: true },
        at: { type: Date, required: true },
        note: String,
      },
    ],
    sanction: {
      by: { type: Schema.Types.ObjectId, ref: "User" },
      at: Date,
      rejectionReason: String,
    },
    disbursedAt: Date,
    disbursedBy: { type: Schema.Types.ObjectId, ref: "User" },
    closedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, versionKey: false },
  },
);

loanSchema.virtual("outstanding").get(function () {
  return round2(this.totalRepayment - this.amountPaid);
});

// DB-level guarantee: a borrower can never have two live loans, even under concurrent requests.
loanSchema.index(
  { borrower: 1 },
  { name: "one_active_loan_per_borrower", unique: true, partialFilterExpression: { status: { $in: ACTIVE_LOAN_STATUSES } } },
);
loanSchema.index({ borrower: 1, createdAt: -1 }, { name: "borrower_loans_by_date" });

export const Loan = model<LoanDoc>("Loan", loanSchema);
