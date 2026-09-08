import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { portfolioApi } from "../portfolio/portfolioApi";

export const transactionsApi = createApi({
  reducerPath: "transactionsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1/",
    credentials: "include",
  }),
  tagTypes: ["Positions", "Transactions"],
  endpoints: (builder) => ({
    getPositions: builder.query<{ positions: any[] }, void>({
      query: () => "/transactions/positions",
      providesTags: ["Positions"],
    }),
    getTransactions: builder.query<
      { transactions: any[]; totalCount: number },
      { limit?: number; offset?: number }
    >({
      query: ({ limit = 10, offset = 0 }) =>
        `/transactions?limit=${limit}&offset=${offset}`,
      providesTags: ["Transactions"],
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
      invalidatesTags: ["Positions", "Transactions"],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(portfolioApi.util.invalidateTags(["Portfolio"]));
        } catch {}
      }
    }),
  }),
});

export const {
  useGetPositionsQuery,
  useGetTransactionsQuery,
  useExecuteTradeMutation,
} = transactionsApi;
