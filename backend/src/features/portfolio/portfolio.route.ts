import express from "express";
import authMiddleware from "../../middlewares/auth.middleware";
import portfolioController from "./portfolio.controller";

const router = express.Router();

router.get(
  "/current-balance",
  authMiddleware,
  portfolioController.getCurrentBalance,
);
router.get(
  "/original-balance",
  authMiddleware,
  portfolioController.getOriginalBalance,
);

export default router;
