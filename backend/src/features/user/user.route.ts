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

/**
 * @swagger
 * /api/v1/user/profile:
 *   patch:
 *     summary: Update user profile
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               mobile:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.patch("/profile", authMiddleware, userController.updateProfile);

/**
 * @swagger
 * /api/v1/user/password:
 *   patch:
 *     summary: Change user password
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [current_password, new_password]
 *             properties:
 *               current_password:
 *                 type: string
 *               new_password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.patch("/password", authMiddleware, userController.changePassword);

/**
 * @swagger
 * /api/v1/user/settings:
 *   get:
 *     summary: Get user settings
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User settings
 *       401:
 *         description: Unauthorized
 *   patch:
 *     summary: Update user settings
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               default_mode:
 *                 type: string
 *                 enum: [NORMAL, ADVANCED]
 *               theme:
 *                 type: string
 *                 enum: [LIGHT, DARK, SYSTEM]
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.get("/settings", authMiddleware, userController.getSettings);
router.patch("/settings", authMiddleware, userController.updateSettings);

export default router;

