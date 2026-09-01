import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

export const env = {
  port: Number(process.env.PORT) || 5000,
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/alliance-fintech",
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || "dev-access-secret",
  cookieSecure: process.env.COOKIE_SECURE === "true",
  nodeEnv: process.env.NODE_ENV || "development",
  accessTokenTtl: "15m",
  refreshTokenTtlMs: 7 * 24 * 60 * 60 * 1000,
};
