import { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    // TEMP: login check disabled for viewing the platform without DB access.
  // Restore this block to re-enable authentication:
  // if (!req.session.userId) {
  //   return res.redirect("/login");
  // }
  next();
}
