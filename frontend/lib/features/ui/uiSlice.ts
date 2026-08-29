import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  advancedMode: boolean;
}

const initialState: UiState = {
  advancedMode: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleAdvancedMode: (state) => {
      state.advancedMode = !state.advancedMode;
    },
    setAdvancedMode: (state, action: PayloadAction<boolean>) => {
      state.advancedMode = action.payload;
    },
  },
});

export const { toggleAdvancedMode, setAdvancedMode } = uiSlice.actions;
export default uiSlice.reducer;
