"use client";

import { useState, useMemo } from "react";
import {
  useGetCurrentBalanceQuery,
  useGetOriginalBalanceQuery,
} from "@/lib/features/portfolio/portfolioApi";
import {
  useGetPositionsQuery,
  useGetTransactionsQuery,
} from "@/lib/features/transactions/transactionsApi";
import { useGetQuotesQuery } from "@/lib/features/stocks/stocksApi";
import { Skeleton } from "@/components/ui/skeleton";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowUp01Icon,
  ArrowDown01Icon,
  ArrowRight01Icon,
  CompassIcon,
  Coins01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Sparkline } from "@/components/custom/sparkline";
import { TradeOrderPanel } from "@/components/custom/trade-order-panel";

export default function PortfolioPage() {
  const { data: currentBalanceData, isLoading: currentLoading } =
    useGetCurrentBalanceQuery();
  const { data: originalBalanceData, isLoading: originalLoading } =
    useGetOriginalBalanceQuery();
  const { data: positionsData, isLoading: positionsLoading } =
    useGetPositionsQuery();
  const { data: transactionsData, isLoading: transactionsLoading } =
    useGetTransactionsQuery({ limit: 1, offset: 0 });

  // Trade sheet state for selling from portfolio
  const [isTradeOpen, setIsTradeOpen] = useState(false);
  const [orderType, setOrderType] = useState<"BUY" | "SELL">("SELL");
  const [tradeQuantity, setTradeQuantity] = useState<number | undefined>(
    undefined,
  );
  const [selectedStock, setSelectedStock] = useState<{
    symbol: string;
    name: string;
    exchange: string;
    currentPrice: number;
    positionId?: string;
  } | null>(null);

  const positionSymbols = useMemo(
    () => positionsData?.positions?.map((p: any) => p.symbol).join(",") || "",
    [positionsData],
  );

  const { data: positionQuotes, isLoading: quotesLoading } = useGetQuotesQuery(
    positionSymbols,
    { skip: !positionSymbols },
  );

  const currentBalance = currentBalanceData?.current_balance;
  const originalBalance = originalBalanceData?.original_balance;
  const openPositionsCount = positionsData?.positions?.length || 0;
  const totalTrades = transactionsData?.totalCount || 0;

  const currentNum = parseFloat(currentBalance || "0");
  const originalNum = parseFloat(originalBalance || "0");

  const formatCurrency = (val: string | number | undefined | null) => {
    if (!val && val !== 0) return "₹0.00";
    return `₹${Number(val).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Calculate total portfolio holdings metrics
  const portfolioSummary = useMemo(() => {
    if (!positionsData?.positions || positionsData.positions.length === 0) {
      return {
        totalCurrentValue: 0,
        totalInvested: 0,
        totalPnl: 0,
        totalPnlPercent: 0,
      };
    }

    let totalInvested = 0;
    let totalCurrentValue = 0;

    positionsData.positions.forEach((pos: any) => {
      const quote = positionQuotes?.find((q) => q.symbol === pos.symbol);
      const avgPrice = parseFloat(
        pos.average_price?.toString() || pos.averagePrice?.toString() || "0",
      );
      const currentPrice = quote?.price ?? avgPrice;
      const qty = pos.quantity || 0;

      totalInvested += avgPrice * qty;
      totalCurrentValue += currentPrice * qty;
    });

    const totalPnl = totalCurrentValue - totalInvested;
    const totalPnlPercent =
      totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

    return { totalCurrentValue, totalInvested, totalPnl, totalPnlPercent };
  }, [positionsData, positionQuotes]);

  const netWorth = currentNum + portfolioSummary.totalCurrentValue;
  const diff = netWorth - originalNum;
  const isPositive = diff >= 0;
  const percentChange = originalNum > 0 ? (diff / originalNum) * 100 : 0;

  const handleOpenSell = (pos: any, currentPrice: number) => {
    setSelectedStock({
      symbol: pos.symbol,
      name: pos.name || pos.symbol,
      exchange: pos.exchange || (pos.symbol.endsWith(".NS") ? "NSE" : "BSE"),
      currentPrice,
      positionId: pos.id,
    });
    setTradeQuantity(pos.quantity);
    setOrderType("SELL");
    setIsTradeOpen(true);
  };

  const isLoadingPositions =
    positionsLoading || (positionSymbols && quotesLoading);

  return (
    <div className="flex flex-col gap-8 w-full pb-16">
      {/* 1. Hero Header Banner */}
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

      {/* 2. Floating Statistics Cards */}
      <div className="w-full flex justify-center -mt-14 relative z-20 px-4 max-w-5xl mx-auto">
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Net Worth */}
          <div className="bg-white dark:bg-card border p-5 flex flex-col justify-center shadow-xs">
            <h3 className="text-sm font-semibold text-muted-foreground mb-1 tracking-wider ">
              Net Worth
            </h3>
            {currentLoading || originalLoading || isLoadingPositions ? (
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

          {/* Original Balance / Invested Amount */}
          <div className="bg-white dark:bg-card border p-5 flex flex-col justify-center shadow-xs">
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

          {/* Open Positions Count */}
          <div className="bg-white dark:bg-card border p-5 flex flex-col justify-center shadow-xs">
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

          {/* Lifetime Trades */}
          <div className="bg-white dark:bg-card border p-5 flex flex-col justify-center shadow-xs">
            <h3 className="text-sm font-semibold text-muted-foreground mb-1 tracking-wider ">
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

      {/* 3. Open Positions Section */}
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-0 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">
              Open Positions ({positionsData?.positions?.length || 0})
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Active stock holdings in your portfolio. You can sell your shares
              directly from here.
            </p>
          </div>

          {/* Summary of Open Positions */}
          {positionsData?.positions && positionsData.positions.length > 0 && (
            <div className="flex items-center gap-4 bg-muted/40 px-3 py-1.5 border text-xs">
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground  font-semibold">
                  Holdings Value
                </span>
                <span className="font-bold text-sm">
                  {formatCurrency(portfolioSummary.totalCurrentValue)}
                </span>
              </div>
              <div className="h-6 w-px bg-border" />
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground  font-semibold">
                  Total P&amp;L
                </span>
                <span
                  className={cn(
                    "font-bold text-sm",
                    portfolioSummary.totalPnl >= 0
                      ? "text-emerald-500"
                      : "text-rose-500",
                  )}
                >
                  {portfolioSummary.totalPnl >= 0 ? "+" : ""}
                  {formatCurrency(portfolioSummary.totalPnl)} (
                  {portfolioSummary.totalPnl >= 0 ? "+" : ""}
                  {portfolioSummary.totalPnlPercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Positions List Card */}
        <div className="bg-card border overflow-hidden shadow-sm">
          {isLoadingPositions ? (
            <div className="flex flex-col divide-y">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : positionsData?.positions && positionsData.positions.length > 0 ? (
            <div className="flex flex-col divide-y">
              {positionsData.positions.map((pos: any, index: number) => {
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

                const openedDate = pos.opened_at ? new Date(pos.opened_at) : null;
                const formattedOpened = openedDate && !isNaN(openedDate.getTime())
                  ? openedDate.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : null;

                return (
                  <div
                    key={pos.id || `${pos.symbol}-${index}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-muted/40 transition-colors gap-4"
                  >
                    {/* Left: Stock info & avatar */}
                    <Link
                      href={`/trade?symbol=${pos.symbol}`}
                      className="flex items-center gap-3 min-w-0 flex-1 group"
                    >
                      <img
                        src={`https://api.dicebear.com/10.x/initials/svg?seed=${cleanSymbol}`}
                        alt={cleanSymbol}
                        className="w-11 h-11 rounded-full shadow-xs shrink-0"
                      />
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base text-foreground group-hover:text-primary transition-colors truncate">
                            {cleanSymbol}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-xs bg-muted text-muted-foreground ">
                            {pos.exchange || "NSE"}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground mt-0.5">
                          {quantity} {quantity === 1 ? "Share" : "Shares"} @ {formatCurrency(avgPrice)}
                          {formattedOpened && ` • Bought on ${formattedOpened}`}
                        </span>
                      </div>
                    </Link>

                    {/* Middle: Sparkline chart if available */}
                    <div className="hidden md:flex items-center justify-center w-28">
                      {quote?.sparkline && quote.sparkline.length > 0 && (
                        <Sparkline
                          data={quote.sparkline}
                          color={isProfit ? "#22c55e" : "#ef4444"}
                        />
                      )}
                    </div>

                    {/* Right: Values, P&L, and Sell Action */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0">
                      <div className="flex flex-col items-end min-w-24">
                        <span className="font-bold text-base text-foreground">
                          {formatCurrency(totalCurrent)}
                        </span>
                        <div
                          className={cn(
                            "flex items-center text-xs font-bold",
                            isProfit ? "text-emerald-500" : "text-rose-500",
                          )}
                        >
                          <HugeiconsIcon
                            icon={isProfit ? ArrowUp01Icon : ArrowDown01Icon}
                            size={13}
                            className="mr-0.5"
                            strokeWidth={2.5}
                          />
                          <span>
                            {isProfit ? "+" : ""}
                            {formatCurrency(diff)} ({isProfit ? "+" : ""}
                            {changePercent.toFixed(2)}%)
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-0.5">
                          LTP: {formatCurrency(currentPrice)}
                        </span>
                      </div>

                      {/* Sell Button - opens bottom-right trade sheet */}
                      <button
                        onClick={() => handleOpenSell(pos, currentPrice)}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs  transition-all shadow-xs shrink-0 cursor-pointer"
                        title={`Sell ${cleanSymbol} shares`}
                      >
                        Sell
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center flex flex-col items-center justify-center min-h-[220px]">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-3">
                <HugeiconsIcon icon={Coins01Icon} size={24} />
              </div>
              <h3 className="text-lg font-bold mb-1">No Open Positions</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-5">
                You do not currently have any active investments. Explore the
                market and place your first trade.
              </p>
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-xs font-bold  rounded-sm hover:bg-primary/90 transition-all shadow-xs"
              >
                <HugeiconsIcon icon={CompassIcon} size={16} />
                <span>Explore Stocks</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 4. Bottom-Right Order Sheet (for selling directly from portfolio) */}
      {selectedStock && (
        <TradeOrderPanel
          symbol={selectedStock.symbol}
          name={selectedStock.name}
          exchange={selectedStock.exchange}
          currentPrice={selectedStock.currentPrice}
          isOpen={isTradeOpen}
          onClose={() => setIsTradeOpen(false)}
          orderType={orderType}
          setOrderType={setOrderType}
          initialQuantity={tradeQuantity}
          positionId={selectedStock.positionId}
        />
      )}
    </div>
  );
}
