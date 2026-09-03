import "dotenv/config";
import express, { type Request, type Response } from "express";
import cors from "cors";
import http from "http";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { ReasonPhrases, StatusCodes } from "http-status-codes";

import AuthRoutes from "./features/auth/auth.route";
import UserRoutes from "./features/user/user.route";
import StocksRoutes from "./features/stocks/stocks.route";
import PortfolioRoutes from "./features/portfolio/portfolio.route";
import TransactionsRoutes from "./features/transactions/transactions.route";
import WishlistRoutes from "./features/wishlist/wishlist.route";
import { createOpenApiDocument, mountApiRouter } from "./lib/swagger";

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  }),
);
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
  return res.status(StatusCodes.OK).json({ message: ReasonPhrases.OK });
});
mountApiRouter(app, "/api/v1/auth", AuthRoutes);
mountApiRouter(app, "/api/v1/user", UserRoutes);
mountApiRouter(app, "/api/v1/stocks", StocksRoutes);
mountApiRouter(app, "/api/v1/portfolio", PortfolioRoutes);
mountApiRouter(app, "/api/v1/transactions", TransactionsRoutes);
mountApiRouter(app, "/api/v1/wishlist", WishlistRoutes);
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(createOpenApiDocument(app)),
);

server.listen(PORT, () => {
  console.log(`Server is up and running at ${PORT}`);
});
