import jwt from "jsonwebtoken";
import type { RequestHandler } from "express";
import { env } from "../config/env";
import type { Role } from "../config/constants";
import { User } from "../models/User";
import { AppError, asyncHandler } from "../utils/errors";

export const signToken = (userId: string, role: Role): string =>
  jwt.sign({ role }, env.JWT_SECRET, {
    subject: userId,
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });

/** 401 when the caller is not logged in (missing / invalid / expired token). */
export const authenticate: RequestHandler = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) throw new AppError(401, "Authentication required");

  let userId: string;
  try {
    userId = jwt.verify(header.slice(7), env.JWT_SECRET).sub as string;
  } catch {
    throw new AppError(401, "Invalid or expired token");
  }

  // Re-read the role from the DB so a demoted/deleted user loses access immediately.
  const user = await User.findById(userId).select("name email role");
  if (!user) throw new AppError(401, "Account no longer exists");

  req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
  next();
});

/** 403 when logged in but the role is not allowed. ADMIN is always allowed. */
export const authorize =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(new AppError(401, "Authentication required"));
    if (req.user.role !== "ADMIN" && !roles.includes(req.user.role)) {
      return next(new AppError(403, "You do not have permission to access this resource"));
    }
    next();
  };

/** Borrower-only routes (admin is intentionally NOT allowed to act as a borrower). */
export const borrowerOnly: RequestHandler = (req, _res, next) => {
  if (!req.user) return next(new AppError(401, "Authentication required"));
  if (req.user.role !== "BORROWER") return next(new AppError(403, "Only borrowers can use this resource"));
  next();
};
