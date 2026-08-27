import express from "express";
import stocksController from "./stocks.controller";

const router = express.Router();

router.get("/search", stocksController.search);

export default router;
