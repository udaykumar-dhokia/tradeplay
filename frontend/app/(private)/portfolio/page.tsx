"use client";

import {
  useGetCurrentBalanceQuery,
  useGetOriginalBalanceQuery,
} from "@/lib/features/portfolio/portfolioApi";
import {
  useGetPositionsQuery,
  useGetTransactionsQuery,
} from "@/lib/features/transactions/transactionsApi";
import { Skeleton } from "@/components/ui/skeleton";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUp01Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

export default function PortfolioPage() {
  const { data: currentBalanceData, isLoading: currentLoading } =
    useGetCurrentBalanceQuery();
  const { data: originalBalanceData, isLoading: originalLoading } =
    useGetOriginalBalanceQuery();
  const { data: positionsData, isLoading: positionsLoading } =
    useGetPositionsQuery();
  const { data: transactionsData, isLoading: transactionsLoading } =
    useGetTransactionsQuery({ limit: 1, offset: 0 });

  const currentBalance = currentBalanceData?.current_balance;
  const originalBalance = originalBalanceData?.original_balance;
  const openPositionsCount = positionsData?.positions?.length || 0;
  const totalTrades = transactionsData?.totalCount || 0;

  const currentNum = parseFloat(currentBalance || "0");
  const originalNum = parseFloat(originalBalance || "0");
  const diff = currentNum - originalNum;
  const isPositive = diff >= 0;
  const percentChange = originalNum > 0 ? (diff / originalNum) * 100 : 0;

  const formatCurrency = (val: string | number | undefined | null) => {
    if (!val && val !== 0) return "₹0.00";
    return `₹${Number(val).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="flex flex-col gap-8 w-full pb-10">
      <div className="relative h-48 sm:h-64 -mx-4 -mt-4 lg:-mx-6 lg:-mt-6 w-[calc(100%+2rem)] lg:w-[calc(100%+3rem)] overflow-hidden bg-linear-to-br from-primary/90 to-primary/60 flex items-center justify-center shadow-md">
        <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSIgLz4KPHBhdGggZD0iTTAgMEw4IDhaTTAgOEw4IDBaIiBzdHJva2U9IiNmZmYiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiAvPgo8L3N2Zz4=')] bg-repeat"></div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-primary-foreground tracking-tight mb-4">
            Portfolio
          </h1>
          <p className="text-primary-foreground/80 max-w-xl mx-auto text-sm sm:text-base">
            Track your investments, view your performance, and manage your
            trades all in one place.
          </p>
        </div>
      </div>

      <div className="w-full flex justify-center -mt-14 relative z-20 px-4 max-w-5xl mx-auto">
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-card border p-5 flex flex-col justify-center">
            <h3 className="text-sm font-semibold text-muted-foreground mb-1  tracking-wider">
              Current Balance
            </h3>
            {currentLoading || originalLoading ? (
              <div className="flex flex-col gap-1 mt-1">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : (
              <div className="flex flex-col">
                <p className="text-2xl font-black text-foreground">
                  {formatCurrency(currentNum)}
                </p>
                <div
                  className={cn(
                    "flex items-center text-xs font-bold mt-1",
                    isPositive ? "text-emerald-500" : "text-rose-500",
                  )}
                >
                  <HugeiconsIcon
                    icon={isPositive ? ArrowUp01Icon : ArrowDown01Icon}
                    size={14}
                    className="mr-0.5"
                    strokeWidth={2.5}
                  />
                  {formatCurrency(Math.abs(diff))} (
                  {Math.abs(percentChange).toFixed(2)}%)
                </div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-card border  p-5 flex flex-col justify-center">
            <h3 className="text-sm font-semibold text-muted-foreground mb-1  tracking-wider">
              Original Balance
            </h3>
            {originalLoading ? (
              <Skeleton className="h-8 w-3/4 mt-1" />
            ) : (
              <p className="text-2xl font-black text-foreground">
                {formatCurrency(originalNum)}
              </p>
            )}
          </div>

          {/* Card 3: Open Positions */}
          <div className="bg-white dark:bg-card border  p-5 flex flex-col justify-center">
            <h3 className="text-sm font-semibold text-muted-foreground mb-1  tracking-wider">
              Open Positions
            </h3>
            {positionsLoading ? (
              <Skeleton className="h-8 w-1/2 mt-1" />
            ) : (
              <p className="text-2xl font-black text-foreground">
                {openPositionsCount}
              </p>
            )}
          </div>

          <div className="bg-white dark:bg-card border  p-5 flex flex-col justify-center">
            <h3 className="text-sm font-semibold text-muted-foreground mb-1  tracking-wider">
              Lifetime Trades
            </h3>
            {transactionsLoading ? (
              <Skeleton className="h-8 w-1/2 mt-1" />
            ) : (
              <p className="text-2xl font-black text-foreground">
                {totalTrades}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
