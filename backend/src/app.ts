import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler, notFound } from "./middleware/error";
import authRoutes from "./routes/auth";
import borrowerRoutes from "./routes/borrower";
import collectionRoutes from "./routes/collection";
import disbursementRoutes from "./routes/disbursement";
import loanRoutes from "./routes/loans";
import salesRoutes from "./routes/sales";
import sanctionRoutes from "./routes/sanction";

export const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: env.CLIENT_URL.split(","), credentials: false }));
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/borrower", borrowerRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/sanction", sanctionRoutes);
app.use("/api/disbursement", disbursementRoutes);
app.use("/api/collection", collectionRoutes);

app.use(notFound);
app.use(errorHandler);
