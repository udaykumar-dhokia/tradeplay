"use client";

import React, { useEffect, useRef, useMemo } from "react";
import { useAppDispatch } from "@/lib/hooks";
import { setAdvancedMode } from "@/lib/features/ui/uiSlice";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeftIcon, Wallet02Icon } from "@hugeicons/core-free-icons";
import { useGetCurrentBalanceQuery } from "@/lib/features/portfolio/portfolioApi";
import { useGetStockHistoryQuery } from "@/lib/features/stocks/stocksApi";
import { Skeleton } from "@/components/ui/skeleton";
import { KLineChartPro, Period, SymbolInfo } from "@klinecharts/pro";
import "@klinecharts/pro/dist/klinecharts-pro.css";

interface AdvancedChartViewProps {
  symbol: string;
  name?: string;
  price?: number;
  change?: number;
  changePercent?: number;
}

export const AdvancedChartView: React.FC<AdvancedChartViewProps> = ({
  symbol,
  price = 0,
  change = 0,
  changePercent = 0,
}) => {
  const dispatch = useAppDispatch();
  const { data: balanceData, isLoading: balanceLoading } = useGetCurrentBalanceQuery();
  const { data: historyData } = useGetStockHistoryQuery({ symbol, range: "1y", interval: "1d" });
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const displaySymbol = symbol.replace(".NS", "").replace(".BO", "");
  const isUp = change >= 0;

  const handleBack = () => {
    dispatch(setAdvancedMode(false));
  };

  const chartInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    if (chartInstanceRef.current) return; // Prevent double initialization in StrictMode

    class CustomDatafeed {
      async searchSymbols() { return []; }
      async getHistoryKLineData(sym: SymbolInfo, period: Period, from: number, to: number) {
        try {
          // Map period to Yahoo Finance intervals
          let interval = "1d";
          let range = "1y";
          if (period.timespan === "minute") {
            interval = `${period.multiplier}m`;
            range = "1mo"; // Fetch 1 month for intraday
            if (period.multiplier === 1) range = "5d";
          } else if (period.timespan === "hour") {
            interval = "60m";
            range = "3mo";
          } else if (period.timespan === "day") {
            interval = "1d";
            range = "5y";
          } else if (period.timespan === "week") {
            interval = "1wk";
            range = "10y";
          } else if (period.timespan === "month") {
            interval = "1mo";
            range = "max";
          }

          const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1/";
          const res = await fetch(`${baseUrl.replace(/\/$/, '')}/stocks/history?symbol=${sym.ticker}&range=${range}&interval=${interval}`);
          
          if (!res.ok) throw new Error("Failed to fetch");
          
          const data = await res.json();
          if (!data.candles) return [];

          return data.candles
            .map((c: any) => {
              const timestamp = typeof c.time === "string" ? new Date(c.time).getTime() : c.time;
              return {
                timestamp,
                open: c.open,
                high: c.high,
                low: c.low,
                close: c.close,
                volume: c.volume || 0,
              };
            })
            .filter((c: any) => c.timestamp >= from && c.timestamp <= to)
            .sort((a: any, b: any) => a.timestamp - b.timestamp);
        } catch (e) {
          console.error(e);
          return [];
        }
      }
      subscribe() {}
      unsubscribe() {}
    }

    chartInstanceRef.current = new KLineChartPro({
      container: chartContainerRef.current,
      symbol: { ticker: symbol, name: displaySymbol, shortName: displaySymbol },
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
      theme: "light",
      locale: "en-US",
      drawingBarVisible: true,
      watermark: "", // Removes the default klinecharts background logo
      datafeed: new CustomDatafeed(),
    });

    // Cleanup function - note that if we prevent double init, we shouldn't destroy the only instance on the first StrictMode unmount
    return () => {
      // We will let React's unmount destroy the DOM node naturally when exiting advanced mode.
    };
  }, []); // Run ONCE on mount

  // Update symbol if it changes
  useEffect(() => {
    if (chartInstanceRef.current && symbol) {
      chartInstanceRef.current.setSymbol({
        ticker: symbol,
        name: displaySymbol,
        shortName: displaySymbol,
      });
    }
  }, [symbol, displaySymbol]);

  const performanceStats = useMemo(() => {
    if (!historyData?.candles || historyData.candles.length === 0) return null;
    const candles = historyData.candles;
    const currentPrice = candles[candles.length - 1].close;
    
    // Helper to get past price roughly N days ago
    const getPastPrice = (daysAgo: number) => {
      const targetTime = Date.now() - daysAgo * 24 * 60 * 60 * 1000;
      // find closest candle
      let closest = candles[0];
      let minDiff = Infinity;
      for (const c of candles) {
        const time = typeof c.time === "string" ? new Date(c.time).getTime() : c.time;
        const diff = Math.abs(time - targetTime);
        if (diff < minDiff) {
          minDiff = diff;
          closest = c;
        }
      }
      return closest.close;
    };

    const calcReturn = (pastPrice: number) => ((currentPrice - pastPrice) / pastPrice) * 100;

    return [
      { label: "1W", val: calcReturn(getPastPrice(7)) },
      { label: "1M", val: calcReturn(getPastPrice(30)) },
      { label: "3M", val: calcReturn(getPastPrice(90)) },
      { label: "6M", val: calcReturn(getPastPrice(180)) },
      { label: "YTD", val: calcReturn(getPastPrice(new Date().setMonth(0, 1) ? Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24)) : 0)) },
      { label: "1Y", val: calcReturn(candles[0].close) }, // oldest candle in 1y dataset
    ];
  }, [historyData]);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col text-foreground overflow-hidden">
      {/* Custom Top Bar for Navigation and Balance */}
      <div className="flex items-center h-14 border-b bg-background px-4 gap-4 shrink-0 shadow-sm z-10 w-full">
        <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2 shrink-0">
          <HugeiconsIcon icon={ArrowLeftIcon} size={18} />
          <span className="font-semibold">Exit Advanced Mode</span>
        </Button>

        <div className="ml-auto" />

        <div className="flex items-center gap-2 shrink-0 bg-muted/40 px-3 h-9 rounded-md border text-sm font-medium">
          <HugeiconsIcon icon={Wallet02Icon} size={16} className="text-muted-foreground" />
          {balanceLoading ? (
            <Skeleton className="w-16 h-4" />
          ) : (
            <span>
              ₹{Number(balanceData?.current_balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 w-full relative overflow-hidden">
        {/* KLineChartPro Widget */}
        <div className="flex-1 h-full min-h-0" ref={chartContainerRef} />

        {/* Right Details Panel */}
        <div className="w-80 border-l bg-card flex flex-col shrink-0 overflow-y-auto">
          <div className="p-5 border-b">
            <h2 className="text-xl font-bold">{displaySymbol}</h2>
            <p className="text-xs text-muted-foreground mb-4">{symbol} • NSE</p>
            <div className="text-3xl font-bold mb-1">
              ₹{price.toFixed(2)}
            </div>
            <div className={`text-sm font-semibold ${isUp ? "text-emerald-500" : "text-rose-500"}`}>
              {isUp ? "+" : ""}{change.toFixed(2)} ({isUp ? "+" : ""}{changePercent.toFixed(2)}%)
            </div>
          </div>

          {/* Performance Blocks */}
          <div className="p-5 border-b">
            <h3 className="text-sm font-bold mb-4">Performance</h3>
            {performanceStats ? (
              <div className="grid grid-cols-2 gap-3">
                {performanceStats.map((perf) => (
                  <div
                    key={perf.label}
                    className={`flex flex-col items-center justify-center p-2 rounded-md ${
                      perf.val >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                    }`}
                  >
                    <span className="font-bold text-sm">{perf.val > 0 ? "+" : ""}{perf.val.toFixed(2)}%</span>
                    <span className="text-xs opacity-80">{perf.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            )}
          </div>

          {/* Seasonals Dummy Chart */}
          <div className="p-5">
            <h3 className="text-sm font-bold mb-4 flex justify-between items-center">
              <span>Historical Volatility</span>
              <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground">30D</span>
            </h3>
            <div className="h-24 w-full flex items-end gap-1 opacity-70">
              {historyData?.candles ? historyData.candles.slice(-30).map((c, i) => {
                // simple volatility representation (high - low)
                const ht = Math.max(10, Math.min(100, ((c.high - c.low) / c.close) * 1000));
                return (
                  <div
                    key={i}
                    className="w-full bg-primary/40 rounded-t-sm"
                    style={{ height: `${ht}%` }}
                    title={typeof c.time === "string" ? c.time : ""}
                  />
                )
              }) : Array.from({ length: 30 }).map((_, i) => <Skeleton key={i} className="w-full h-full" />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
