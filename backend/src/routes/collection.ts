import { Router } from "express";
import { z } from "zod";
import { authenticate, authorize } from "../middleware/auth";
import { Loan } from "../models/Loan";
import { Payment } from "../models/Payment";
import { listLoans } from "../services/loanService";
import { recordPayment } from "../services/paymentService";
import { AppError, asyncHandler } from "../utils/errors";

const router = Router();
router.use(authenticate, authorize("COLLECTION"));

const paymentSchema = z.object({
  utr: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{6,35}$/, "UTR must be 6-35 letters/digits"),
  amount: z
    .number({ invalid_type_error: "Amount must be a number" })
    .positive("Amount must be greater than 0")
    .refine((n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6, "Amount can have at most 2 decimal places"),
  paidOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    .transform((s) => new Date(`${s}T00:00:00.000Z`))
    .refine((d) => !Number.isNaN(d.getTime()), "Enter a valid date"),
});

router.get(
  "/loans",
  asyncHandler(async (req, res) => {
    const loans = await listLoans(["DISBURSED", "CLOSED"], "DISBURSED", req.query.status as string | undefined);
    res.json({ loans });
  }),
);

router.get(
  "/loans/:id/payments",
  asyncHandler(async (req, res) => {
    if (!(await Loan.exists({ _id: req.params.id }))) throw new AppError(404, "Loan not found");
    const payments = await Payment.find({ loan: req.params.id }).sort({ paidOn: -1, createdAt: -1 });
    res.json({ payments });
  }),
);

router.post(
  "/loans/:id/payments",
  asyncHandler(async (req, res) => {
    const body = paymentSchema.parse(req.body);
    const result = await recordPayment(req.params.id, { ...body, amount: Math.round(body.amount * 100) / 100 }, req.user!.id);
    res.status(201).json(result);
  }),
);

export default router;
