import type { Request, Response } from "express";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import YahooFinance from "yahoo-finance2";

/**
 * StocksController
 * Handles stock search requests using Yahoo Finance market data.
 */
class StocksController {
  private yahooFinance: any;

  constructor() {
    this.yahooFinance = new YahooFinance();
  }

  /**
   * Searches for Indian equities matching the requested query.
   *
   * @param {Request<{}, {}, { query: string }>} req - Express request containing the search query
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response containing matching stocks or an error message
   *
   * @description
   * - Trims the query and returns an empty list when it is missing
   * - Searches Yahoo Finance for up to 20 matching quotes
   * - Filters results to equity symbols listed on NSE or BSE
   * - Returns each stock's symbol, name, and exchange
   *
   * @throws Returns 500 when the Yahoo Finance search fails
   */
  search = async (req: Request<{}, {}, { query: string }>, res: Response) => {
    const q = String(req.query.q || "").trim();
    if (!q) return res.json([]);

    try {
      const results = await this.yahooFinance.search(q, {
        quotesCount: 20,
        newsCount: 0,
        region: "IN",
        lang: "en-IN",
      });

      const stocks = results.quotes
        .filter((quote: any) => {
          if (quote.quoteType !== "EQUITY") {
            return false;
          }
          return quote.symbol.endsWith(".NS") || quote.symbol.endsWith(".BO");
        })
        .map((quote: any) => ({
          symbol: quote.symbol,
          name: quote.longname || quote.shortname,
          exchange: quote.symbol.endsWith(".NS") ? "NSE" : "BSE",
        }));

      return res.json(stocks);
    } catch (error) {
      console.error("Stock search failed:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
      });
    }
  };
}

export default new StocksController();
