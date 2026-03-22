import { Router } from "express";
import { register, login, getUser, refreshToken, logout, logoutAll } from "../controllers/auth.controller.js";

const router = Router();

/* POST /api/auth/register */
router.route("/register").post(register);

/* POST /api/auth/login */
router.route("/login").post(login);

/* GET /api/auth/get-user */
router.route("/get-user").get(getUser);

/* GET /api/auth/refresh-token */
router.route("/refresh-token").get(refreshToken);

/* POST /api/auth/logout */
router.route("/logout").post(logout);

/* POST /api/auth/logout-all */
router.route("/logout-all").post(logoutAll);

export default router;