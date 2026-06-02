import app from "./api/index";
import { logEnvironmentStatus } from "./api/config/env-validator.js";
import path from "path";
import express from "express";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const PORT = 3000;

  // 🔍 Validate environment variables on startup
  try {
    console.log("[Server] Validating environment variables...");
    logEnvironmentStatus();
  } catch (err: any) {
    console.error("[Server] ⚠️ Environment validation warning:", err.message);
    // Don't crash server on warnings, but log for visibility
  }

  app.use((req, _res, next) => {
    if (req.url.startsWith("/api/")) {
      console.log(`[API REQUEST] ${req.method} ${req.url}`);
    }
    next();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    // Leverage browser caching for static assets to reduce server load
    app.use(express.static(distPath, { maxAge: "1y" }));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(
      `📋 Debug Endpoint: http://0.0.0.0:${PORT}/api/debug/env-status?secret=YOUR_ADMIN_SECRET`,
    );
  });
}

startServer().catch((err) => {
  console.error("[Server] Fatal startup error:", err);
  process.exit(1);
});
