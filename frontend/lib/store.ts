import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "./features/auth/authApi";
import authReducer from "./features/auth/authSlice";
import { portfolioApi } from "./features/portfolio/portfolioApi";
import portfolioReducer from "./features/portfolio/portfolioSlice";
import { stocksApi } from "./features/stocks/stocksApi";

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      portfolio: portfolioReducer,
      [authApi.reducerPath]: authApi.reducer,
      [portfolioApi.reducerPath]: portfolioApi.reducer,
      [stocksApi.reducerPath]: stocksApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(authApi.middleware, portfolioApi.middleware, stocksApi.middleware),
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
