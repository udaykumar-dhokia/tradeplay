import { Router } from "express";
import MarketController from "./market.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Market
 *   description: Indian market status and trading session details
 */

/**
 * @swagger
 * /api/v1/market/status:
 *   get:
 *     summary: Get the current Indian market status
 *     tags: [Market]
 *     responses:
 *       200:
 *         description: Market status fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [OPEN, PRE_OPEN, CLOSED]
 *                 rawState:
 *                   type: string
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error
 */
router.get("/status", MarketController.status);

export default router;
