import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface WishlistItem {
  id: string;
  userId: string;
  symbol: string;
  name: string;
  exchange: string;
  created_at: string;
}

export const wishlistApi = createApi({
  reducerPath: "wishlistApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1/",
    credentials: "include",
  }),
  tagTypes: ["Wishlist", "WishlistStatus"],
  endpoints: (builder) => ({
    getWishlist: builder.query<WishlistItem[], void>({
      query: () => "wishlist",
      providesTags: ["Wishlist"],
    }),
    checkWishlistStatus: builder.query<{ isWishlisted: boolean }, string>({
      query: (symbol) => `wishlist/check/${symbol}`,
      providesTags: (result, error, arg) => [
        { type: "WishlistStatus", id: arg },
      ],
    }),
    addToWishlist: builder.mutation<
      WishlistItem,
      { symbol: string; name: string; exchange: string }
    >({
      query: (data) => ({
        url: "wishlist",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Wishlist", { type: "WishlistStatus", id: "LIST" }],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(
            wishlistApi.util.invalidateTags([
              { type: "WishlistStatus", id: arg.symbol },
            ]),
          );
        } catch {}
      },
    }),
    removeFromWishlist: builder.mutation<{ message: string }, string>({
      query: (symbol) => ({
        url: `wishlist/${symbol}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Wishlist"],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(
            wishlistApi.util.invalidateTags([
              { type: "WishlistStatus", id: arg },
            ]),
          );
        } catch {}
      },
    }),
  }),
});

export const {
  useGetWishlistQuery,
  useCheckWishlistStatusQuery,
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
} = wishlistApi;
