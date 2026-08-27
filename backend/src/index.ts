import "dotenv/config";
import express, { type Request, type Response } from "express";
import cors from "cors";
import http from "http";
import cookieParser from "cookie-parser";
import { ReasonPhrases, StatusCodes } from "http-status-codes";

import AuthRoutes from "./features/auth/auth.route";
import UserRoutes from "./features/user/user.route";
import StocksRoutes from "./features/stocks/stocks.route";
import PortfolioRoutes from "./features/portfolio/portfolio.route";
import TransactionsRoutes from "./features/transactions/transactions.route";

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
  return res.status(StatusCodes.OK).json({ message: ReasonPhrases.OK });
});
app.use("/api/v1/auth", AuthRoutes);
app.use("/api/v1/user", UserRoutes);
app.use("/api/v1/stocks", StocksRoutes);
app.use("/api/v1/portfolio", PortfolioRoutes);
app.use("/api/v1/transactions", TransactionsRoutes);

server.listen(PORT, () => {
  console.log(`Server is up and running at ${PORT}`);
});
