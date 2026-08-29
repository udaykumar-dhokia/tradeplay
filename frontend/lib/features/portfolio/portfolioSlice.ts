import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface PortfolioState {
  currentBalance: string | null;
  originalBalance: string | null;
}

const initialState: PortfolioState = {
  currentBalance: null,
  originalBalance: null,
};

const portfolioSlice = createSlice({
  name: "portfolio",
  initialState,
  reducers: {
    setCurrentBalance: (state, action: PayloadAction<string>) => {
      state.currentBalance = action.payload;
    },
    setOriginalBalance: (state, action: PayloadAction<string>) => {
      state.originalBalance = action.payload;
    },
  },
});

export const { setCurrentBalance, setOriginalBalance } = portfolioSlice.actions;
export default portfolioSlice.reducer;
