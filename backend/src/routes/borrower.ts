import { Router } from "express";
import { z } from "zod";
import { ACTIVE_LOAN_STATUSES, EMPLOYMENT_MODES, LOAN_LIMITS } from "../config/constants";
import { authenticate, borrowerOnly } from "../middleware/auth";
import { hasValidSignature, removeFile, salarySlipUpload } from "../middleware/upload";
import { Loan } from "../models/Loan";
import { User } from "../models/User";
import { runBre } from "../utils/bre";
import { AppError, asyncHandler } from "../utils/errors";
import { calculateLoan } from "../utils/loanMath";

const router = Router();
router.use(authenticate, borrowerOnly);

const isRealDate = (s: string) => {
  const d = new Date(`${s}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s);
};

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(100),
  pan: z.string().trim().toUpperCase().min(1, "PAN is required"),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    .refine(isRealDate, "Enter a valid date")
    .transform((s) => new Date(`${s}T00:00:00.000Z`))
    .refine((d) => d.getTime() < Date.now(), "Date of birth must be in the past"),
  monthlySalary: z.number({ invalid_type_error: "Salary must be a number" }).positive("Salary must be positive").max(100_000_000),
  employmentMode: z.enum(EMPLOYMENT_MODES),
});

const applySchema = z.object({
  principal: z.number().int().min(LOAN_LIMITS.MIN_AMOUNT).max(LOAN_LIMITS.MAX_AMOUNT),
  tenureDays: z.number().int().min(LOAN_LIMITS.MIN_TENURE_DAYS).max(LOAN_LIMITS.MAX_TENURE_DAYS),
});

/** Everything the portal needs to resume where the borrower left off. */
router.get(
  "/application",
  asyncHandler(async (req, res) => {
    const [user, loans] = await Promise.all([
      User.findById(req.user!.id),
      Loan.find({ borrower: req.user!.id }).sort({ createdAt: -1 }),
    ]);
    res.json({ profile: user?.profile ?? null, salarySlip: user?.salarySlip ?? null, loans });
  }),
);

/** Step 2: save personal details and run the BRE on the server (the client check is only a convenience). */
router.put(
  "/profile",
  asyncHandler(async (req, res) => {
    const input = profileSchema.parse(req.body);
    const bre = runBre(input);

    const user = await User.findByIdAndUpdate(
      req.user!.id,
      { $set: { profile: { ...input, bre: { ...bre, checkedAt: new Date() } } } },
      { new: true },
    );

    if (!bre.passed) {
      throw new AppError(422, "You are not eligible for a loan right now", { reasons: bre.reasons });
    }
    res.json({ profile: user!.profile });
  }),
);

/** Step 3: salary slip upload (PDF/JPG/PNG, max 5 MB). */
router.post(
  "/salary-slip",
  asyncHandler(async (req, res) => {
    // Parse the multipart body first so the connection is always drained, then validate state.
    await new Promise<void>((resolve, reject) => salarySlipUpload(req, res, (err) => (err ? reject(err) : resolve())));
    const file = req.file;
    if (!file) throw new AppError(400, "Attach a file in the 'salarySlip' field");

    const user = await User.findById(req.user!.id);
    if (!user?.profile?.bre.passed) {
      await removeFile(file.filename);
      throw new AppError(409, "Complete the eligibility step before uploading documents");
    }
    if (!(await hasValidSignature(file.path, file.mimetype))) {
      await removeFile(file.filename);
      throw new AppError(400, "File content does not match its type");
    }

    const previous = user.salarySlip?.storedName;
    user.salarySlip = {
      originalName: file.originalname,
      storedName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      uploadedAt: new Date(),
    };
    await user.save();
    if (previous) await removeFile(previous);
    res.status(201).json({ salarySlip: user.salarySlip });
  }),
);

/** Step 4: create the loan (status APPLIED). The server recomputes all money values. */
router.post(
  "/loans",
  asyncHandler(async (req, res) => {
    const { principal, tenureDays } = applySchema.parse(req.body);
    const user = await User.findById(req.user!.id);
    const profile = user?.profile;

    if (!profile || !user.salarySlip) throw new AppError(409, "Complete your personal details and upload your salary slip first");
    // Re-run the BRE at apply time so stale or tampered profile data cannot slip through.
    const bre = runBre(profile);
    if (!bre.passed) throw new AppError(422, "You are not eligible for a loan right now", { reasons: bre.reasons });

    if (await Loan.exists({ borrower: user.id, status: { $in: ACTIVE_LOAN_STATUSES } })) {
      throw new AppError(409, "You already have a loan in progress");
    }

    const quote = calculateLoan(principal, tenureDays);
    const loan = await Loan.create({
      borrower: user.id,
      applicant: {
        fullName: profile.fullName,
        pan: profile.pan,
        dateOfBirth: profile.dateOfBirth,
        monthlySalary: profile.monthlySalary,
        employmentMode: profile.employmentMode,
      },
      salarySlip: {
        originalName: user.salarySlip.originalName,
        storedName: user.salarySlip.storedName,
        mimeType: user.salarySlip.mimeType,
        size: user.salarySlip.size,
      },
      ...quote,
      status: "APPLIED",
      statusHistory: [{ status: "APPLIED", by: user.id, at: new Date() }],
    });
    res.status(201).json({ loan });
  }),
);

export default router;
