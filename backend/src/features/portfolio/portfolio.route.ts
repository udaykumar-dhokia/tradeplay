import express from "express";
import authMiddleware from "../../middlewares/auth.middleware";
import portfolioController from "./portfolio.controller";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Portfolio
 *   description: Portfolio balances and management
 */

/**
 * @swagger
 * /api/v1/portfolio/current-balance:
 *   get:
 *     summary: Get current balance
 *     tags: [Portfolio]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User's current balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 current_balance:
 *                   type: string
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/current-balance",
  authMiddleware,
  portfolioController.getCurrentBalance,
);

/**
 * @swagger
 * /api/v1/portfolio/original-balance:
 *   get:
 *     summary: Get original balance
 *     tags: [Portfolio]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User's original balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 original_balance:
 *                   type: string
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/original-balance",
  authMiddleware,
  portfolioController.getOriginalBalance,
);

export default router;
