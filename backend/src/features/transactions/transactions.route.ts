import express from "express";
import authMiddleware from "../../middlewares/auth.middleware";
import transactionsController from "./transactions.controller";

const router = express.Router();

router.post("/trade", authMiddleware, transactionsController.trade);
router.get("/", authMiddleware, transactionsController.getTransactions);
router.get("/positions", authMiddleware, transactionsController.getPositions);

export default router;
