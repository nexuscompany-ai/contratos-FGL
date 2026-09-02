import { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    const redirect = encodeURIComponent(req.originalUrl || "/");
    return res.redirect(`/login?redirect=${redirect}`);
  }
  next();
}
