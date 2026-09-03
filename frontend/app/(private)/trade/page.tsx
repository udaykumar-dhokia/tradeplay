"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  useGetStockDetailsQuery,
  useGetStockHistoryQuery,
  useGetSimilarStocksQuery,
} from "@/lib/features/stocks/stocksApi";
import { skipToken } from "@reduxjs/toolkit/query";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUp01Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { Sparkline } from "@/components/custom/sparkline";
import { useAppSelector } from "@/lib/hooks";
import { AdvancedChartView } from "@/components/custom/advanced-chart";
import { WishlistButton } from "@/components/custom/wishlist-button";

const TIMEFRAMES = [
  { label: "1D", range: "1d", interval: "5m" },
  { label: "5D", range: "5d", interval: "15m" },
  { label: "1M", range: "1mo", interval: "1d" },
  { label: "3M", range: "3mo", interval: "1d" },
  { label: "6M", range: "6mo", interval: "1d" },
  { label: "1Y", range: "1y", interval: "1d" },
  { label: "5Y", range: "5y", interval: "1wk" },
  { label: "MAX", range: "max", interval: "1mo" },
];

export default function TradePage() {
  const searchParams = useSearchParams();
  const symbol = searchParams.get("symbol");
  const advancedMode = useAppSelector((state) => state.ui.advancedMode);

  const [activeTimeframe, setActiveTimeframe] = useState(TIMEFRAMES[5]); // Default 1Y

  const { data: details, isLoading: detailsLoading } = useGetStockDetailsQuery(
    symbol || skipToken,
  );
  const { data: history, isLoading: historyLoading } = useGetStockHistoryQuery(
    symbol
      ? {
          symbol,
          range: activeTimeframe.range,
          interval: activeTimeframe.interval,
        }
      : skipToken,
  );

  const { data: similarStocks, isLoading: similarLoading } =
    useGetSimilarStocksQuery(symbol || skipToken);

  const priceData = details?.price;
  const summary = details?.summaryDetail;
  const profile = details?.assetProfile;

  const chartData = useMemo(() => {
    if (!history?.candles) return [];
    return history.candles.map((c: any) => ({
      ...c,
      formattedTime:
        activeTimeframe.range === "1d" || activeTimeframe.range === "5d"
          ? format(new Date(c.time), "HH:mm")
          : format(new Date(c.time), "MMM d, yyyy"),
    }));
  }, [history, activeTimeframe]);

  const timeframeStats = useMemo(() => {
    if (activeTimeframe.range === "1d" || chartData.length < 2) {
      return {
        change: priceData?.regularMarketChange || 0,
        changePercent: (priceData?.regularMarketChangePercent || 0) * 100,
        isPositive: (priceData?.regularMarketChange || 0) >= 0,
      };
    }

    const first = chartData[0].close;
    const current =
      priceData?.regularMarketPrice || chartData[chartData.length - 1].close;
    const change = current - first;
    const changePercent = (change / first) * 100;

    return {
      change,
      changePercent,
      isPositive: change >= 0,
    };
  }, [chartData, activeTimeframe.range, priceData]);

  const color = timeframeStats.isPositive ? "#22c55e" : "#ef4444";

  const minPrice = useMemo(() => {
    if (!chartData.length) return 0;
    return Math.min(...chartData.map((c: any) => c.close));
  }, [chartData]);

  const maxPrice = useMemo(() => {
    if (!chartData.length) return 0;
    return Math.max(...chartData.map((c: any) => c.close));
  }, [chartData]);

  const formatNumber = (num: number) => {
    if (num >= 1e12) return `₹${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `₹${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e7) return `₹${(num / 1e7).toFixed(2)}Cr`;
    if (num >= 1e5) return `₹${(num / 1e5).toFixed(2)}L`;
    return `₹${num.toFixed(2)}`;
  };

  if (!symbol) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
        Please search and select a stock to view details.
      </div>
    );
  }

  if (advancedMode) {
    return (
      <AdvancedChartView
        symbol={symbol}
        name={priceData?.shortName || symbol}
        price={priceData?.regularMarketPrice}
        change={priceData?.regularMarketChange}
        changePercent={(priceData?.regularMarketChangePercent || 0) * 100}
      />
    );
  }

  return (
    <div className="flex flex-col max-w-6xl mx-auto w-full gap-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
        <div className="flex items-center gap-4">
          {detailsLoading ? (
            <Skeleton className="w-16 h-16 rounded-full" />
          ) : (
            <img
              src={`https://api.dicebear.com/10.x/initials/svg?seed=${symbol.replace(".NS", "").replace(".BO", "")}`}
              alt={symbol}
              className="w-16 h-16 rounded-full shadow-md shrink-0"
            />
          )}

          <div className="flex flex-col">
            {detailsLoading ? (
              <>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-24" />
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground capitalize">
                    {(priceData?.shortName || symbol).toLowerCase()}
                  </h1>
                  <WishlistButton 
                    symbol={symbol} 
                    name={priceData?.shortName || symbol} 
                    exchange={priceData?.exchangeName || (symbol.endsWith(".NS") ? "NSE" : "BSE")} 
                  />
                </div>
                <span className="text-sm font-medium text-muted-foreground bg-muted w-fit px-2 py-0.5 mt-1">
                  {symbol.replace(".NS", "").replace(".BO", "")} &bull;{" "}
                  {priceData?.exchangeName}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:items-end">
          {detailsLoading ? (
            <>
              <Skeleton className="h-10 w-32 mb-2" />
              <Skeleton className="h-5 w-24" />
            </>
          ) : (
            <>
              <span className="text-3xl sm:text-4xl font-black">
                ₹{priceData?.regularMarketPrice?.toFixed(2) || "0.00"}
              </span>
              <div
                className={`flex items-center gap-1 font-bold text-sm ${timeframeStats.isPositive ? "text-green-500" : "text-red-500"}`}
              >
                <HugeiconsIcon
                  icon={
                    timeframeStats.isPositive ? ArrowUp01Icon : ArrowDown01Icon
                  }
                  size={18}
                />
                <span>₹{Math.abs(timeframeStats.change).toFixed(2)}</span>
                <span>
                  ({Math.abs(timeframeStats.changePercent).toFixed(2)}%)
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 bg-card p-4 sm:p-6">
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.label}
              onClick={() => setActiveTimeframe(tf)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTimeframe.label === tf.label
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        <div className="h-75 sm:h-100 w-full mt-4 -ml-4">
          {historyLoading ? (
            <Skeleton className="w-full h-full rounded-xl" />
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="formattedTime"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  minTickGap={30}
                />
                <YAxis domain={[minPrice, maxPrice]} hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                  }}
                  itemStyle={{ color: "var(--foreground)", fontWeight: "bold" }}
                  labelStyle={{
                    color: "var(--muted-foreground)",
                    marginBottom: "4px",
                  }}
                  formatter={(value: any) => [
                    `₹${Number(value).toFixed(2)}`,
                    "Price",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="close"
                  stroke={color}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorClose)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No chart data available for this timeframe.
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 flex flex-col gap-4">
          <h2 className="text-xl font-bold">Key Statistics</h2>
          <div className="bg-card border p-5 flex flex-col divide-y">
            <StatRow
              label="Market Cap"
              value={summary?.marketCap ? formatNumber(summary.marketCap) : "-"}
              loading={detailsLoading}
            />
            <StatRow
              label="P/E Ratio"
              value={summary?.trailingPE?.toFixed(2) || "-"}
              loading={detailsLoading}
            />
            <StatRow
              label="Dividend Yield"
              value={
                summary?.dividendYield
                  ? `${(summary.dividendYield * 100).toFixed(2)}%`
                  : "-"
              }
              loading={detailsLoading}
            />
            <StatRow
              label="Volume"
              value={summary?.volume?.toLocaleString() || "-"}
              loading={detailsLoading}
            />
            <StatRow
              label="Avg Vol (3M)"
              value={
                priceData?.averageDailyVolume3Month?.toLocaleString() || "-"
              }
              loading={detailsLoading}
            />
            <StatRow
              label="52W High"
              value={
                summary?.fiftyTwoWeekHigh
                  ? `₹${summary.fiftyTwoWeekHigh.toFixed(2)}`
                  : "-"
              }
              loading={detailsLoading}
            />
            <StatRow
              label="52W Low"
              value={
                summary?.fiftyTwoWeekLow
                  ? `₹${summary.fiftyTwoWeekLow.toFixed(2)}`
                  : "-"
              }
              loading={detailsLoading}
            />
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-4">
          <h2 className="text-xl font-bold">
            About {priceData?.shortName || "Company"}
          </h2>
          <div className="bg-card border p-5 flex flex-col gap-6">
            {detailsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {profile?.longBusinessSummary || "No description available."}
              </p>
            )}

            <div className="flex flex-wrap gap-6 pt-4 border-t">
              <ProfileItem
                label="Sector"
                value={profile?.sector || "-"}
                loading={detailsLoading}
              />
              <ProfileItem
                label="Industry"
                value={profile?.industry || "-"}
                loading={detailsLoading}
              />
              <ProfileItem
                label="Employees"
                value={profile?.fullTimeEmployees?.toLocaleString() || "-"}
                loading={detailsLoading}
              />
            </div>
          </div>
        </div>
      </div>

      {similarStocks && similarStocks.length > 0 && (
        <div className="flex flex-col gap-4 mt-4">
          <h2 className="text-xl font-bold">Similar Stocks</h2>
          <div className="bg-card border overflow-hidden flex flex-col divide-y">
            {similarStocks.map((stock) => (
              <Link
                key={stock.symbol}
                href={`/trade?symbol=${stock.symbol}`}
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 pr-4 flex-1">
                  <img
                    src={`https://api.dicebear.com/10.x/initials/svg?seed=${stock.symbol.replace(".NS", "").replace(".BO", "")}`}
                    alt={stock.symbol}
                    className="w-10 h-10 rounded-full shadow-sm shrink-0"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold truncate text-foreground">
                      {stock.symbol.replace(".NS", "").replace(".BO", "")}
                    </span>
                    <span className="text-xs text-muted-foreground truncate capitalize">
                      {stock.name.toLowerCase()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                  <div className="hidden sm:block">
                    <Sparkline
                      data={stock.sparkline || []}
                      color={stock.change >= 0 ? "#22c55e" : "#ef4444"}
                    />
                  </div>
                  <div className="flex flex-col items-end shrink-0 min-w-17.5">
                    <span className="font-medium text-sm">
                      ₹{stock.price.toFixed(2)}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        stock.change >= 0 ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {stock.change >= 0 ? "+" : ""}
                      {stock.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatRow({
  label,
  value,
  loading,
}: {
  label: string;
  value: string;
  loading: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      {loading ? (
        <Skeleton className="h-4 w-16" />
      ) : (
        <span className="font-semibold text-sm text-right">{value}</span>
      )}
    </div>
  );
}

function ProfileItem({
  label,
  value,
  loading,
}: {
  label: string;
  value: string;
  loading: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
        {label}
      </span>
      {loading ? (
        <Skeleton className="h-5 w-24" />
      ) : (
        <span className="font-medium">{value}</span>
      )}
    </div>
  );
}
