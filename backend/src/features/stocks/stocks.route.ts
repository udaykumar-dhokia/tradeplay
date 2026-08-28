import express from "express";
import stocksController from "./stocks.controller";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Stocks
 *   description: Stock market data (Yahoo Finance)
 */

/**
 * @swagger
 * /api/v1/stocks/search:
 *   get:
 *     summary: Search for Indian stocks
 *     tags: [Stocks]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Search query (e.g. TCS)
 *     responses:
 *       200:
 *         description: A list of matching Indian stocks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   symbol:
 *                     type: string
 *                   name:
 *                     type: string
 *                   exchange:
 *                     type: string
 */
router.get("/search", stocksController.search);

/**
 * @swagger
 * /api/v1/stocks/history:
 *   get:
 *     summary: Get historical chart data for a stock
 *     tags: [Stocks]
 *     parameters:
 *       - in: query
 *         name: symbol
 *         schema:
 *           type: string
 *         required: true
 *         description: Stock symbol (e.g. TCS.NS)
 *       - in: query
 *         name: range
 *         schema:
 *           type: string
 *           default: 1y
 *         description: Date range (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, max)
 *       - in: query
 *         name: interval
 *         schema:
 *           type: string
 *           default: 1d
 *         description: Data interval (1d, 1wk, 1mo)
 *     responses:
 *       200:
 *         description: Candlestick chart data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 symbol:
 *                   type: string
 *                 candles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       time:
 *                         type: string
 *                       open:
 *                         type: number
 *                       high:
 *                         type: number
 *                       low:
 *                         type: number
 *                       close:
 *                         type: number
 *                       volume:
 *                         type: integer
 */
router.get("/history", stocksController.history);

/**
 * @swagger
 * /api/v1/stocks/quotes:
 *   get:
 *     summary: Get live quotes for predefined stocks
 *     tags: [Stocks]
 *     parameters:
 *       - in: query
 *         name: symbols
 *         schema:
 *           type: string
 *         description: Comma-separated list of symbols (e.g. RELIANCE.NS,TCS.NS)
 *     responses:
 *       200:
 *         description: Live quotes data
 */
router.get("/quotes", stocksController.quotes);

export default router;
