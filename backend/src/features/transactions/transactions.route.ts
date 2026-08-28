import express from "express";
import authMiddleware from "../../middlewares/auth.middleware";
import transactionsController from "./transactions.controller";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Trade execution and transaction history
 */

/**
 * @swagger
 * /api/v1/transactions/trade:
 *   post:
 *     summary: Execute a BUY or SELL trade
 *     tags: [Transactions]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [symbol, name, exchange, type, quantity, price]
 *             properties:
 *               symbol:
 *                 type: string
 *               name:
 *                 type: string
 *               exchange:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [BUY, SELL]
 *               quantity:
 *                 type: integer
 *               price:
 *                 type: number
 *     responses:
 *       201:
 *         description: Trade executed successfully
 *       400:
 *         description: Bad request (Insufficient balance, shares, etc)
 *       401:
 *         description: Unauthorized
 */
router.post("/trade", authMiddleware, transactionsController.trade);

/**
 * @swagger
 * /api/v1/transactions:
 *   get:
 *     summary: Get transaction history
 *     tags: [Transactions]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Limit the number of transactions returned
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Offset for pagination
 *     responses:
 *       200:
 *         description: A list of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactions:
 *                   type: array
 *                   items:
 *                     type: object
 *                 totalCount:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 */
router.get("/", authMiddleware, transactionsController.getTransactions);

/**
 * @swagger
 * /api/v1/transactions/positions:
 *   get:
 *     summary: Get open positions
 *     tags: [Transactions]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: A list of open positions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 positions:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 */
router.get("/positions", authMiddleware, transactionsController.getPositions);

export default router;
