import express from "express";
import http from "http";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { Server } from "socket.io";
import { env } from "./config/env.js";
import { connectDb } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import fileRoutes from "./routes/file.js";
import userRoutes from "./routes/user.js";
import reportRoutes from "./routes/reports.js";
import jobRoutes from "./routes/job.js";
import { errorHandler } from "./utils/errors.js";
import { initializeSocket } from "./socket/socket.js";
import "./workers/file.worker.js"

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.clientOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/v1/auth", authRoutes);
app.use( "/api/v1/files", fileRoutes);
app.use("/api/v1/users", userRoutes )
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/jobs", jobRoutes);

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: env.clientOrigin,
    credentials: true,
  },
});

initializeSocket(io);

await connectDb();
app.use(errorHandler);


httpServer.listen(env.port, () => {
  console.log(
    `API listening on http://localhost:${env.port}`
  );
});
