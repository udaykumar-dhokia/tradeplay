import express from "express";
import authMiddleware from "../middlewares/auth.middleware";
import userController from "./user.controller";

const router = express.Router();

router.get("/me", authMiddleware, userController.me);

export default router;
