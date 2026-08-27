import type { Request, Response } from "express";
import PortfolioService from "./portfolio.service";
import { ReasonPhrases, StatusCodes } from "http-status-codes";

/**
 * PortfolioController
 * Handles HTTP requests for the authenticated user's portfolio data.
 */
class PortfolioController {
  private portfolio: PortfolioService;

  constructor() {
    this.portfolio = new PortfolioService();
  }

  /**
   * Returns the current balance for the authenticated user.
   *
   * @param {Request} req - Express request object containing the authenticated user
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response containing the current balance or an error message
   *
   * @description
   * - Checks whether an authenticated user is attached to the request
   * - Retrieves the user's current balance from the portfolio service
   * - Serializes the balance as a string in the response
   *
   * @throws Returns 401 when no authenticated user is present
   * @throws Returns 404 when the current balance cannot be found
   * @throws Returns 500 when retrieving the balance fails
   */
  getCurrentBalance = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: ReasonPhrases.UNAUTHORIZED });
    }

    try {
      const current_balance = await this.portfolio.current_balance(user.id);
      if (!current_balance) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json({ message: ReasonPhrases.NOT_FOUND });
      }

      return res
        .status(StatusCodes.OK)
        .json({ current_balance: current_balance.toString() });
    } catch (e) {
      console.log(e);
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: ReasonPhrases.INTERNAL_SERVER_ERROR });
    }
  };

  /**
   * Returns the original balance for the authenticated user.
   *
   * @param {Request} req - Express request object containing the authenticated user
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response containing the original balance or an error message
   *
   * @description
   * - Checks whether an authenticated user is attached to the request
   * - Retrieves the user's original balance from the portfolio service
   * - Serializes the balance as a string in the response
   *
   * @throws Returns 401 when no authenticated user is present
   * @throws Returns 404 when the original balance cannot be found
   * @throws Returns 500 when retrieving the balance fails
   */
  getOriginalBalance = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: ReasonPhrases.UNAUTHORIZED });
    }

    try {
      const original_balance = await this.portfolio.original_balance(user.id);
      if (!original_balance) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json({ message: ReasonPhrases.NOT_FOUND });
      }

      return res
        .status(StatusCodes.OK)
        .json({ original_balance: original_balance.toString() });
    } catch (e) {
      console.log(e);
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: ReasonPhrases.INTERNAL_SERVER_ERROR });
    }
  };
}

export default new PortfolioController();
