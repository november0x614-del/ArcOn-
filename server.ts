import app from "./api/index";
import path from "path";
import express from "express";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const HOST = process.env.VERCEL ? '0.0.0.0' : 'localhost';

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
  });
}

startServer();
