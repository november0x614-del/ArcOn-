import dotenv from "dotenv";
try {
  dotenv.config({ override: true });
} catch (e) {
  console.warn("Dotenv load warning on server startup:", e);
}

import app from "./api/index.js";
import path from "path";
import express from "express";
import { createServer as createViteServer } from "vite";

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
    // Leverage browser caching for static assets to reduce server load
    app.use(express.static(distPath, { maxAge: "1y" }));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
