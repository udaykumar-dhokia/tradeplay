import type { Request, Response } from "express";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import YahooFinance from "yahoo-finance2";

/**
 * MarketController
 * Handles Indian market status requests.
 */
class MarketController {
  private yahooFinance: any;

  constructor() {
    this.yahooFinance = new YahooFinance();
  }

  /**
   * Retrieves the current trading status of the Indian stock market.
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response containing the market status and raw Yahoo Finance state
   *
   * @description
   * - Calls the Yahoo Finance API for the NSE index
   * - Maps the raw market state into a simplified status value
   * - Returns OPEN, PRE_OPEN, or CLOSED based on the current market session state
   *
   * @throws Returns 500 when the market status lookup fails
   */
  status = async (req: Request, res: Response) => {
    try {
      const quote = await this.yahooFinance.quote("^NSEI");
      const rawState = quote.marketState;

      let status = "CLOSED";
      if (rawState === "REGULAR") {
        status = "OPEN";
      } else if (rawState === "PRE" || rawState === "PREPRE") {
        status = "PRE_OPEN";
      }

      return res.status(StatusCodes.OK).json({
        status,
        rawState,
        message: "Market status fetched successfully.",
      });
    } catch (error) {
      console.error("Market status fetch failed:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
      });
    }
  };
}

export default new MarketController();
