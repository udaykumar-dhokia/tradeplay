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
  }),
});

export const { useSearchStocksQuery, useLazySearchStocksQuery, useGetTopMoversQuery } = stocksApi;

