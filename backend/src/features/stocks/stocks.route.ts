import express from "express";
import stocksController from "./stocks.controller";

const router = express.Router();

router.get("/search", stocksController.search);
router.get("/history", stocksController.history);

export default router;
