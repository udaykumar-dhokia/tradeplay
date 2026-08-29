import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const portfolioApi = createApi({
  reducerPath: "portfolioApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1/",
    credentials: "include",
  }),
  endpoints: (builder) => ({
    getCurrentBalance: builder.query<{ current_balance: string }, void>({
      query: () => "/portfolio/current-balance",
    }),
    getOriginalBalance: builder.query<{ original_balance: string }, void>({
      query: () => "/portfolio/original-balance",
    }),
  }),
});

export const { useGetCurrentBalanceQuery, useGetOriginalBalanceQuery } =
  portfolioApi;
