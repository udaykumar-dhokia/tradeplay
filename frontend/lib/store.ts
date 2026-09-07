import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "./features/auth/authApi";
import authReducer from "./features/auth/authSlice";
import { portfolioApi } from "./features/portfolio/portfolioApi";
import portfolioReducer from "./features/portfolio/portfolioSlice";
import { stocksApi } from "./features/stocks/stocksApi";
import { transactionsApi } from "./features/transactions/transactionsApi";
import { wishlistApi } from "./features/wishlist/wishlistApi";
import { marketApi } from "./features/market/marketApi";
import uiReducer from "./features/ui/uiSlice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      portfolio: portfolioReducer,
      ui: uiReducer,
      [authApi.reducerPath]: authApi.reducer,
      [portfolioApi.reducerPath]: portfolioApi.reducer,
      [stocksApi.reducerPath]: stocksApi.reducer,
      [transactionsApi.reducerPath]: transactionsApi.reducer,
      [wishlistApi.reducerPath]: wishlistApi.reducer,
      [marketApi.reducerPath]: marketApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(
        authApi.middleware, 
        portfolioApi.middleware, 
        stocksApi.middleware,
        transactionsApi.middleware,
        wishlistApi.middleware,
        marketApi.middleware
      ),
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
