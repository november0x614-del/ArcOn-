import express from "express";
import { getSupabaseAdmin, isUserBlocked } from "./config/supabase.js";
import walletRoutes from "./routes/wallet.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import miscRoutes from "./routes/misc.routes.js";

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
// For Circle's raw webhook, we handle it in miscRoutes inline or via specific paths,
// but for standard parsed JSON across the app, we use express.json()
app.use(express.json());

// API Group Routing - Refactored for industry standard MVC pattern
app.use("/api", walletRoutes);
app.use("/api", transactionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", miscRoutes);

// Export Express App
export default app;
