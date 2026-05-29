import express from "express";
import { getSupabaseAdmin, isUserBlocked } from "./config/supabase.js";
import walletRoutes from "./routes/wallet.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import miscRoutes from "./routes/misc.routes.js";
import swapRoutes from "./routes/swap.routes.js";

// Re-export core services for server/other files that reference index
export { getSupabaseAdmin, isUserBlocked };

process.on("uncaughtException", (err) => {
  console.error("Unhandled Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

const app = express();

// Middlewares
// For Circle's raw webhook, we use a custom verify callback in express.json() to capture the exact raw body Buffer on req.rawBody
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

// API Group Routing - Refactored for industry standard MVC pattern
// We mount all routers on both '/api' and '/' root paths to prevent 405/404 errors on Vercel
// in case Vercel's Serverless Gateway strips the '/api' prefix before passing to Express.
app.use("/api", walletRoutes);
app.use("/", walletRoutes);

app.use("/api", transactionRoutes);
app.use("/", transactionRoutes);

app.use("/api/admin", adminRoutes);
app.use("/admin", adminRoutes);

app.use("/api", miscRoutes);
app.use("/", miscRoutes);

app.use("/api/swap", swapRoutes);
app.use("/swap", swapRoutes);

// Export Express App
export default app;
