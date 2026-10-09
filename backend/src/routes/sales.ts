import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { Loan } from "../models/Loan";
import { User } from "../models/User";
import { asyncHandler } from "../utils/errors";

const router = Router();
router.use(authenticate, authorize("SALES"));

type Stage = "REGISTERED" | "BRE_REJECTED" | "DETAILS_SAVED" | "SLIP_UPLOADED";

/**
 * Leads = borrowers who have registered but never submitted a loan application.
 * The stage shows how far they got so Sales knows who to follow up with.
 */
router.get(
  "/leads",
  asyncHandler(async (_req, res) => {
    const rows = await User.aggregate([
      { $match: { role: "BORROWER" } },
      { $lookup: { from: Loan.collection.name, localField: "_id", foreignField: "borrower", as: "loans" } },
      { $match: { loans: { $size: 0 } } },
      { $sort: { createdAt: -1 } },
      { $limit: 500 },
      {
        $project: {
          name: 1,
          email: 1,
          createdAt: 1,
          "profile.fullName": 1,
          "profile.pan": 1,
          "profile.monthlySalary": 1,
          "profile.employmentMode": 1,
          "profile.bre": 1,
          hasSalarySlip: { $cond: [{ $ifNull: ["$salarySlip", false] }, true, false] },
        },
      },
    ]);

    const leads = rows.map((r) => {
      let stage: Stage = "REGISTERED";
      if (r.profile?.bre) stage = !r.profile.bre.passed ? "BRE_REJECTED" : r.hasSalarySlip ? "SLIP_UPLOADED" : "DETAILS_SAVED";
      return { ...r, stage };
    });

    const summary = leads.reduce<Record<string, number>>((acc, l) => ({ ...acc, [l.stage]: (acc[l.stage] ?? 0) + 1 }), {});
    res.json({ leads, summary, total: leads.length });
  }),
);

export default router;
