"use client";

import { useGetCurrentUserQuery } from "@/lib/features/auth/authApi";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useAppDispatch } from "@/lib/hooks";
import { setAdvancedMode } from "@/lib/features/ui/uiSlice";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, isError } = useGetCurrentUserQuery({});
  const router = useRouter();
  const { setTheme } = useTheme();
  const dispatch = useAppDispatch();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!isLoading && (isError || !user)) {
      router.push("/login");
    }
  }, [isLoading, isError, user, router]);

  useEffect(() => {
    if (user?.settings && !initializedRef.current) {
      initializedRef.current = true;
      if (user.settings.theme) {
        setTheme(user.settings.theme.toLowerCase());
      }
      if (user.settings.default_mode) {
        dispatch(setAdvancedMode(user.settings.default_mode === "ADVANCED"));
      }
    }
  }, [user, setTheme, dispatch]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <svg
          className="animate-spin h-8 w-8 text-primary"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (isError || !user) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}

