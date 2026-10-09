import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { authenticate, signToken } from "../middleware/auth";
import { User } from "../models/User";
import { AppError, asyncHandler } from "../utils/errors";

const router = Router();

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: true, legacyHeaders: false });

const signupSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Za-z]/, "Password must contain a letter")
    .regex(/[0-9]/, "Password must contain a number"),
});

// Public signup always creates a BORROWER. Executive accounts come from the seed script only.
router.post(
  "/signup",
  authLimiter,
  asyncHandler(async (req, res) => {
    const { name, email, password } = signupSchema.parse(req.body);
    if (await User.exists({ email })) throw new AppError(409, "An account with this email already exists");

    const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 10), role: "BORROWER" });
    res.status(201).json({ token: signToken(user.id, user.role), user });
  }),
);

router.post(
  "/login",
  authLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = z
      .object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) })
      .parse(req.body);

    const user = await User.findOne({ email }).select("+passwordHash");
    // Same message for unknown email and wrong password: do not leak which accounts exist.
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new AppError(401, "Invalid email or password");
    }
    res.json({ token: signToken(user.id, user.role), user });
  }),
);

router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user!.id);
    res.json({ user });
  }),
);

export default router;
