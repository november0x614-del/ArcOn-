import express from "express";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { getSupabaseAdmin, isUserBlocked } from "./config/supabase.js";
import walletRoutes from "./routes/wallet.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import miscRoutes from "./routes/misc.routes.js";
import ecommerceRoutes from "./routes/ecommerce.routes.js";

process.on("uncaughtException", (err) => {
  console.error("Unhandled Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

const app = express();
app.set("trust proxy", 1); // Enable if you're behind a reverse proxy (Heroku, AWS, Nginx, or Google Cloud Run)

// Enforce Global CORS headers for clean Web3 operations and iframe previews
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

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
    limit: "50mb",
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

export const config = {
  api: {
    bodyParser: false,
  },
};

// Global Error Handler for JSON APIs
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof Error) {
    if ((err as any).type === "entity.too.large") {
      return res.status(413).json({ error: "Payload too large. Gambar atau data yang diunggah terlalu besar." });
    }
    console.error("[Global API Error]", err.message);
    if (!res.headersSent) {
      return res.status(500).json({ error: err.message });
    }
  }
  next(err);
});

// Export Express App
export default app;
