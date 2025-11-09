// backend/src/index.js (ESM)
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRouter from "./routes/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// CORS for cookies
const origin = process.env.CORS_ORIGIN || "http://localhost:3000";
app.use(cors({ origin, credentials: true }));

app.use(express.json());
app.use(cookieParser());

app.get("/", (_, res) => res.json({ ok: true, service: "refurbd-backend" }));

// Routes
app.use("/auth", authRouter);

// Fallback
app.use((req, res) => res.status(404).json({ error: "Not found" }));

app.listen(PORT, () => {
  console.log(`Backend listening on :${PORT}`);
});
