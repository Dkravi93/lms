import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { listLoans, transitionLoan } from "../services/loanService";
import { asyncHandler } from "../utils/errors";

const router = Router();
router.use(authenticate, authorize("DISBURSEMENT"));

router.get(
  "/loans",
  asyncHandler(async (req, res) => {
    const loans = await listLoans(["SANCTIONED", "DISBURSED"], "SANCTIONED", req.query.status as string | undefined);
    res.json({ loans });
  }),
);

// SANCTIONED -> DISBURSED: the loan becomes "active" and moves to the Collection module.
router.post(
  "/loans/:id/disburse",
  asyncHandler(async (req, res) => {
    const loan = await transitionLoan(req.params.id, "SANCTIONED", "DISBURSED", req.user!.id, {
      disbursedAt: new Date(),
      disbursedBy: req.user!.id,
    });
    res.json({ loan });
  }),
);

export default router;
