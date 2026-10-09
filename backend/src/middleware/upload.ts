import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import multer from "multer";
import { env } from "../config/env";
import { MAX_UPLOAD_BYTES } from "../config/constants";
import { AppError } from "../utils/errors";

export const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};

export const salarySlipUpload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    // Never trust the client filename on disk: random name + validated extension only.
    filename: (_req, file, cb) => cb(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED[file.mimetype]?.includes(ext)) {
      return cb(new AppError(400, "Only PDF, JPG or PNG files are allowed"));
    }
    cb(null, true);
  },
}).single("salarySlip");

const SIGNATURES: Record<string, number[]> = {
  "application/pdf": [0x25, 0x50, 0x44, 0x46], // %PDF
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
};

/** Confirms the file bytes match the declared type (a renamed .exe will not pass). */
export async function hasValidSignature(filePath: string, mime: string): Promise<boolean> {
  const sig = SIGNATURES[mime];
  if (!sig) return false;
  const handle = await fs.promises.open(filePath, "r");
  try {
    const buf = Buffer.alloc(sig.length);
    await handle.read(buf, 0, sig.length, 0);
    return sig.every((b, i) => buf[i] === b);
  } finally {
    await handle.close();
  }
}

export const removeFile = (storedName: string): Promise<void> =>
  fs.promises.unlink(path.join(uploadDir, storedName)).catch(() => undefined);
