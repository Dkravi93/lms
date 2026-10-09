import { Schema, Types, model } from "mongoose";

export interface PaymentDoc {
  loan: Types.ObjectId;
  utr: string;
  amount: number;
  paidOn: Date;
  recordedBy: Types.ObjectId;
}

const paymentSchema = new Schema<PaymentDoc>(
  {
    loan: { type: Schema.Types.ObjectId, ref: "Loan", required: true, index: true },
    // Unique across ALL payments (not per loan). Stored upper-cased so "abc" and "ABC" collide.
    utr: { type: String, required: true, unique: true, uppercase: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    paidOn: { type: Date, required: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true, toJSON: { versionKey: false } },
);

export const Payment = model<PaymentDoc>("Payment", paymentSchema);
