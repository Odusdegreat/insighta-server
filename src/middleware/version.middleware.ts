export const versionMiddleware = (req: any, res: any, next: any) => {
  if (!req.headers["x-api-version"]) {
    return res.status(400).json({
      status: "error",
      message: "API version header required",
    });
  }
  next();
};