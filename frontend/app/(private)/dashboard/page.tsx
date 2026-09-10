"use client";

import { useMemo } from "react";

import {
  useGetCurrentBalanceQuery,
  useGetOriginalBalanceQuery,
} from "@/lib/features/portfolio/portfolioApi";
import {
  useGetPositionsQuery,
  useGetTransactionsQuery,
} from "@/lib/features/transactions/transactionsApi";
import {
  useGetTopMoversQuery,
  useGetQuotesQuery,
} from "@/lib/features/stocks/stocksApi";
import { useGetWishlistQuery } from "@/lib/features/wishlist/wishlistApi";
import { Skeleton } from "@/components/ui/skeleton";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowUp01Icon,
  ArrowDown01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Sparkline } from "@/components/custom/sparkline";

export default function DashboardPage() {
  const { data: currentBalanceData, isLoading: currentLoading } =
    useGetCurrentBalanceQuery();
  const { data: originalBalanceData, isLoading: originalLoading } =
    useGetOriginalBalanceQuery();
  const { data: positionsData, isLoading: positionsLoading } =
    useGetPositionsQuery();
  const { data: transactionsData, isLoading: transactionsLoading } =
    useGetTransactionsQuery({ limit: 5, offset: 0 });
  const { data: moversData, isLoading: moversLoading } = useGetTopMoversQuery();
  const { data: wishlistData, isLoading: wishlistLoading } =
    useGetWishlistQuery();

  const wishlistSymbols =
    wishlistData
      ?.slice(0, 4)
      .map((item) => item.symbol)
      .join(",") || "";
  const { data: quotesData, isLoading: quotesLoading } = useGetQuotesQuery(
    wishlistSymbols,
    { skip: !wishlistSymbols },
  );

  const positionSymbols = useMemo(
    () =>
      positionsData?.positions
        ?.map((item: any) => item.symbol)
        .join(",") || "",
    [positionsData],
  );
  const { data: positionQuotes, isLoading: positionQuotesLoading } =
    useGetQuotesQuery(positionSymbols, { skip: !positionSymbols });

  const currentNum = parseFloat(currentBalanceData?.current_balance || "0");
  const originalNum = parseFloat(originalBalanceData?.original_balance || "0");

  // Calculate current market value of all open positions
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

  // Net Worth = Cash Balance + Current Market Value of Open Positions
  const netWorth = currentNum + openPositionsValue;
  const diff = netWorth - originalNum;
  const isPositive = diff >= 0;
  const percentChange = originalNum > 0 ? (diff / originalNum) * 100 : 0;
  const openPositionsCount = positionsData?.positions?.length || 0;
  const totalTrades = transactionsData?.totalCount || 0;

  const formatCurrency = (val: string | number | undefined | null) => {
    if (!val && val !== 0) return "₹0.00";
    return `₹${Number(val).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="flex flex-col gap-8 w-full pb-10">
      {/* Hero Section */}
      <div className="relative h-48 sm:h-64 -mx-4 -mt-4 lg:-mx-6 lg:-mt-6 w-[calc(100%+2rem)] lg:w-[calc(100%+3rem)] overflow-hidden bg-linear-to-br from-primary/90 to-primary/60 flex items-center justify-center shadow-md">
        <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSIgLz4KPHBhdGggZD0iTTAgMEw4IDhaTTAgOEw4IDBaIiBzdHJva2U9IiNmZmYiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiAvPgo8L3N2Zz4=')] bg-repeat"></div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-primary-foreground tracking-tight mb-4">
            Dashboard
          </h1>
          <p className="text-primary-foreground/80 max-w-xl mx-auto text-sm sm:text-base">
            Welcome back! Here's an overview of your trading activity.
          </p>
        </div>
      </div>

      {/* Floating Stats Bar */}
      <div className="w-full flex justify-center -mt-14 relative z-20 px-4 max-w-5xl mx-auto">
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Net Worth */}
          <div className="bg-white dark:bg-card border p-5 flex flex-col justify-center shadow-sm">
            <h3 className="text-sm font-semibold text-muted-foreground mb-1 tracking-wider ">
              Net Worth
            </h3>
            {currentLoading ||
            originalLoading ||
            (positionSymbols && positionQuotesLoading) ? (
              <div className="flex flex-col gap-1 mt-1">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : (
              <div className="flex flex-col">
                <p className="text-2xl font-black text-foreground">
                  {formatCurrency(netWorth)}
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

          {/* Original Balance */}
          <div className="bg-white dark:bg-card border p-5 flex flex-col justify-center shadow-sm">
            <h3 className="text-sm font-semibold text-muted-foreground mb-1 tracking-wider ">
              Invested Amount
            </h3>
            {originalLoading ? (
              <Skeleton className="h-8 w-3/4 mt-1" />
            ) : (
              <p className="text-2xl font-black text-foreground">
                {formatCurrency(originalNum)}
              </p>
            )}
          </div>

          {/* Open Positions */}
          <div className="bg-white dark:bg-card border p-5 flex flex-col justify-center shadow-sm">
            <h3 className="text-sm font-semibold text-muted-foreground mb-1 tracking-wider ">
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

          {/* Total Trades */}
          <div className="bg-white dark:bg-card border p-5 flex flex-col justify-center shadow-sm">
            <h3 className="text-sm font-semibold text-muted-foreground mb-1 tracking-wider ">
              Total Trades
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 sm:px-0 max-w-5xl mx-auto w-full">
        {/* Left Column */}
        <div className="flex flex-col gap-8">
          {/* Your Positions */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold">Your Positions</h2>
              <Link
                href="/portfolio"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View All <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
              </Link>
            </div>

            <div className="bg-card border overflow-hidden shadow-sm">
              {positionsLoading ||
              (positionSymbols && positionQuotesLoading) ? (
                <div className="flex flex-col p-4 gap-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : positionsData?.positions &&
                positionsData.positions.length > 0 ? (
                <div className="flex flex-col divide-y">
                  {positionsData.positions.slice(0, 5).map((pos: any, index: number) => {
                    const quote = positionQuotes?.find(
                      (q) => q.symbol === pos.symbol,
                    );
                    const avgPrice = parseFloat(
                      pos.average_price?.toString() ||
                        pos.averagePrice?.toString() ||
                        "0",
                    );
                    const currentPrice = quote?.price ?? avgPrice;
                    const quantity = pos.quantity || 0;

                    const totalCost = avgPrice * quantity;
                    const totalCurrent = currentPrice * quantity;
                    const diff = totalCurrent - totalCost;
                    const isProfit = diff >= 0;
                    const changePercent =
                      totalCost > 0 ? (diff / totalCost) * 100 : 0;
                    const cleanSymbol = pos.symbol
                      .replace(".NS", "")
                      .replace(".BO", "");

                    return (
                      <Link
                        key={pos.id || `${pos.symbol}-${index}`}
                        href={`/trade?symbol=${pos.symbol}`}
                        className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-4 flex-1">
                          <img
                            src={`https://api.dicebear.com/10.x/initials/svg?seed=${cleanSymbol}`}
                            alt={cleanSymbol}
                            className="w-10 h-10 rounded-full shadow-xs shrink-0"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold truncate text-foreground text-sm">
                              {cleanSymbol}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                              {quantity} {quantity === 1 ? "Share" : "Shares"} @{" "}
                              {formatCurrency(avgPrice)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                          {quote?.sparkline && quote.sparkline.length > 0 && (
                            <div className="hidden sm:block w-20">
                              <Sparkline
                                data={quote.sparkline}
                                color={isProfit ? "#22c55e" : "#ef4444"}
                              />
                            </div>
                          )}
                          <div className="flex flex-col items-end shrink-0 min-w-17.5">
                            <span className="font-medium text-sm">
                              {formatCurrency(totalCurrent)}
                            </span>
                            <span
                              className={cn(
                                "text-xs font-semibold",
                                isProfit ? "text-emerald-500" : "text-rose-500",
                              )}
                            >
                              {isProfit ? "+" : ""}
                              {formatCurrency(diff)} ({isProfit ? "+" : ""}
                              {changePercent.toFixed(2)}%)
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No open positions found. Head over to Explore to find stocks.
                </div>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold">Recent Transactions</h2>
            </div>

            <div className="bg-card border overflow-hidden shadow-sm">
              {transactionsLoading ? (
                <div className="flex flex-col p-4 gap-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : transactionsData?.transactions &&
                transactionsData.transactions.length > 0 ? (
                <div className="flex flex-col divide-y">
                  {transactionsData.transactions.map((tx: any) => {
                    const cleanSymbol = (tx.symbol || "")
                      .replace(".NS", "")
                      .replace(".BO", "");
                    const isBuy = tx.type === "BUY";
                    const shares = tx.total_shares ?? tx.quantity ?? 0;
                    const price = parseFloat(tx.price?.toString() || "0");
                    const totalAmount = parseFloat(
                      tx.total_amount?.toString() ||
                        (price * shares).toString(),
                    );

                    const rawDate = tx.created_at || tx.createdAt;
                    const dateObj = rawDate ? new Date(rawDate) : null;
                    const formattedDate =
                      dateObj && !isNaN(dateObj.getTime())
                        ? dateObj.toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "Recent";

                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-4 flex-1">
                          <img
                            src={`https://api.dicebear.com/10.x/initials/svg?seed=${cleanSymbol}`}
                            alt={cleanSymbol}
                            className="w-10 h-10 rounded-full shadow-xs shrink-0"
                          />
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-foreground truncate">
                                {cleanSymbol}
                              </span>
                              <span
                                className={cn(
                                  "px-1.5 py-0.5 text-[10px] font-bold  rounded-xs tracking-wider",
                                  isBuy
                                    ? "bg-primary/10 text-primary"
                                    : "bg-rose-500/10 text-rose-600",
                                )}
                              >
                                {tx.type}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground truncate">
                              {formattedDate} • {tx.exchange || "NSE"}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end shrink-0 min-w-17.5">
                          <span className="font-medium text-sm text-foreground">
                            {formatCurrency(totalAmount)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {shares} {shares === 1 ? "Share" : "Shares"} @{" "}
                            {formatCurrency(price)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No recent transactions.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-8">
          {/* Market Movers Mini */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold">Top Movers</h2>
              <Link
                href="/explore"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                Explore <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
              </Link>
            </div>

            <div className="bg-card border overflow-hidden shadow-sm">
              {moversLoading ? (
                <div className="flex flex-col p-4 gap-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : moversData?.gainers && moversData.gainers.length > 0 ? (
                <div className="flex flex-col divide-y">
                  {moversData.gainers.slice(0, 3).map((stock) => (
                    <Link
                      key={stock.symbol}
                      href={`/trade?symbol=${stock.symbol}`}
                      className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-4 flex-1">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold truncate text-foreground text-sm">
                            {stock.symbol.replace(".NS", "").replace(".BO", "")}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="hidden sm:block w-20">
                          <Sparkline
                            data={stock.sparkline || []}
                            color="#22c55e"
                          />
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                          <span className="font-medium text-sm">
                            ₹{stock.price.toFixed(2)}
                          </span>
                          <span className="text-xs font-semibold text-green-500">
                            +{stock.changePercent.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No market movers data available.
                </div>
              )}
            </div>
          </div>

          {/* Wishlist Mini */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold">Your Wishlist</h2>
              <Link
                href="/wishlist"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View All <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
              </Link>
            </div>

            <div className="bg-card border overflow-hidden shadow-sm">
              {wishlistLoading || quotesLoading ? (
                <div className="flex flex-col p-4 gap-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : quotesData && quotesData.length > 0 ? (
                <div className="flex flex-col divide-y">
                  {quotesData.map((item) => (
                    <Link
                      key={item.symbol}
                      href={`/trade?symbol=${item.symbol}`}
                      className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">
                            {item.symbol.replace(".NS", "").replace(".BO", "")}
                          </span>
                          <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {item.name}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-medium text-sm">
                          {formatCurrency(item.price)}
                        </span>
                        <span
                          className={cn(
                            "text-xs font-semibold",
                            item.changePercent >= 0
                              ? "text-green-500"
                              : "text-red-500",
                          )}
                        >
                          {item.changePercent >= 0 ? "+" : ""}
                          {item.changePercent?.toFixed(2) || "0.00"}%
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  Your wishlist is empty.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
