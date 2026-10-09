import type { ErrorRequestHandler, RequestHandler } from "express";
import mongoose from "mongoose";
import multer from "multer";
import { ZodError } from "zod";
import { AppError } from "../utils/errors";

export const notFound: RequestHandler = (req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) return res.status(err.status).json({ message: err.message, details: err.details });

  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Validation failed",
      details: err.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
    });
  }
  if (err instanceof multer.MulterError) {
    const tooBig = err.code === "LIMIT_FILE_SIZE";
    return res.status(tooBig ? 413 : 400).json({ message: tooBig ? "File is too large. Maximum size is 5 MB." : err.message });
  }
  if (err instanceof mongoose.Error.CastError) return res.status(400).json({ message: "Invalid identifier" });
  if ((err as { code?: number }).code === 11000) {
    return res.status(409).json({ message: "A record with the same unique value already exists" });
  }

  console.error(err);
  return res.status(500).json({ message: "Internal server error" });
};
