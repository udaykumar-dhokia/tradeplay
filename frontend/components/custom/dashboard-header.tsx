"use client";

import { useMemo } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  useGetCurrentBalanceQuery,
  useGetOriginalBalanceQuery,
} from "@/lib/features/portfolio/portfolioApi";
import { useGetPositionsQuery } from "@/lib/features/transactions/transactionsApi";
import { useGetQuotesQuery } from "@/lib/features/stocks/stocksApi";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUp01Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { StockSearch } from "@/components/custom/stock-search";
import { MarketStatusBadge } from "@/components/custom/MarketStatusBadge";
import { ThemeToggle } from "@/components/custom/theme-toggle";

export const DashboardHeader = () => {
  const { data: currentData, isLoading: isCurrentLoading } =
    useGetCurrentBalanceQuery();
  const { data: originalData, isLoading: isOriginalLoading } =
    useGetOriginalBalanceQuery();
  const { data: positionsData, isLoading: isPositionsLoading } =
    useGetPositionsQuery();

  const positionSymbols = useMemo(
    () =>
      positionsData?.positions?.map((item: any) => item.symbol).join(",") || "",
    [positionsData],
  );
  const { data: positionQuotes, isLoading: isQuotesLoading } =
    useGetQuotesQuery(positionSymbols, { skip: !positionSymbols });

  const currentCash = parseFloat(currentData?.current_balance || "0");
  const originalBalance = parseFloat(originalData?.original_balance || "0");

  const openPositionsValue = useMemo(() => {
    if (!positionsData?.positions) return 0;
    return positionsData.positions.reduce((total: number, pos: any) => {
      const quote = positionQuotes?.find((q) => q.symbol === pos.symbol);
      const avgPrice = parseFloat(
        pos.average_price?.toString() || pos.averagePrice?.toString() || "0",
      );
      const currentPrice = quote?.price ?? avgPrice;
      const qty = pos.quantity || 0;
      return total + currentPrice * qty;
    }, 0);
  }, [positionsData, positionQuotes]);

  const netValue = currentCash + openPositionsValue;
  const diff = netValue - originalBalance;
  const isPositive = diff >= 0;
  const percentChange =
    originalBalance > 0 ? (diff / originalBalance) * 100 : 0;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "INR",
    }).format(val);
  };

  const isNetLoading =
    (isCurrentLoading ||
      isOriginalLoading ||
      isPositionsLoading ||
      (positionSymbols && isQuotesLoading)) &&
    (!currentData || !originalData);

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-15 lg:px-6 justify-between w-full">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <h1 className="text-lg font-semibold md:hidden">TradePlay</h1>
      </div>

      <div className="flex-1 flex justify-center px-4 max-w-xl mx-auto hidden md:flex">
        <StockSearch className="max-w-md" />
      </div>

      <div className="flex items-center gap-3 sm:gap-4 text-sm">
        <div className="hidden sm:block">
          <MarketStatusBadge />
        </div>
        {/* <ThemeToggle /> */}
        {isNetLoading ? (
          <div className="h-8 w-48 bg-muted animate-pulse rounded"></div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-muted-foreground text-[10px]  tracking-wider font-semibold">
                Net Value
              </span>
              <span className="font-bold text-base">
                {formatCurrency(netValue)}
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
