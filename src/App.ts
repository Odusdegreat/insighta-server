import express from "express";
import morgan from "morgan";
import cors from "cors";

import authRoutes from "./modules/auth/auth.routes";
import profileRoutes from "./modules/profiles/profile.routes";
import { versionMiddleware } from "./middleware/version.middleware";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/auth", authRoutes);
app.use("/api", versionMiddleware);
app.use("/api/profiles", profileRoutes);

export default app;