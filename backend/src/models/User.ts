import { Schema, Types, model } from "mongoose";
import { EMPLOYMENT_MODES, EmploymentMode, ROLES, Role } from "../config/constants";
import { fileSchema } from "./shared";

export interface UserDoc {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  profile?: {
    fullName: string;
    pan: string;
    dateOfBirth: Date;
    monthlySalary: number;
    employmentMode: EmploymentMode;
    bre: { passed: boolean; reasons: string[]; checkedAt: Date };
  };
  salarySlip?: { originalName: string; storedName: string; mimeType: string; size: number; uploadedAt: Date };
  createdAt: Date;
  _id: Types.ObjectId;
}

const profileSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    pan: { type: String, required: true, uppercase: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    monthlySalary: { type: Number, required: true },
    employmentMode: { type: String, enum: EMPLOYMENT_MODES, required: true },
    bre: {
      passed: { type: Boolean, required: true },
      reasons: { type: [String], default: [] },
      checkedAt: { type: Date, required: true },
    },
  },
  { _id: false },
);

const userSchema = new Schema<UserDoc>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: "BORROWER", required: true, index: true },
    /** Personal details captured in Step 2 (kept even if the BRE rejects, so Sales can see the lead). */
    profile: { type: profileSchema },
    salarySlip: { type: fileSchema },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        const out = ret as Record<string, unknown>;
        delete out.passwordHash;
        delete out.__v;
        return out;
      },
    },
  },
);

export const User = model<UserDoc>("User", userSchema);
