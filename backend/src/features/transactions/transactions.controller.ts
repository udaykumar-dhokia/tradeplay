import type { Request, Response } from "express";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import TransactionsService from "./transactions.service";

/**
 * TransactionsController
 * Handles trade execution and retrieval of the authenticated user's transactions and positions.
 */
class TransactionsController {
  private service: TransactionsService;

  constructor() {
    this.service = new TransactionsService();
  }

  /**
   * Executes a buy or sell trade for the authenticated user.
   *
   * @param {Request} req - Express request containing trade details in the request body
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response containing the executed transaction or an error message
   *
   * @description
   * - Checks whether an authenticated user is attached to the request
   * - Validates required trade fields and trade type
   * - Validates that quantity and price are greater than zero
   * - Executes the trade through the transactions service
   *
   * @throws Returns 401 when no authenticated user is present
   * @throws Returns 400 when trade data is invalid or funds/shares are insufficient
   * @throws Returns 500 when trade execution fails unexpectedly
   */
  trade = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: ReasonPhrases.UNAUTHORIZED });
    }

    const { symbol, name, exchange, type, quantity, price, positionId } = req.body;

    if (!symbol || !name || !exchange || !type || !quantity || !price) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Missing required fields" });
    }
    if (type !== "BUY" && type !== "SELL") {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Invalid trade type" });
    }
    if (quantity <= 0 || price <= 0) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Quantity and price must be greater than 0" });
    }

    try {
      const transaction = await this.service.trade(user.id, {
        symbol,
        name,
        exchange,
        type,
        quantity,
        price,
        positionId,
      });

      return res.status(StatusCodes.CREATED).json({
        message: "Trade executed successfully",
        transaction,
      });
    } catch (e: any) {
      console.error("[Trade Error]", e.message);
      if (
        e.message === "Insufficient balance" ||
        e.message === "Insufficient shares to sell" ||
        e.message === "Insufficient shares in this position to sell" ||
        e.message?.includes("Insufficient")
      ) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: e.message });
      }
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: ReasonPhrases.INTERNAL_SERVER_ERROR });
    }
  };

  /**
   * Retrieves all transactions for the authenticated user.
   *
   * @param {Request} req - Express request object containing the authenticated user
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response containing the user's transactions
   *
   * @throws Returns 401 when no authenticated user is present
   * @throws Returns 500 when transactions cannot be retrieved
   */
  getTransactions = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: ReasonPhrases.UNAUTHORIZED });
    }

    const limit = parseInt(req.query.limit as string, 10) || 20;
    const offset = parseInt(req.query.offset as string, 10) || 0;

    try {
      const data = await this.service.getTransactions(user.id, limit, offset);
      return res.status(StatusCodes.OK).json(data);
    } catch (e) {
      console.error("[Get Transactions Error]", e);
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: ReasonPhrases.INTERNAL_SERVER_ERROR });
    }
  };

  /**
   * Retrieves the current positions for the authenticated user.
   *
   * @param {Request} req - Express request object containing the authenticated user
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response containing the user's positions
   *
   * @throws Returns 401 when no authenticated user is present
   * @throws Returns 500 when positions cannot be retrieved
   */
  getPositions = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: ReasonPhrases.UNAUTHORIZED });
    }

    try {
      const positions = await this.service.getPositions(user.id);
      return res.status(StatusCodes.OK).json({ positions });
    } catch (e) {
      console.error("[Get Positions Error]", e);
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: ReasonPhrases.INTERNAL_SERVER_ERROR });
    }
  };
}

export default new TransactionsController();
