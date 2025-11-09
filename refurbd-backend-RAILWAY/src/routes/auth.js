// backend/src/routes/auth.js (ESM)
import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

const isProd = process.env.NODE_ENV === "production";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

function cookieOpts() {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: 7 * 24 * 3600 * 1000,
  };
}

router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ error: "Email already registered" });
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, password: hash } });
    return res.json({ ok: true, id: user.id });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Register failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign({ uid: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.cookie("token", token, cookieOpts());
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Login failed" });
  }
});

router.get("/me", async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ error: "Unauthorised" });
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.uid },
      select: { id: true, email: true, createdAt: true },
    });
    if (!user) return res.status(401).json({ error: "Unauthorised" });
    return res.json({ ok: true, user });
  } catch (e) {
    console.error(e);
    return res.status(401).json({ error: "Unauthorised" });
  }
});

router.post("/logout", async (req, res) => {
  res.clearCookie("token", { path: "/" });
  res.json({ ok: true });
});

export default router;
