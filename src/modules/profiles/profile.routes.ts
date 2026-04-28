import { Router } from "express";
import { getProfiles, exportProfiles } from "./profile.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.get("/", authMiddleware, getProfiles);
router.get("/export", authMiddleware, exportProfiles);

export default router;