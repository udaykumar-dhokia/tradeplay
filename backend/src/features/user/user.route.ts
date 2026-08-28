import express from "express";
import authMiddleware from "../../middlewares/auth.middleware";
import userController from "./user.controller";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: User
 *   description: Current user operations
 */

/**
 * @swagger
 * /api/v1/user/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Current user details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 first_name:
 *                   type: string
 *                 email:
 *                   type: string
 *       401:
 *         description: Unauthorized
 */
router.get("/me", authMiddleware, userController.me);

export default router;
