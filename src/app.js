import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));
app.use(cookieParser());

/**
 * - Routes import
 */
import authRoutes from "./routes/auth.route.js";

/**
 * - Routes usage
 */
app.use("/api/auth", authRoutes);

export default app;