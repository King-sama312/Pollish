/**
 * Reference server entry point
 * ─────────────────────────────
 * Adapt this to your existing server.js / index.js.
 * The key additions are:
 *   1. connectRedis() at startup
 *   2. Create HTTP server from Express app (instead of app.listen)
 *   3. initSocketIO(httpServer) for real-time
 *   4. cookie-parser middleware (required by polls.middleware.js)
 */

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv/config";
import { createServer } from "http";
import { initSocketIO } from "./src/socket.js";

import authRoutes from "./src/modules/auth/auth.routes.js";
import pollRoutes from "./src/modules/polls/polls.routes.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser()); 

app.use("/api/auth", authRoutes);
app.use("/api/polls", pollRoutes);

app.get("/api/health", (_, res) => res.json({ ok: true }));

const httpServer = createServer(app);
initSocketIO(httpServer);

const start = async () => {
  try {
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

start();
