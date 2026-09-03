import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface StockSearchResult {
  symbol: string;
  name: string;
  exchange: string;
}

export interface StockMover {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  sparkline?: number[];
}

export interface MoversResponse {
  gainers: StockMover[];
  losers: StockMover[];
}

export interface StockHistoryRequest {
  symbol: string;
  range: string;
  interval: string;
}

export interface StockCandle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockHistoryResponse {
  symbol: string;
  candles: StockCandle[];
}

export const stocksApi = createApi({
  reducerPath: "stocksApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1/",
  }),
  endpoints: (builder) => ({
    searchStocks: builder.query<StockSearchResult[], string>({
      query: (q) => `stocks/search?q=${encodeURIComponent(q)}`,
    }),
    getTopMovers: builder.query<MoversResponse, void>({
      query: () => `stocks/movers`,
    }),
    getStockHistory: builder.query<StockHistoryResponse, StockHistoryRequest>({
      query: ({ symbol, range, interval }) => `stocks/history?symbol=${symbol}&range=${range}&interval=${interval}`,
    }),
    getStockDetails: builder.query<any, string>({
      query: (symbol) => `stocks/${symbol}/details`,
    }),
    getSimilarStocks: builder.query<StockMover[], string>({
      query: (symbol) => `stocks/${symbol}/similar`,
    }),
    getQuotes: builder.query<StockMover[], string>({
      query: (symbols) => `stocks/quotes?symbols=${symbols}`,
    }),
  }),
});

export const { 
  useSearchStocksQuery, 
  useLazySearchStocksQuery, 
  useGetTopMoversQuery,
  useGetStockHistoryQuery,
  useGetStockDetailsQuery,
  useGetSimilarStocksQuery,
  useGetQuotesQuery
} = stocksApi;

