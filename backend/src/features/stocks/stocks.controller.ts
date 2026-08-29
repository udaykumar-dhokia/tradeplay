import type { Request, Response } from "express";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import YahooFinance from "yahoo-finance2";
import fs from "fs";
import path from "path";

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
      const resultsQuotes: any[] = [];
      const lowerQ = q.toLowerCase();

      const NIFTY_50 = [
        { symbol: "RELIANCE.NS", name: "Reliance Industries" },
        { symbol: "TCS.NS", name: "Tata Consultancy Services" },
        { symbol: "HDFCBANK.NS", name: "HDFC Bank" },
        { symbol: "INFY.NS", name: "Infosys" },
        { symbol: "ICICIBANK.NS", name: "ICICI Bank" },
        { symbol: "HINDUNILVR.NS", name: "Hindustan Unilever" },
        { symbol: "SBIN.NS", name: "State Bank of India" },
        { symbol: "BHARTIARTL.NS", name: "Bharti Airtel" },
        { symbol: "ITC.NS", name: "ITC Limited" },
        { symbol: "KOTAKBANK.NS", name: "Kotak Mahindra Bank" },
        { symbol: "LT.NS", name: "Larsen & Toubro" },
        { symbol: "AXISBANK.NS", name: "Axis Bank" },
        { symbol: "BAJFINANCE.NS", name: "Bajaj Finance" },
        { symbol: "ASIANPAINT.NS", name: "Asian Paints" },
        { symbol: "MARUTI.NS", name: "Maruti Suzuki" },
        { symbol: "HCLTECH.NS", name: "HCL Technologies" },
        { symbol: "SUNPHARMA.NS", name: "Sun Pharmaceutical" },
        { symbol: "TITAN.NS", name: "Titan Company" },
        { symbol: "TATAMOTORS.NS", name: "Tata Motors" },
        { symbol: "TATASTEEL.NS", name: "Tata Steel" },
        { symbol: "M&M.NS", name: "Mahindra & Mahindra" },
        { symbol: "WIPRO.NS", name: "Wipro" },
        { symbol: "TECHM.NS", name: "Tech Mahindra" },
        { symbol: "ADANIENT.NS", name: "Adani Enterprises" },
        { symbol: "ADANIPORTS.NS", name: "Adani Ports" },
      ];

      for (const stock of NIFTY_50) {
        if (
          stock.symbol.toLowerCase().includes(lowerQ) ||
          stock.name.toLowerCase().includes(lowerQ)
        ) {
          resultsQuotes.push({
            symbol: stock.symbol,
            quoteType: "EQUITY",
            longname: stock.name,
            shortname: stock.name,
          });
        }
      }

      const searchRes = await this.yahooFinance.search(q, {
        quotesCount: 20,
        newsCount: 0,
        region: "IN",
        lang: "en-IN",
      });
      if (searchRes && searchRes.quotes) {
        resultsQuotes.push(...searchRes.quotes);
      }

      if (
        q.length > 0 &&
        q.length <= 15 &&
        !q.includes(" ") &&
        !q.includes(".")
      ) {
        const nsQuery = q.toUpperCase() + ".NS";
        const boQuery = q.toUpperCase() + ".BO";
        try {
          const quotes = await this.yahooFinance.quote([nsQuery, boQuery]);
          if (quotes && quotes.length > 0) {
            resultsQuotes.push(...quotes);
          }
        } catch (e) {}
      }

      const seen = new Set<string>();

      const stocks = resultsQuotes
        .filter((quote: any) => {
          if (quote.quoteType !== "EQUITY") return false;
          return quote.symbol.endsWith(".NS") || quote.symbol.endsWith(".BO");
        })
        .map((quote: any) => ({
          symbol: quote.symbol,
          name:
            quote.longname ||
            quote.shortname ||
            quote.longName ||
            quote.shortName ||
            quote.symbol,
          exchange: quote.symbol.endsWith(".NS") ? "NSE" : "BSE",
        }))
        .filter((stock: any) => {
          if (seen.has(stock.symbol)) return false;
          seen.add(stock.symbol);
          return true;
        });

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

  /**
   * Retrieves quotes for multiple Indian stocks.
   *
   * @param {Request} req - Express request containing comma-separated symbols
   * @param {Response} res - Express response object
   */
  quotes = async (req: Request, res: Response) => {
    try {
      const symbolsQuery = String(
        req.query.symbols ||
          "RELIANCE.NS,TCS.NS,INFY.NS,HDFCBANK.NS,ICICIBANK.NS",
      );
      const symbols = symbolsQuery
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter((s) => s.endsWith(".NS") || s.endsWith(".BO"));

      if (symbols.length === 0) {
        return res.json([]);
      }

      const results = await this.yahooFinance.quote(symbols);
      const quotes = results.map((q: any) => ({
        symbol: q.symbol,
        name: q.shortName || q.longName || q.symbol,
        price: q.regularMarketPrice,
        change: q.regularMarketChange,
        changePercent: q.regularMarketChangePercent,
      }));

      return res.json(quotes);
    } catch (error) {
      console.error("Stock quotes failed:", error);
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: ReasonPhrases.INTERNAL_SERVER_ERROR });
    }
  };

  /**
   * Retrieves the top gainers and losers from the Nifty 500 universe.
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<Response>} JSON response with top five gainers and losers
   *
   * @description
   * - Reads the Nifty 500 symbol list from disk
   * - Fetches live quote data in batches from Yahoo Finance
   * - Filters out invalid entries without percentage change data
   * - Sorts by percentage change and returns the top five gainers and bottom five losers
   *
   * @throws Returns 500 when the quote fetch or processing fails
   */
  movers = async (req: Request, res: Response) => {
    try {
      const niftyFilePath = path.join(
        process.cwd(),
        "src",
        "features",
        "stocks",
        "nifty500.json",
      );
      const nifty500 = JSON.parse(fs.readFileSync(niftyFilePath, "utf8"));
      const symbols = nifty500.map((s: any) => s.symbol);

      const chunkSize = 100;
      const chunks = [];
      for (let i = 0; i < symbols.length; i += chunkSize) {
        chunks.push(symbols.slice(i, i + chunkSize));
      }

      const quotePromises = chunks.map((chunk) =>
        this.yahooFinance.quote(chunk),
      );
      const chunkedResults = await Promise.all(quotePromises);
      const allQuotes = chunkedResults.flat();

      const validQuotes = allQuotes
        .filter(
          (q: any) =>
            q &&
            q.regularMarketChangePercent !== undefined &&
            q.regularMarketChangePercent !== null,
        )
        .map((q: any) => ({
          symbol: q.symbol,
          name: q.shortName || q.longName || q.symbol,
          price: q.regularMarketPrice,
          change: q.regularMarketChange,
          changePercent: q.regularMarketChangePercent,
        }));

      validQuotes.sort((a: any, b: any) => b.changePercent - a.changePercent);

      const topGainers = validQuotes.slice(0, 5);
      const topLosers = validQuotes.slice(-5).reverse();

      const topSymbols = [...topGainers, ...topLosers].map((s) => s.symbol).join(",");
      let sparkData: any = {};
      try {
        const sparkRes = await fetch(`https://query1.finance.yahoo.com/v8/finance/spark?symbols=${topSymbols}&range=1d&interval=15m`);
        sparkData = await sparkRes.json();
      } catch (e) {
        console.error("Sparkline fetch failed:", e);
      }

      const attachSpark = (stock: any) => {
        const spark = sparkData[stock.symbol];
        if (spark && spark.close) {
          // Some values might be null if no trades happened, filter them out or replace with previous close
          stock.sparkline = spark.close.filter((c: any) => c !== null);
        } else {
          stock.sparkline = [];
        }
        return stock;
      };

      return res.json({
        gainers: topGainers.map(attachSpark),
        losers: topLosers.map(attachSpark),
      });
    } catch (error) {
      console.error("Stock movers failed:", error);
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: ReasonPhrases.INTERNAL_SERVER_ERROR });
    }
  };
}

export default new StocksController();
