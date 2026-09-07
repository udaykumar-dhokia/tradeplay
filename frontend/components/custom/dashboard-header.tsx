"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  useGetCurrentBalanceQuery,
  useGetOriginalBalanceQuery,
} from "@/lib/features/portfolio/portfolioApi";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUp01Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { StockSearch } from "@/components/custom/stock-search";
import { MarketStatusBadge } from "@/components/custom/MarketStatusBadge";

export const DashboardHeader = () => {
  const { data: currentData, isLoading: isCurrentLoading } =
    useGetCurrentBalanceQuery();
  const { data: originalData, isLoading: isOriginalLoading } =
    useGetOriginalBalanceQuery();

  const currentBalance = parseFloat(currentData?.current_balance || "0");
  const originalBalance = parseFloat(originalData?.original_balance || "0");

  const diff = currentBalance - originalBalance;
  const isPositive = diff >= 0;
  const percentChange =
    originalBalance > 0 ? (diff / originalBalance) * 100 : 0;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "INR",
    }).format(val);
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-15 lg:px-6 justify-between w-full">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <h1 className="text-lg font-semibold md:hidden">TradePlay</h1>
      </div>

      <div className="flex-1 flex justify-center px-4 max-w-xl mx-auto hidden md:flex">
        <StockSearch className="max-w-md" />
      </div>

      <div className="flex items-center gap-6 text-sm">
        <div className="hidden sm:block">
          <MarketStatusBadge />
        </div>
        {(isCurrentLoading || isOriginalLoading) &&
        (!currentData || !originalData) ? (
          <div className="h-8 w-48 bg-muted animate-pulse rounded"></div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-muted-foreground text-[10px]  tracking-wider font-semibold">
                Net Value
              </span>
              <span className="font-bold text-base">
                {formatCurrency(currentBalance)}
              </span>
            </div>

            <div className="h-8 w-px bg-border"></div>

            <div className="flex flex-col items-end">
              <span className="text-muted-foreground text-[10px]  tracking-wider font-semibold">
                Total Return
              </span>
              <div
                className={cn(
                  "flex items-center font-bold",
                  isPositive ? "text-emerald-500" : "text-rose-500",
                )}
              >
                <HugeiconsIcon
                  icon={isPositive ? ArrowUp01Icon : ArrowDown01Icon}
                  size={16}
                  className="mr-0.5"
                  strokeWidth={2.5}
                />
                {formatCurrency(Math.abs(diff))} (
                {Math.abs(percentChange).toFixed(2)}%)
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
