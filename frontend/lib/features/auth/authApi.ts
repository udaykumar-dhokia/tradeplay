import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface UserSettings {
  id: string;
  userId: string;
  default_mode: "NORMAL" | "ADVANCED";
  theme: "LIGHT" | "DARK" | "SYSTEM";
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string | null;
  mobile: string | null;
  settings?: UserSettings | null;
}

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1/",
    credentials: "include",
  }),
  tagTypes: ["User", "Settings"],
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["User", "Settings"],
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: "/auth/register",
        method: "POST",
        body: userData,
      }),
    }),
    getCurrentUser: builder.query<UserProfile, any>({
      query: () => "user/me",
      providesTags: ["User"],
    }),
    updateProfile: builder.mutation<
      UserProfile,
      { first_name?: string; last_name?: string | null; mobile?: string | null }
    >({
      query: (data) => ({
        url: "user/profile",
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),
    changePassword: builder.mutation<
      { message: string },
      { current_password: string; new_password: string }
    >({
      query: (data) => ({
        url: "user/password",
        method: "PATCH",
        body: data,
      }),
    }),
    getSettings: builder.query<UserSettings, void>({
      query: () => "user/settings",
      providesTags: ["Settings"],
    }),
    updateSettings: builder.mutation<
      UserSettings,
      { default_mode?: "NORMAL" | "ADVANCED"; theme?: "LIGHT" | "DARK" | "SYSTEM" }
    >({
      query: (data) => ({
        url: "user/settings",
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Settings", "User"],
    }),
    logout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["User", "Settings"],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetCurrentUserQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useLogoutMutation,
} = authApi;
