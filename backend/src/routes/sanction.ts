import { Router } from "express";
import { z } from "zod";
import { authenticate, authorize } from "../middleware/auth";
import { listLoans, transitionLoan } from "../services/loanService";
import { asyncHandler } from "../utils/errors";

const router = Router();
router.use(authenticate, authorize("SANCTION"));

router.get(
  "/loans",
  asyncHandler(async (req, res) => {
    const loans = await listLoans(["APPLIED", "SANCTIONED", "REJECTED"], "APPLIED", req.query.status as string | undefined);
    res.json({ loans });
  }),
);

router.post(
  "/loans/:id/approve",
  asyncHandler(async (req, res) => {
    const loan = await transitionLoan(req.params.id, "APPLIED", "SANCTIONED", req.user!.id, {
      "sanction.by": req.user!.id,
      "sanction.at": new Date(),
    });
    res.json({ loan });
  }),
);

router.post(
  "/loans/:id/reject",
  asyncHandler(async (req, res) => {
    const { reason } = z.object({ reason: z.string().trim().min(5, "Give a reason of at least 5 characters").max(500) }).parse(req.body);
    const loan = await transitionLoan(
      req.params.id,
      "APPLIED",
      "REJECTED",
      req.user!.id,
      { "sanction.by": req.user!.id, "sanction.at": new Date(), "sanction.rejectionReason": reason },
      reason,
    );
    res.json({ loan });
  }),
);

export default router;
