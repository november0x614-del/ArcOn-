import express from "express";
import { logEnvironmentStatus, getEnvironmentSummary } from "../config/env-validator.js";

const router = express.Router();

/**
 * GET /api/debug/env-status
 * Shows current environment variables status (ADMIN ONLY)
 * Usage: curl "https://arc-on-y1t4.vercel.app/api/debug/env-status?secret=YOUR_ADMIN_SECRET"
 */
router.get("/debug/env-status", (req, res) => {
  try {
    // Optional: Add auth check
    const adminSecret = req.query.secret || req.headers["x-admin-secret"];
    if (adminSecret !== process.env.ADMIN_SECRET && process.env.ADMIN_SECRET) {
      return res.status(403).json({ error: "Unauthorized - Invalid admin secret" });
    }

    const summary = getEnvironmentSummary();
    
    res.json({
      status: "debug",
      environment: process.env.NODE_ENV || "development",
      summary: {
        total_variables: summary.total,
        configured: summary.set,
        missing: summary.missing,
        critical_missing: summary.criticalMissing,
      },
      critical_variables: {
        VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        CIRCLE_API_KEY: !!process.env.CIRCLE_API_KEY,
      },
      server_variables: {
        CIRCLE_ENTITY_SECRET: !!process.env.CIRCLE_ENTITY_SECRET,
        CIRCLE_BLOCKCHAIN: process.env.CIRCLE_BLOCKCHAIN || "NOT SET",
        PRIVATE_KEY: !!process.env.PRIVATE_KEY,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message,
      type: "ENV_VALIDATION_ERROR",
    });
  }
});

/**
 * GET /api/debug/env-report
 * Full environment report with logging (ADMIN ONLY)
 * Usage: curl "https://arc-on-y1t4.vercel.app/api/debug/env-report?secret=YOUR_ADMIN_SECRET"
 */
router.get("/debug/env-report", (req, res) => {
  try {
    const adminSecret = req.query.secret || req.headers["x-admin-secret"];
    if (adminSecret !== process.env.ADMIN_SECRET && process.env.ADMIN_SECRET) {
      return res.status(403).json({ error: "Unauthorized - Invalid admin secret" });
    }

    // Log report to console (check Vercel logs)
    logEnvironmentStatus();

    res.json({
      status: "report_generated",
      message: "Check Vercel deployment logs for full environment report",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    if (error.message.includes("FATAL")) {
      return res.status(500).json({
        error: error.message,
        critical: true,
        type: "MISSING_ENV_VARIABLES",
      });
    }
    
    res.status(500).json({
      error: error.message,
      type: "ENV_VALIDATION_ERROR",
    });
  }
});

export default router;
