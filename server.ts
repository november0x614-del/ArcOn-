import app, { getSupabaseAdmin } from "./api/index.js";
import path from "path";
import express from "express";
import { createServer as createViteServer } from "vite";
import { startArcMonitor } from "./api/services/arcMonitor.js";

async function startServer() {
  const PORT = 3000;

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
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);

    // Start Arc Native Monitor
    const supabase = getSupabaseAdmin();
    startArcMonitor(supabase).catch((err) => {
      console.error("[Server] Failed to start Arc Monitor:", err);
    });
  });
}

startServer();
