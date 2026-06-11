import "dotenv/config";
import express from "express";
import * as trpcExpress from "@trpc/server/adapters/express";
import cors from "cors";
import { appRouter } from "../routers";
import { db } from "./db";
import { verifyAuthToken } from "./auth";

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// tRPC endpoint with authentication context
app.use(
  "/api/trpc",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext: async ({ req }) => {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;
      const user = await verifyAuthToken(authHeader);

      return {
        db,
        user,
        req,
      };
    },
  })
);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Server error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server started on http://localhost:${port}`);
  console.log(`📡 tRPC endpoint: http://localhost:${port}/api/trpc`);
  console.log(`💊 Health check: http://localhost:${port}/health`);
});
