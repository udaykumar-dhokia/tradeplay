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

  /**
   * Retrieves historical price data for an Indian stock.
   *
   * @param {Request} req - Express request containing the symbol, range, and interval query parameters
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response containing the symbol and historical candle data
   *
   * @description
   * - Uses `RELIANCE.NS`, `1y`, and `1d` as default symbol, range, and interval values
   * - Validates that the symbol belongs to an NSE or BSE-listed Indian stock
   * - Retrieves historical quotes from Yahoo Finance
   * - Filters incomplete quotes and formats OHLCV candle data
   * - Removes duplicate dates and sorts the candles chronologically
   *
   * @throws Returns 400 when the symbol is not an NSE or BSE stock
   * @throws Returns 404 when no historical data is found
   * @throws Returns 500 when the Yahoo Finance request fails
   */
  history = async (req: Request, res: Response) => {
    try {
      const symbol = String(req.query.symbol || "RELIANCE.NS").toUpperCase();

      if (!symbol.endsWith(".NS") && !symbol.endsWith(".BO")) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: "Only Indian stocks (.NS or .BO) are supported",
        });
      }
      const range = String(req.query.range || "1y");
      const interval = String(req.query.interval || "1d");

      const now = new Date();
      const rangeMap: Record<string, Date> = {
        "1d": new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        "5d": new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        "1mo": new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000),
        "3mo": new Date(now.getTime() - 95 * 24 * 60 * 60 * 1000),
        "6mo": new Date(now.getTime() - 185 * 24 * 60 * 60 * 1000),
        "1y": new Date(now.getTime() - 366 * 24 * 60 * 60 * 1000),
        "2y": new Date(now.getTime() - 2 * 366 * 24 * 60 * 60 * 1000),
        "5y": new Date(now.getTime() - 5 * 366 * 24 * 60 * 60 * 1000),
        max: new Date("2000-01-01"),
      };

      const period1 = (rangeMap[range] || rangeMap["1y"]!)
        .toISOString()
        .split("T")[0];

      const result = await this.yahooFinance.chart(symbol, {
        period1,
        interval,
      });

      if (!result || !result.quotes) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json({ message: "No history found for the given symbol" });
      }

      const quotes = result.quotes.filter(
        (c: any) =>
          c.open !== null &&
          c.high !== null &&
          c.low !== null &&
          c.close !== null,
      );

      const candles = quotes.map((c: any) => ({
        time: c.date.toISOString().split("T")[0],
        open: parseFloat(c.open.toFixed(4)),
        high: parseFloat(c.high.toFixed(4)),
        low: parseFloat(c.low.toFixed(4)),
        close: parseFloat(c.close.toFixed(4)),
        volume: c.volume || 0,
      }));

      const seen = new Map();
      for (const c of candles) seen.set(c.time, c);
      const deduped = Array.from(seen.values()).sort((a: any, b: any) =>
        a.time.localeCompare(b.time),
      );

      return res.json({ symbol, candles: deduped });
    } catch {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: ReasonPhrases.INTERNAL_SERVER_ERROR });
    }
  };
}

export default new StocksController();
