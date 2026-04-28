import jwt from "jsonwebtoken";

export const generateAccessToken = (user: any) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: "3m" }
  );
};