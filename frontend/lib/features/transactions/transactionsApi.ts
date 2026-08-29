import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const transactionsApi = createApi({
  reducerPath: "transactionsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1/",
    credentials: "include",
  }),
  endpoints: (builder) => ({
    getPositions: builder.query<{ positions: any[] }, void>({
      query: () => "/transactions/positions",
    }),
    getTransactions: builder.query<
      { transactions: any[]; totalCount: number },
      { limit?: number; offset?: number }
    >({
      query: ({ limit = 10, offset = 0 }) =>
        `/transactions?limit=${limit}&offset=${offset}`,
    }),
    executeTrade: builder.mutation<
      any,
      {
        symbol: string;
        name: string;
        exchange: string;
        type: "BUY" | "SELL";
        quantity: number;
        price: number;
      }
    >({
      query: (body) => ({
        url: "/transactions/trade",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useGetPositionsQuery,
  useGetTransactionsQuery,
  useExecuteTradeMutation,
} = transactionsApi;
