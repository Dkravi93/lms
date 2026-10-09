import path from "node:path";
import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { uploadDir } from "../middleware/upload";
import { Loan } from "../models/Loan";
import { AppError, asyncHandler } from "../utils/errors";

const router = Router();
router.use(authenticate);

/**
 * Protected salary-slip download. Files are NOT served statically: access is checked per request.
 * Allowed: the owning borrower, Sanction, Disbursement and Admin.
 */
router.get(
  "/:id/salary-slip",
  asyncHandler(async (req, res) => {
    const loan = await Loan.findById(req.params.id);
    if (!loan) throw new AppError(404, "Loan not found");

    const { id, role } = req.user!;
    const allowed = role === "ADMIN" || role === "SANCTION" || role === "DISBURSEMENT" || loan.borrower.toString() === id;
    if (!allowed) throw new AppError(403, "You do not have permission to access this resource");

    res.setHeader("Content-Type", loan.salarySlip.mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(loan.salarySlip.originalName)}"`);
    res.sendFile(path.join(uploadDir, path.basename(loan.salarySlip.storedName)));
  }),
);

export default router;
