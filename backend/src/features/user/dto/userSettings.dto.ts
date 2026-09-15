export type TTradingMode = "NORMAL" | "ADVANCED";
export type TThemeMode = "LIGHT" | "DARK" | "SYSTEM";

export type TUserSettings = {
  id: string;
  userId: string;
  default_mode: TTradingMode;
  theme: TThemeMode;
  created_at: Date;
  updated_at: Date;
};

export type TUpdateUserSettings = {
  default_mode?: TTradingMode;
  theme?: TThemeMode;
};
