import { Request, Response, NextFunction } from "express";

/**
 * Middleware untuk memastikan hanya request dengan API Key Admin yang valid 
 * yang dapat mengakses endpoint admin.
 */
export const authenticateAdmin = (req: Request, res: Response, next: NextFunction) => {
  const adminSecret = req.headers["x-admin-secret"];

  if (!process.env.ADMIN_SECRET) {
    console.error("ADMIN_SECRET is not configured in the environment variables.");
    return res.status(500).json({ error: "Server misconfiguration" });
  }

  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    console.warn(`[Security Alert] Unauthorized admin access attempt from ${req.ip}`);
    return res.status(403).json({ error: "Unauthorized: Invalid or missing admin credentials" });
  }
  
  next();
};
