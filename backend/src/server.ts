import mongoose from "mongoose";
import { app } from "./app";
import { env } from "./config/env";
import { Loan } from "./models/Loan";
import { Payment } from "./models/Payment";
import { User } from "./models/User";

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  // Build unique indexes (email, UTR, one-active-loan) BEFORE accepting traffic.
  await Promise.all([User.init(), Loan.init(), Payment.init()]);
  app.listen(env.PORT, () => console.log(`API listening on http://localhost:${env.PORT}`));
}

main().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});
