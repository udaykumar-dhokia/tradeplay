import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface MarketStatusResponse {
  status: "OPEN" | "PRE_OPEN" | "CLOSED";
  rawState: string;
  message: string;
}

export const marketApi = createApi({
  reducerPath: "marketApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1/",
    credentials: "include",
  }),
  endpoints: (builder) => ({
    getMarketStatus: builder.query<MarketStatusResponse, void>({
      query: () => "/market/status",
    }),
  }),
});

export const { useGetMarketStatusQuery } = marketApi;
