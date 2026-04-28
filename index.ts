import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import axios from "axios";
import { v7 as uuidv7 } from "uuid";
import { Parser } from "json2csv";
import { JWT_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, FRONTEND_URL } from "./src/config/env.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

/* ================= RATE LIMIT ================= */

const authLimiter = rateLimit({
  windowMs: 60000,
  max: 10,
  handler: (req, res) => {
    res.status(429).json({ status: "error", message: "Too many requests" });
  },
});

const apiLimiter = rateLimit({
  windowMs: 60000,
  max: 60,
  handler: (req, res) => {
    res.status(429).json({ status: "error", message: "Too many requests" });
  },
});

/* ================= STORAGE ================= */

let users: any[] = [];
let refreshTokens: any[] = [];
let pkceStore = new Map();

/* ================= UTILS ================= */

const signAccess = (user: any) =>
  jwt.sign(user, JWT_SECRET, { expiresIn: "3m" });

/* ================= MIDDLEWARE ================= */

const auth = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token)
    return res.status(401).json({ status: "error", message: "Unauthorized" });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ status: "error", message: "Invalid token" });
  }
};

const allow = (roles: string[]) => (req: any, res: any, next: any) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ status: "error", message: "Forbidden" });
  }
  next();
};

const version = (req: any, res: any, next: any) => {
  if (!req.headers["x-api-version"]) {
    return res.status(400).json({
      status: "error",
      message: "API version header required",
    });
  }
  next();
};

/* ================= AUTH ================= */

// Step 1: Redirect with PKCE
app.get("/auth/github", authLimiter, (req, res) => {
  const { code_challenge, state } = req.query;

  if (!code_challenge || !state) {
    return res.status(400).json({
      status: "error",
      message: "Missing PKCE parameters",
    });
  }

  pkceStore.set(state, code_challenge);

  const url =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${GITHUB_CLIENT_ID}` +
    `&scope=user:email` +
    `&state=${state}`;

  res.redirect(url);
});

// Step 2: GitHub callback
app.get("/auth/github/callback", authLimiter, (req, res) => {
  const { code, state } = req.query;

  if (!code)
    return res.status(400).json({ status: "error", message: "Missing code" });

  if (!state)
    return res.status(400).json({ status: "error", message: "Missing state" });

  if (!pkceStore.has(state)) {
    return res.status(400).json({
      status: "error",
      message: "Invalid state",
    });
  }

  // Return code and state as JSON for the client to exchange
  res.json({
    status: "success",
    code,
    state,
  });
});

// Step 3: Exchange
app.post("/auth/exchange", authLimiter, async (req, res) => {
  const { code, code_verifier, state } = req.body;

  if (!code || !code_verifier || !state) {
    return res.status(400).json({
      status: "error",
      message: "Missing parameters",
    });
  }

  const stored = pkceStore.get(state);

  const hash = crypto
    .createHash("sha256")
    .update(code_verifier)
    .digest("base64url");

  if (hash !== stored) {
    return res.status(400).json({
      status: "error",
      message: "PKCE failed",
    });
  }

  // GitHub token exchange
  const gh = await axios.post(
    "https://github.com/login/oauth/access_token",
    {
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
    },
    { headers: { Accept: "application/json" } }
  );

  const userRes = await axios.get("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${gh.data.access_token}` },
  });

  let user = users.find(u => u.github_id === userRes.data.id);

  if (!user) {
    user = {
      id: uuidv7(),
      github_id: userRes.data.id,
      username: userRes.data.login,
      role: users.length === 0 ? "admin" : "analyst", // first user = admin
      is_active: true,
    };
    users.push(user);
  }

  const access_token = signAccess(user);

  const refresh_token = crypto.randomBytes(40).toString("hex");

  refreshTokens.push({
    token: refresh_token,
    user,
  });

  pkceStore.delete(state);

  res.json({
    status: "success",
    access_token,
    refresh_token,
  });
});

// Refresh (STRICT POST)
app.post("/auth/refresh", authLimiter, (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({
      status: "error",
      message: "refresh_token required",
    });
  }

  const stored = refreshTokens.find(t => t.token === refresh_token);

  if (!stored) {
    return res.status(401).json({
      status: "error",
      message: "Invalid refresh token",
    });
  }

  // rotate
  refreshTokens = refreshTokens.filter(t => t.token !== refresh_token);

  const newAccess = signAccess(stored.user);
  const newRefresh = crypto.randomBytes(40).toString("hex");

  refreshTokens.push({ token: newRefresh, user: stored.user });

  res.json({
    status: "success",
    access_token: newAccess,
    refresh_token: newRefresh,
  });
});

// Logout (STRICT POST)
app.post("/auth/logout", authLimiter, (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({
      status: "error",
      message: "refresh_token required",
    });
  }

  refreshTokens = refreshTokens.filter(t => t.token !== refresh_token);

  res.json({ status: "success" });
});

/* ================= USERS ================= */

app.get("/api/users/me", auth, (req: any, res) => {
  const user = users.find(u => u.id === req.user.id);

  if (!user) {
    return res.status(404).json({
      status: "error",
      message: "User not found",
    });
  }

  res.json({ status: "success", data: user });
});

/* ================= PROFILES ================= */

let profiles = Array.from({ length: 100 }).map((_, i) => ({
  id: uuidv7(),
  name: `Person ${i}`,
  age: Math.floor(Math.random() * 60),
  gender: i % 2 ? "male" : "female",
  country_id: "NG",
}));

app.use("/api", version, apiLimiter);

app.get("/api/profiles", auth, (req: any, res) => {
  res.json({
    status: "success",
    page: 1,
    limit: 10,
    total: profiles.length,
    total_pages: 1,
    links: { self: "", next: null, prev: null },
    data: profiles.slice(0, 10),
  });
});

// Admin only
app.post("/api/profiles", auth, allow(["admin"]), (req, res) => {
  profiles.push(req.body);
  res.json({ status: "success", data: req.body });
});

// CSV
app.get("/api/profiles/export", auth, (req, res) => {
  const parser = new Parser();
  const csv = parser.parse(profiles);

  res.header("Content-Type", "text/csv");
  res.attachment("profiles.csv");
  res.send(csv);
});

/* ================= START ================= */

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});