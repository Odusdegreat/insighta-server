import jwt from "jsonwebtoken";

export const authMiddleware = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token)
    return res.status(401).json({ status: "error", message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ status: "error", message: "Invalid token" });
  }
};