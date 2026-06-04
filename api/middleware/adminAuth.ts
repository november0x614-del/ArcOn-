import { Request, Response, NextFunction } from "express";
import { getSupabaseAdmin } from "../config/supabase.js";

/**
 * Middleware untuk memastikan user memiliki role 'admin' di database.
 * Memerlukan requireUserAuth agar req.user tersedia.
 */
export const authenticateAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;

  if (!user) {
    console.warn(`[Security Alert] Admin access attempt without user session from ${req.ip}`);
    return res.status(401).json({ error: "Unauthorized: Missing user session" });
  }

  try {
    const supabase = getSupabaseAdmin();
    // Cek role user di table profiles
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error || !profile || profile.role !== 'admin') {
      console.warn(`[Security Alert] Unauthorized admin access attempt by ${user.id}`);
      return res.status(403).json({ error: "Forbidden: Admin access required" });
    }
  } catch (err: any) {
    console.error("[AdminAuthMiddleware] Critical server error:", err);
    return res.status(500).json({ error: "Internal server error during authentication" });
  }
  
  next();
};
