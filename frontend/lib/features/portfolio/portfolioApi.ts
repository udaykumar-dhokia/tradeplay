import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const portfolioApi = createApi({
  reducerPath: "portfolioApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1/",
    credentials: "include",
  }),
  tagTypes: ["Portfolio"],
  endpoints: (builder) => ({
    getCurrentBalance: builder.query<{ current_balance: string }, void>({
      query: () => "/portfolio/current-balance",
      providesTags: ["Portfolio"],
    }),
    getOriginalBalance: builder.query<{ original_balance: string }, void>({
      query: () => "/portfolio/original-balance",
      providesTags: ["Portfolio"],
    }),
  }),
});

export const { useGetCurrentBalanceQuery, useGetOriginalBalanceQuery } =
  portfolioApi;
