import { Request, Response, NextFunction } from "express";
import { getSupabaseAdmin } from "../config/supabase";

/**
 * Enterprise-Grade RBAC Middleware
 * Melindungi endpoint backend berdasarkan autentikasi JWT Supabase 
 * dan pengecekan otorisasi level database (HSM-Backed Wallet Protection).
 */
export const requireRole = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Ekstrak Bearer Token dari Header Akses
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
         return res.status(401).json({ error: "Missing or malformed Authorization header" });
      }

      const token = authHeader.split(" ")[1];

      // 2. Verifikasi Token secara Kriptografis melalui Supabase
      const supabase = getSupabaseAdmin();
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        console.warn(`[Intrusion Attempt] Invalid JWT Token dari IP: ${req.ip}`);
        return res.status(401).json({ error: "Invalid or Expired JWT Token" });
      }

      // 3. Otorisasi Profil & Role (Role-Based Access Control)
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        return res.status(403).json({ error: "User profile not found in RBAC constraints" });
      }

      const userRole = profile.role || 'user';

      // 4. Pengecekan Eskalasi Akses (Access Control List)
      if (!allowedRoles.includes(userRole)) {
        console.warn(`[RBAC Block] Akses ditolak untuk UID ${user.id} (Role: ${userRole}). Target Endpoint: ${req.originalUrl}`);
        return res.status(403).json({ error: "Insufficient permissions to execute this HSM action" });
      }

      // Inject ID pengguna yang sudah terafirmasi ke request untuk dipakai controller
      (req as any).user = user;
      
      next();
    } catch (error) {
      console.error("[RBAC Fatal Error]:", error);
      res.status(500).json({ error: "Internal Server Error during Authentication" });
    }
  };
};
