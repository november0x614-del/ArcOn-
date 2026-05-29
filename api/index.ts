import express from "express";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { getSupabaseAdmin, isUserBlocked } from "./config/supabase.js";
import walletRoutes from "./routes/wallet.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import miscRoutes from "./routes/misc.routes.js";
import ecommerceRoutes from "./routes/ecommerce.routes.js";

// Re-export core services for server/other files that reference index
export { getSupabaseAdmin, isUserBlocked };

process.on("uncaughtException", (err) => {
  console.error("Unhandled Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

const app = express();
app.set("trust proxy", 1); // Enable if you're behind a reverse proxy (Heroku, AWS, Nginx, or Google Cloud Run)

// Rate Limiting Configuration
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: process.env.NODE_ENV === "production" ? 150 : 1500, // Limit each IP to 1500 API requests per exactly windowMs in dev, 150 in prod
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: "Terlalu banyak request (Rate Limit). Silakan coba lagi sebentar lagi." },
});

// Middlewares
app.use(compression()); // Compress all routes to optimize bandwidth and server load
app.use(apiLimiter); // Apply rate limiter globally for API endpoints

// For Circle's raw webhook, we use a custom verify callback in express.json() to capture the exact raw body Buffer on req.rawBody
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  }),
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

app.use("/api", ecommerceRoutes);
app.use("/", ecommerceRoutes);

// Export Express App
export default app;
