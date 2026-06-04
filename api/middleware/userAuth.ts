import { Request, Response, NextFunction } from "express";
import { getSupabaseAdmin } from "../config/supabase.js";

/**
 * Middleware to enforce Supabase user session token (JWT) verification on the backend.
 * Protects endpoints from parameter tampering and unauthorized operations.
 */
export const requireUserAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing or invalid authentication token" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const supabase = getSupabaseAdmin();
    // Validate the token against Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.warn(`[Security Alert] Token rejection: ${error?.message || "Invalid session token"}`);
      return res.status(401).json({ error: "Unauthorized: Invalid or expired session credentials" });
    }

    // Attach verified user information to the request context
    (req as any).user = user;
    (req as any).userId = user.id;

    // Direct parameter tampering validation guard:
    // If request contains userId or buyerId in body, parameters, or query,
    // they MUST match the cryptographically verified user.id from Supabase Auth!
    const targetUserId = req.body.userId || req.params.userId || req.query.userId || req.body.buyerId;
    if (targetUserId && targetUserId !== user.id) {
      console.warn(`[Security Incident] Blocked potential ID tampering! Authenticated user ID: ${user.id}, Attempting target ID: ${targetUserId}`);
      return res.status(403).json({ error: "Forbidden: Security validation failed (ID mismatch)" });
    }

    next();
  } catch (err: any) {
    console.error("[AuthMiddleware] Critical server error during token verification:", err);
    return res.status(500).json({ error: "Internal server error during authentication" });
  }
};
