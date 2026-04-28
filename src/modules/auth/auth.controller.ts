import axios from "axios";
import crypto from "crypto";
import User from "../../models/user.model";
import Token from "../../models/token.model";
import { generateAccessToken } from "../../utils/jwt";
import { Types } from "mongoose";

export const githubAuth = (req: any, res: any) => {
  const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}`;
  res.redirect(url);
};

export const githubCallback = async (req: any, res: any) => {
  try {
    const { code } = req.query;

    const tokenRes = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      { headers: { Accept: "application/json" } }
    );

    const access_token = tokenRes.data.access_token;

    const userRes = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const gh = userRes.data;

    let user = await User.findOne({ github_id: gh.id });

    if (!user) {
      user = await User.create({
        github_id: gh.id,
        username: gh.login,
        email: gh.email,
        avatar_url: gh.avatar_url,
      });
    }

    const jwtToken = generateAccessToken(user);

    const refresh = crypto.randomBytes(40).toString("hex");

    const userId = (user._id as Types.ObjectId).toString();

    await Token.create({
      user_id: userId,
      token: refresh,
      expires_at: new Date(Date.now() + 5 * 60 * 1000),
    });

    res.json({
      status: "success",
      access_token: jwtToken,
      refresh_token: refresh,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "GitHub authentication failed",
    });
  }
};