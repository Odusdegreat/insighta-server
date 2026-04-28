import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { v7 as uuidv7 } from "uuid";
import { Parser } from "json2csv";
import type { Request, Response, NextFunction } from "express";
import { readFileSync, writeFileSync } from "fs";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "secret";

/* ================= AUTH (SIMPLE FOR NOW) ================= */

let refreshTokens: any[] = [];

const generateAccessToken = (user: any) => {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "3m" });
};

app.get("/auth/github", (req, res) => {
  res.send("Simulated login → return tokens manually for now");
});

app.get("/auth/github/callback", (req, res) => {
  const user = { id: "1", role: "admin" };

  const access_token = generateAccessToken(user);
  const refresh_token = crypto.randomBytes(40).toString("hex");

  refreshTokens.push({ token: refresh_token, user });

  res.json({
    status: "success",
    access_token,
    refresh_token,
  });
});

app.post("/auth/refresh", (req, res) => {
  const { refresh_token } = req.body;

  const stored = refreshTokens.find(t => t.token === refresh_token);
  if (!stored) {
    return res.status(401).json({ status: "error", message: "Invalid token" });
  }

  // rotate token
  refreshTokens = refreshTokens.filter(t => t.token !== refresh_token);

  const newAccess = generateAccessToken(stored.user);
  const newRefresh = crypto.randomBytes(40).toString("hex");

  refreshTokens.push({ token: newRefresh, user: stored.user });

  res.json({
    status: "success",
    access_token: newAccess,
    refresh_token: newRefresh,
  });
});

/* ================= MIDDLEWARE ================= */

const authMiddleware = (req: any, res: Response, next: NextFunction) => {
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

const requireRole = (roles: string[]) => {
  return (req: any, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ status: "error", message: "Forbidden" });
    }
    next();
  };
};

const versionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!req.headers["x-api-version"]) {
    return res.status(400).json({
      status: "error",
      message: "API version header required",
    });
  }
  next();
};

app.use("/api", versionMiddleware);

/* ================= DATA ================= */

const dataPath = path.join(process.cwd(), "data/profiles.json");

let profiles: any[] = [];

try {
  const data = readFileSync(dataPath, "utf8");
  profiles = JSON.parse(data);
} catch {
  for (let i = 0; i < 2026; i++) {
    profiles.push({
      id: uuidv7(),
      name: `Person ${i + 1}`,
      gender: i % 2 === 0 ? "male" : "female",
      gender_probability: Math.random(),
      age: Math.floor(Math.random() * 100),
      age_group:
        i % 4 === 0
          ? "child"
          : i % 4 === 1
          ? "teenager"
          : i % 4 === 2
          ? "adult"
          : "senior",
      country_id: i % 3 === 0 ? "NG" : i % 3 === 1 ? "BJ" : "GH",
      country_name:
        i % 3 === 0 ? "Nigeria" : i % 3 === 1 ? "Benin" : "Ghana",
      country_probability: Math.random(),
      created_at: new Date().toISOString(),
    });
  }

  writeFileSync(dataPath, JSON.stringify(profiles, null, 2));
}

/* ================= PROFILES ================= */

app.get("/api/profiles", authMiddleware, (req: any, res: Response) => {
  let result = [...profiles];

  const { gender, min_age, max_age, page = "1", limit = "10" } = req.query;

  if (gender) result = result.filter(p => p.gender === gender);
  if (min_age) result = result.filter(p => p.age >= Number(min_age));
  if (max_age) result = result.filter(p => p.age <= Number(max_age));

  const pageNum = Number(page);
  const limitNum = Number(limit);

  const total = result.length;
  const total_pages = Math.ceil(total / limitNum);

  const data = result.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  res.json({
    status: "success",
    page: pageNum,
    limit: limitNum,
    total,
    total_pages,
    links: {
      self: `/api/profiles?page=${pageNum}&limit=${limitNum}`,
      next:
        pageNum < total_pages
          ? `/api/profiles?page=${pageNum + 1}&limit=${limitNum}`
          : null,
      prev:
        pageNum > 1
          ? `/api/profiles?page=${pageNum - 1}&limit=${limitNum}`
          : null,
    },
    data,
  });
});

/* ================= CSV EXPORT ================= */

app.get(
  "/api/profiles/export",
  authMiddleware,
  (req: any, res: Response) => {
    const parser = new Parser();
    const csv = parser.parse(profiles);

    res.header("Content-Type", "text/csv");
    res.attachment(`profiles_${Date.now()}.csv`);
    res.send(csv);
  }
);

/* ================= SEARCH ================= */

app.get("/api/profiles/search", authMiddleware, (req: any, res: Response) => {
  const { q } = req.query;

  if (!q) {
    return res
      .status(400)
      .json({ status: "error", message: "Query required" });
  }

  let result = profiles;

  if (q.includes("young males")) {
    result = result.filter(p => p.gender === "male" && p.age < 25);
  }

  res.json({
    status: "success",
    page: 1,
    limit: result.length,
    total: result.length,
    total_pages: 1,
    links: { self: "", next: null, prev: null },
    data: result,
  });
});

/* ================= START ================= */

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});