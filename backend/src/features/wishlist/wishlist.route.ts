import { Router } from "express";
import wishlistController from "./wishlist.controller";
import authMiddleware from "../../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Wishlist
 *   description: User wishlist management
 */

/**
 * @swagger
 * /api/v1/wishlist:
 *   get:
 *     summary: Get the authenticated user's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Wishlist items retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   userId:
 *                     type: string
 *                   symbol:
 *                     type: string
 *                   name:
 *                     type: string
 *                   exchange:
 *                     type: string
 *       401:
 *         description: Unauthorized
 */
router.get("/", authMiddleware, wishlistController.getWishlist);

/**
 * @swagger
 * /api/v1/wishlist:
 *   post:
 *     summary: Add a stock to the authenticated user's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [symbol, name, exchange]
 *             properties:
 *               symbol:
 *                 type: string
 *                 example: TCS.NS
 *               name:
 *                 type: string
 *                 example: Tata Consultancy Services
 *               exchange:
 *                 type: string
 *                 example: NSE
 *     responses:
 *       201:
 *         description: Stock added to wishlist
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Stock already exists in wishlist
 */
router.post("/", authMiddleware, wishlistController.addToWishlist);

/**
 * @swagger
 * /api/v1/wishlist/{symbol}:
 *   delete:
 *     summary: Remove a stock from the authenticated user's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: Stock symbol to remove from the wishlist
 *     responses:
 *       200:
 *         description: Stock removed from wishlist
 *       400:
 *         description: Symbol is required
 *       401:
 *         description: Unauthorized
 */
router.delete(
  "/:symbol",
  authMiddleware,
  wishlistController.removeFromWishlist,
);

/**
 * @swagger
 * /api/v1/wishlist/check/{symbol}:
 *   get:
 *     summary: Check whether a stock is in the authenticated user's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: Stock symbol to check
 *     responses:
 *       200:
 *         description: Wishlist status returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isWishlisted:
 *                   type: boolean
 *       400:
 *         description: Symbol is required
 *       401:
 *         description: Unauthorized
 */
router.get("/check/:symbol", authMiddleware, wishlistController.checkStatus);

export default router;
