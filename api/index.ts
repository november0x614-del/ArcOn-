import express from "express";
import rateLimit from "express-rate-limit";
import walletRoutes from "./routes/wallet.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import miscRoutes from "./routes/misc.routes.js";
import ecommerceRoutes from "./routes/ecommerce.routes.js";
import inboxRoutes from "./routes/inbox.routes.js";

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
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// API Group Routing - Refactored for industry standard MVC pattern
// Mounted exclusively under '/api' to reduce the attack surface and secure API routes.
app.use("/api", walletRoutes);
app.use("/api", transactionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", miscRoutes);
app.use("/api", ecommerceRoutes);
app.use("/api", inboxRoutes);

// Export Express App
export default app;

