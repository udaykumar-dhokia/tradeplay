"use client";

import React, { useEffect, useRef, useMemo, useState } from "react";
import { useAppDispatch } from "@/lib/hooks";
import { setAdvancedMode } from "@/lib/features/ui/uiSlice";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeftIcon, Wallet02Icon } from "@hugeicons/core-free-icons";
import { useGetCurrentBalanceQuery } from "@/lib/features/portfolio/portfolioApi";
import { useGetPositionsQuery } from "@/lib/features/transactions/transactionsApi";
import {
  useGetStockHistoryQuery,
  useGetStockDetailsQuery,
} from "@/lib/features/stocks/stocksApi";
import { skipToken } from "@reduxjs/toolkit/query";
import { Skeleton } from "@/components/ui/skeleton";
import { KLineChartPro, Period, SymbolInfo } from "@klinecharts/pro";
import "@klinecharts/pro/dist/klinecharts-pro.css";
import * as klinecharts from "klinecharts";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { StockSearch } from "@/components/custom/stock-search";
import { TradeOrderPanel } from "@/components/custom/trade-order-panel";

// Register custom buyPositionOverlay once
if (typeof window !== "undefined") {
  try {
    klinecharts.registerOverlay({
      name: "buyPositionOverlay",
      totalStep: 1,
      needDefaultPointFigure: false,
      needDefaultXAxisFigure: false,
      needDefaultYAxisFigure: false,
      createPointFigures: ({ coordinates, bounding, overlay }) => {
        const y = coordinates[0]?.y ?? 0;
        const extendData = overlay.extendData || {};
        const text =
          extendData.label ||
          `BUY @ ₹${Number(overlay.points[0]?.value || 0).toFixed(2)}`;
        const pnl = extendData.pnl || "";
        const fullText = pnl ? `${text}  •  ${pnl}` : text;
        const isProfit = extendData.isProfit ?? true;
        const badgeColor = isProfit ? "#059669" : "#dc2626";
        const lineColor = isProfit ? "#10b981" : "#ef4444";

        return [
          {
            type: "line",
            attrs: {
              coordinates: [
                { x: 0, y },
                { x: bounding.width, y },
              ],
            },
            styles: {
              style: "dashed",
              size: 1.5,
              color: lineColor,
              dashedValue: [6, 4],
            },
          },
          {
            type: "rectText",
            ignoreEvent: true,
            attrs: {
              x: 10,
              y: y - 11,
              text: `  ${fullText}  `,
            },
            styles: {
              color: "#ffffff",
              backgroundColor: badgeColor,
              borderRadius: 3,
              paddingLeft: 6,
              paddingRight: 6,
              paddingTop: 3,
              paddingBottom: 3,
              size: 11,
              family: "system-ui, -apple-system, sans-serif",
              weight: "bold",
            },
          },
        ];
      },
      createYAxisFigures: ({ coordinates, overlay }) => {
        const y = coordinates[0]?.y ?? 0;
        const val = Number(overlay.points[0]?.value || 0);
        const extendData = overlay.extendData || {};
        const isProfit = extendData.isProfit ?? true;
        const badgeColor = isProfit ? "#059669" : "#dc2626";

        return [
          {
            type: "rectText",
            attrs: {
              x: 0,
              y: y - 10,
              text: ` ₹${val.toFixed(2)} `,
            },
            styles: {
              color: "#ffffff",
              backgroundColor: badgeColor,
              borderRadius: 2,
              paddingLeft: 4,
              paddingRight: 4,
              paddingTop: 2,
              paddingBottom: 2,
              size: 10,
              family: "system-ui, -apple-system, sans-serif",
              weight: "bold",
            },
          },
        ];
      },
    });
  } catch {
    // Already registered in this environment
  }
}

interface AdvancedChartViewProps {
  symbol: string;
  name?: string;
  price?: number;
  change?: number;
  changePercent?: number;
}

export const AdvancedChartView: React.FC<AdvancedChartViewProps> = ({
  symbol,
  name,
  price = 0,
  change = 0,
  changePercent = 0,
}) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { resolvedTheme } = useTheme();

  const { data: balanceData, isLoading: balanceLoading } =
    useGetCurrentBalanceQuery();
  const { data: positionsData } = useGetPositionsQuery();
  const { data: historyData } = useGetStockHistoryQuery({
    symbol,
    range: "1y",
    interval: "1d",
  });
  const { data: stockDetails, isLoading: detailsLoading } =
    useGetStockDetailsQuery(symbol || skipToken);

  const livePrice = stockDetails?.price?.regularMarketPrice ?? price;
  const liveChange = stockDetails?.price?.regularMarketChange ?? change;
  const liveChangePercent =
    stockDetails?.price?.regularMarketChangePercent !== undefined
      ? stockDetails.price.regularMarketChangePercent * 100
      : changePercent;
  const liveName = stockDetails?.price?.shortName || name || symbol;

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);

  const [isTradeOpen, setIsTradeOpen] = useState(false);
  const [orderType, setOrderType] = useState<"BUY" | "SELL">("BUY");
  const [selectedPositionId, setSelectedPositionId] = useState<
    string | undefined
  >();
  const [selectedInitialQty, setSelectedInitialQty] = useState<
    number | undefined
  >();

  const openTrade = (type: "BUY" | "SELL", posId?: string, qty?: number) => {
    setOrderType(type);
    setSelectedPositionId(posId);
    setSelectedInitialQty(qty);
    setIsTradeOpen(true);
  };

  const handleStockChange = (newSymbol: string) => {
    if (!newSymbol || newSymbol === symbol) return;
    setIsTradeOpen(false);
    setSelectedPositionId(undefined);
    setSelectedInitialQty(undefined);
    router.push(`/trade?symbol=${encodeURIComponent(newSymbol)}`);
  };

  const displaySymbol = symbol.replace(".NS", "").replace(".BO", "");
  const isUp = liveChange >= 0;

  const handleBack = () => {
    dispatch(setAdvancedMode(false));
  };

  // Filter positions matching this symbol
  const stockPositions = useMemo(() => {
    if (!positionsData?.positions) return [];
    return positionsData.positions.filter(
      (pos: any) =>
        pos.symbol === symbol ||
        pos.symbol.replace(".NS", "").replace(".BO", "") === displaySymbol,
    );
  }, [positionsData, symbol, displaySymbol]);

  // Aggregate metrics across all lots for this stock
  const positionSummary = useMemo(() => {
    if (stockPositions.length === 0) return null;
    const totalShares = stockPositions.reduce(
      (sum: number, p: any) => sum + (p.quantity || 0),
      0,
    );
    const totalInvested = stockPositions.reduce((sum: number, p: any) => {
      const avg = parseFloat(
        p.average_price?.toString() || p.averagePrice?.toString() || "0",
      );
      return sum + avg * (p.quantity || 0);
    }, 0);
    const avgPrice = totalShares > 0 ? totalInvested / totalShares : 0;
    const currentVal = totalShares * livePrice;
    const totalPnl = currentVal - totalInvested;
    const pnlPercent = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

    return {
      totalShares,
      totalInvested,
      avgPrice,
      currentVal,
      totalPnl,
      pnlPercent,
      isProfit: totalPnl >= 0,
    };
  }, [stockPositions, livePrice]);

  // Helper to obtain the underlying klinecharts Chart instance
  const getCoreChart = () => {
    if (!chartContainerRef.current) return null;
    const widgetEl = chartContainerRef.current.querySelector<HTMLElement>(
      ".klinecharts-pro-widget",
    );
    if (!widgetEl) return null;
    return klinecharts.init(widgetEl);
  };

  // Initialize KLineChartPro
  useEffect(() => {
    if (!chartContainerRef.current) return;
    if (chartInstanceRef.current) return;

    class CustomDatafeed {
      private _cache = new Map<string, any[]>();

      async searchSymbols(search?: string) {
        if (!search) return [];
        try {
          const baseUrl = (
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1/"
          ).replace(/\/$/, "");
          const res = await fetch(
            `${baseUrl}/stocks/search?q=${encodeURIComponent(search)}`,
          );
          if (!res.ok) return [];
          const data = await res.json();
          return data.map((item: any) => ({
            ticker: item.symbol,
            name: item.name,
            shortName: item.symbol.replace(".NS", "").replace(".BO", ""),
            exchange: item.exchange || "NSE",
            market: "equity",
          }));
        } catch {
          return [];
        }
      }

      async getHistoryKLineData(
        sym: SymbolInfo,
        period: Period,
        from: number,
        to: number,
      ) {
        const cacheKey = `${sym.ticker}|${period.timespan}|${period.multiplier}`;
        let allCandles = this._cache.get(cacheKey);

        if (!allCandles) {
          try {
            let interval = "1d";
            let range = "1y";
            if (period.timespan === "minute") {
              interval = `${period.multiplier}m`;
              range = period.multiplier === 1 ? "5d" : "1mo";
            } else if (period.timespan === "hour") {
              interval = "60m";
              range = "3mo";
            } else if (period.timespan === "day") {
              interval = "1d";
              range = "5y";
            } else if (period.timespan === "week") {
              interval = "1wk";
              range = "5y";
            } else if (period.timespan === "month") {
              interval = "1mo";
              range = "max";
            }

            const ticker = sym.ticker;
            const baseUrl = (
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1/"
            ).replace(/\/$/, "");
            const res = await fetch(
              `${baseUrl}/stocks/history?symbol=${ticker}&range=${range}&interval=${interval}`,
            );

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();
            if (!data.candles || data.candles.length === 0) {
              allCandles = [];
            } else {
              allCandles = data.candles
                .map((c: any) => {
                  let ts: number;
                  if (typeof c.time === "string") {
                    ts = new Date(c.time).getTime();
                  } else {
                    ts = c.time < 4_000_000_000 ? c.time * 1000 : c.time;
                  }
                  return {
                    timestamp: ts,
                    open: c.open,
                    high: c.high,
                    low: c.low,
                    close: c.close,
                    volume: c.volume || 0,
                  };
                })
                .sort((a: any, b: any) => a.timestamp - b.timestamp);
            }
            this._cache.set(cacheKey, allCandles!);
          } catch (e) {
            console.error("[klinecharts datafeed]", e);
            allCandles = [];
          }
        }

        if (from && to && from !== to) {
          const minTime = Math.min(from, to);
          const maxTime = Math.max(from, to);
          const filtered = allCandles!.filter(
            (c) => c.timestamp >= minTime && c.timestamp <= maxTime,
          );
          if (filtered.length > 0) return filtered;
        }
        return allCandles! || [];
      }
      subscribe() {}
      unsubscribe() {}
    }

    chartInstanceRef.current = new KLineChartPro({
      container: chartContainerRef.current,
      symbol: {
        ticker: symbol,
        name: displaySymbol,
        shortName: displaySymbol,
      },
      period: { multiplier: 1, timespan: "day", text: "1D" },
      periods: [
        { multiplier: 1, timespan: "minute", text: "1m" },
        { multiplier: 5, timespan: "minute", text: "5m" },
        { multiplier: 15, timespan: "minute", text: "15m" },
        { multiplier: 1, timespan: "hour", text: "1H" },
        { multiplier: 1, timespan: "day", text: "1D" },
        { multiplier: 1, timespan: "week", text: "1W" },
        { multiplier: 1, timespan: "month", text: "1M" },
      ],
      theme: resolvedTheme === "dark" ? "dark" : "light",
      locale: "en-US",
      timezone: "Asia/Kolkata",
      drawingBarVisible: true,
      watermark: "",
      datafeed: new CustomDatafeed(),
    });

    const resizeObserver = new ResizeObserver(() => {
      window.dispatchEvent(new Event("resize"));
    });
    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }

    const resizeTimer = setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 100);

    return () => {
      clearTimeout(resizeTimer);
      resizeObserver.disconnect();
      chartInstanceRef.current = null;
      if (chartContainerRef.current) {
        chartContainerRef.current.innerHTML = "";
      }
    };
  }, []);

  // Synchronize theme changes dynamically
  useEffect(() => {
    if (chartInstanceRef.current && resolvedTheme) {
      const targetTheme = resolvedTheme === "dark" ? "dark" : "light";
      if (
        typeof chartInstanceRef.current.getTheme === "function" &&
        chartInstanceRef.current.getTheme() !== targetTheme
      ) {
        chartInstanceRef.current.setTheme(targetTheme);
      }
    }
  }, [resolvedTheme]);

  // Synchronize symbol change
  useEffect(() => {
    if (chartInstanceRef.current && symbol) {
      chartInstanceRef.current.setSymbol({
        ticker: symbol,
        name: displaySymbol,
        shortName: displaySymbol,
      });
    }
  }, [symbol, displaySymbol]);

  // Synchronize symbol change from chart internal search modal
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const searchItem = target.closest(
        ".klinecharts-pro-symbol-search-modal-list li",
      );
      if (searchItem) {
        setTimeout(() => {
          if (chartInstanceRef.current) {
            const currentSym = chartInstanceRef.current.getSymbol();
            if (currentSym?.ticker && currentSym.ticker !== symbol) {
              handleStockChange(currentSym.ticker);
            }
          }
        }, 120);
      }
    };

    container.addEventListener("click", handleClick);
    return () => container.removeEventListener("click", handleClick);
  }, [symbol]);

  // Synchronize Buy Position Overlays on chart
  useEffect(() => {
    const updateOverlays = () => {
      const coreChart = getCoreChart();
      if (!coreChart) return;

      try {
        coreChart.removeOverlay({ groupId: "user_positions" });
      } catch {
        // ignore
      }

      if (stockPositions.length === 0) return;

      stockPositions.forEach((pos: any, idx: number) => {
        const buyPrice = parseFloat(
          pos.average_price?.toString() || pos.averagePrice?.toString() || "0",
        );
        if (buyPrice <= 0) return;

        const currentP = livePrice > 0 ? livePrice : buyPrice;
        const diff = (currentP - buyPrice) * pos.quantity;
        const pct =
          buyPrice > 0 ? ((currentP - buyPrice) / buyPrice) * 100 : 0;
        const isLotProfit = diff >= 0;

        const pnlStr =
          livePrice > 0
            ? `${isLotProfit ? "+" : ""}₹${Math.abs(diff).toFixed(2)} (${isLotProfit ? "+" : ""}${pct.toFixed(2)}%)`
            : "";

        try {
          coreChart.createOverlay({
            name: "buyPositionOverlay",
            groupId: "user_positions",
            lock: true,
            points: [{ value: buyPrice }],
            extendData: {
              label:
                stockPositions.length > 1
                  ? `BUY LOT #${idx + 1}: ${pos.quantity} Qty @ ₹${buyPrice.toFixed(2)}`
                  : `BUY: ${pos.quantity} Qty @ ₹${buyPrice.toFixed(2)}`,
              pnl: pnlStr,
              isProfit: isLotProfit,
            },
          });
        } catch (e) {
          console.error("[BuyPositionOverlay]", e);
        }
      });
    };

    updateOverlays();
    const timer = setTimeout(updateOverlays, 350);

    return () => {
      clearTimeout(timer);
      const coreChart = getCoreChart();
      if (coreChart) {
        try {
          coreChart.removeOverlay({ groupId: "user_positions" });
        } catch {
          // ignore
        }
      }
    };
  }, [stockPositions, livePrice, symbol, historyData]);

  const performanceStats = useMemo(() => {
    if (!historyData?.candles || historyData.candles.length === 0) return null;
    const candles = historyData.candles;
    const currentPrice = candles[candles.length - 1].close;

    const getPastPrice = (daysAgo: number) => {
      const idx = Math.max(0, candles.length - 1 - daysAgo);
      return candles[idx]?.close || currentPrice;
    };

    const calcReturn = (past: number) => {
      if (!past) return 0;
      return ((currentPrice - past) / past) * 100;
    };

    return [
      { label: "1W", val: calcReturn(getPastPrice(7)) },
      { label: "1M", val: calcReturn(getPastPrice(30)) },
      { label: "3M", val: calcReturn(getPastPrice(90)) },
      { label: "6M", val: calcReturn(getPastPrice(180)) },
      {
        label: "YTD",
        val: calcReturn(
          candles.find(
            (c: any) =>
              new Date(c.time || c.timestamp).getFullYear() ===
              new Date().getFullYear(),
          )?.close || candles[0].close,
        ),
      },
      { label: "1Y", val: calcReturn(candles[0].close) },
    ];
  }, [historyData]);

  return (
    <div
      className="fixed inset-0 z-50 bg-background flex flex-col text-foreground overflow-hidden"
      style={{ height: "100dvh" }}
    >
      {/* Top Header */}
      <div className="flex items-center h-14 border-b bg-background px-4 gap-3 sm:gap-4 shrink-0 shadow-sm z-30 w-full">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="gap-2 shrink-0 cursor-pointer text-muted-foreground hover:text-foreground"
        >
          <HugeiconsIcon icon={ArrowLeftIcon} size={18} />
          <span className="font-semibold hidden md:inline">
            Exit Advanced Mode
          </span>
          <span className="font-semibold md:hidden">Exit</span>
        </Button>

        {/* Stock Search / Switcher */}
        <div className="w-52 sm:w-64 md:w-80 shrink-0">
          <StockSearch
            placeholder={`Switch stock (${displaySymbol})...`}
            onSelectStock={handleStockChange}
          />
        </div>

        <div className="ml-auto" />

        {/* Header Trade Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => openTrade("BUY")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs uppercase px-4 py-2 transition-all shadow-xs cursor-pointer"
          >
            Buy
          </button>
          <button
            onClick={() => openTrade("SELL")}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase px-4 py-2 transition-all shadow-xs cursor-pointer"
          >
            Sell
          </button>
        </div>

        <div className="h-6 w-px bg-border hidden sm:block" />

        <div className="flex items-center gap-2 shrink-0 bg-muted/40 px-3 h-9 border text-sm font-medium">
          <HugeiconsIcon
            icon={Wallet02Icon}
            size={16}
            className="text-muted-foreground"
          />
          {balanceLoading ? (
            <Skeleton className="w-16 h-4" />
          ) : (
            <span>
              ₹
              {Number(balanceData?.current_balance || 0).toLocaleString(
                "en-IN",
                { minimumFractionDigits: 2, maximumFractionDigits: 2 },
              )}
            </span>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 min-h-0 w-full overflow-hidden">
        {/* Candlestick Chart */}
        <div
          className="flex-1 h-full min-h-0 overflow-hidden [&_.klinecharts-pro]:!h-full [&_.klinecharts-pro]:!max-h-full"
          ref={chartContainerRef}
        />

        {/* Right Sidebar */}
        <div className="w-80 border-l bg-card flex flex-col shrink-0 overflow-y-auto h-full">
          {/* Stock Header & Live Price */}
          <div className="p-5 border-b">
            <h2 className="text-xl font-bold">{displaySymbol}</h2>
            <p className="text-xs text-muted-foreground mb-3">
              {liveName} • NSE
            </p>
            {detailsLoading && !livePrice ? (
              <div className="space-y-2 mb-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            ) : (
              <>
                <div className="text-3xl font-bold mb-1">
                  ₹{livePrice.toFixed(2)}
                </div>
                <div
                  className={`text-sm font-semibold ${isUp ? "text-emerald-500" : "text-rose-500"}`}
                >
                  {isUp ? "+" : ""}
                  {liveChange.toFixed(2)} ({isUp ? "+" : ""}
                  {liveChangePercent.toFixed(2)}%)
                </div>
              </>
            )}

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={() => openTrade("BUY")}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs uppercase py-2.5 transition-all shadow-xs flex items-center justify-center cursor-pointer"
              >
                Buy
              </button>
              <button
                onClick={() => openTrade("SELL")}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase py-2.5 transition-all shadow-xs flex items-center justify-center cursor-pointer"
              >
                Sell
              </button>
            </div>
          </div>

          {/* Your Holdings / Positions Section */}
          <div className="p-5 border-b bg-muted/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold tracking-wide">
                Your Positions
              </h3>
              {stockPositions.length > 0 && (
                <span className="text-[10px] font-semibold bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                  {stockPositions.length}{" "}
                  {stockPositions.length === 1 ? "Lot" : "Lots"}
                </span>
              )}
            </div>

            {stockPositions.length > 0 && positionSummary ? (
              <div className="flex flex-col gap-3">
                {/* Aggregate Summary */}
                <div className="p-3 border bg-card flex flex-col gap-1.5 shadow-xs">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Total Shares</span>
                    <span className="font-bold">
                      {positionSummary.totalShares}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">
                      Avg. Buy Price
                    </span>
                    <span className="font-semibold">
                      ₹{positionSummary.avgPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Holding Value</span>
                    <span className="font-semibold">
                      ₹{positionSummary.currentVal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1.5 border-t border-dashed">
                    <span className="text-muted-foreground">
                      Total Unrealized P&L
                    </span>
                    <span
                      className={`font-bold ${
                        positionSummary.isProfit
                          ? "text-emerald-500"
                          : "text-rose-500"
                      }`}
                    >
                      {positionSummary.isProfit ? "+" : ""}
                      ₹{Math.abs(positionSummary.totalPnl).toFixed(2)} (
                      {positionSummary.isProfit ? "+" : ""}
                      {positionSummary.pnlPercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>

                {/* Individual Lots List */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Position Lots (Chart Lines)
                  </span>
                  {stockPositions.map((pos: any, idx: number) => {
                    const avg = parseFloat(
                      pos.average_price?.toString() ||
                        pos.averagePrice?.toString() ||
                        "0",
                    );
                    const qty = pos.quantity || 0;
                    const curVal = qty * livePrice;
                    const lotPnl = curVal - avg * qty;
                    const lotPnlPct =
                      avg > 0 ? (lotPnl / (avg * qty)) * 100 : 0;
                    const isLotProfit = lotPnl >= 0;

                    const rawDate = pos.created_at || pos.createdAt;
                    const dateObj = rawDate ? new Date(rawDate) : null;
                    const dateStr =
                      dateObj && !isNaN(dateObj.getTime())
                        ? dateObj.toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "";

                    return (
                      <div
                        key={pos.id || idx}
                        className="p-2.5 border bg-card text-xs flex flex-col gap-1.5 shadow-xs"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold flex items-center gap-1.5">
                            <span className="size-2 rounded-full bg-emerald-500 inline-block" />
                            {qty} Shares @ ₹{avg.toFixed(2)}
                          </span>
                          <button
                            onClick={() => openTrade("SELL", pos.id, qty)}
                            className="bg-rose-600/10 hover:bg-rose-600 hover:text-white text-rose-600 font-bold px-2 py-0.5 text-[11px] rounded transition-colors cursor-pointer"
                          >
                            Sell
                          </button>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-muted-foreground">{dateStr}</span>
                          <span
                            className={`font-semibold ${
                              isLotProfit
                                ? "text-emerald-500"
                                : "text-rose-500"
                            }`}
                          >
                            {isLotProfit ? "+" : ""}
                            ₹{Math.abs(lotPnl).toFixed(2)} (
                            {isLotProfit ? "+" : ""}
                            {lotPnlPct.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-4 border border-dashed text-center flex flex-col items-center gap-2 bg-background">
                <span className="text-xs text-muted-foreground">
                  No open positions in {displaySymbol}
                </span>
                <button
                  onClick={() => openTrade("BUY")}
                  className="text-xs text-primary hover:underline font-semibold cursor-pointer"
                >
                  Buy {displaySymbol} shares →
                </button>
              </div>
            )}
          </div>

          {/* Performance Grid */}
          <div className="p-5 border-b">
            <h3 className="text-sm font-bold mb-4">Performance</h3>
            {performanceStats ? (
              <div className="grid grid-cols-2 gap-3">
                {performanceStats.map((perf) => (
                  <div
                    key={perf.label}
                    className={`flex flex-col items-center justify-center p-2 ${
                      perf.val >= 0
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-rose-500/10 text-rose-600"
                    }`}
                  >
                    <span className="font-bold text-sm">
                      {perf.val > 0 ? "+" : ""}
                      {perf.val.toFixed(2)}%
                    </span>
                    <span className="text-xs opacity-80">{perf.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            )}
          </div>

          {/* Historical Volatility */}
          <div className="p-5">
            <h3 className="text-sm font-bold mb-4 flex justify-between items-center">
              <span>Historical Volatility</span>
              <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground">
                30D
              </span>
            </h3>
            <div className="h-24 w-full flex items-end gap-1 opacity-70">
              {historyData?.candles
                ? historyData.candles.slice(-30).map((c, i) => {
                    const ht = Math.max(
                      10,
                      Math.min(100, ((c.high - c.low) / c.close) * 1000),
                    );
                    return (
                      <div
                        key={i}
                        className="w-full bg-primary/40 rounded-t-sm"
                        style={{ height: `${ht}%` }}
                        title={typeof c.time === "string" ? c.time : ""}
                      />
                    );
                  })
                : Array.from({ length: 30 }).map((_, i) => (
                    <Skeleton key={i} className="w-full h-full" />
                  ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Trade Order Sheet */}
      <TradeOrderPanel
        symbol={symbol}
        name={liveName}
        exchange="NSE"
        currentPrice={livePrice}
        isOpen={isTradeOpen}
        onClose={() => {
          setIsTradeOpen(false);
          setSelectedPositionId(undefined);
          setSelectedInitialQty(undefined);
        }}
        orderType={orderType}
        setOrderType={setOrderType}
        initialQuantity={selectedInitialQty}
        positionId={selectedPositionId}
      />
    </div>
  );
};
