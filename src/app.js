import express from "express";
import morgan from "morgan";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));

/**
 * - Routes import
 */
import authRoutes from "./routes/auth.route.js";

/**
 * - Routes usage
 */
app.use("/api/auth", authRoutes);

export default app;