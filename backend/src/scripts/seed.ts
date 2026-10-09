import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { env } from "../config/env";
import type { Role } from "../config/constants";
import { User } from "../models/User";

const ACCOUNTS: { name: string; email: string; password: string; role: Role }[] = [
  { name: "Admin User", email: "admin@lms.com", password: "Admin@123", role: "ADMIN" },
  { name: "Sales Executive", email: "sales@lms.com", password: "Sales@123", role: "SALES" },
  { name: "Sanction Executive", email: "sanction@lms.com", password: "Sanction@123", role: "SANCTION" },
  { name: "Disbursement Executive", email: "disbursement@lms.com", password: "Disburse@123", role: "DISBURSEMENT" },
  { name: "Collection Executive", email: "collection@lms.com", password: "Collect@123", role: "COLLECTION" },
  { name: "Demo Borrower", email: "borrower@lms.com", password: "Borrower@123", role: "BORROWER" },
];

async function seed() {
  await mongoose.connect(env.MONGODB_URI);
  for (const a of ACCOUNTS) {
    // Idempotent: re-running resets credentials/role instead of creating duplicates.
    await User.updateOne(
      { email: a.email },
      { $set: { name: a.name, role: a.role, passwordHash: await bcrypt.hash(a.password, 10) } },
      { upsert: true },
    );
  }
  console.table(ACCOUNTS.map(({ role, email, password }) => ({ role, email, password })));
  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
