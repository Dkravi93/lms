import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z.string().default("1d"),
  CLIENT_URL: z.string().default("http://localhost:3000"),
  UPLOAD_DIR: z.string().default("uploads"),
});

export const env = schema.parse(process.env);
