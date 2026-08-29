"use client";

import { useGetTopMoversQuery } from "@/lib/features/stocks/stocksApi";
import { StockSearch } from "@/components/custom/stock-search";
import { ArrowUp01Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkline } from "@/components/custom/sparkline";

export default function ExplorePage() {
  const { data: movers, isLoading } = useGetTopMoversQuery();

  return (
    <div className="flex flex-col gap-8 w-full pb-10">
      <div className="relative h-48 sm:h-64 -mx-4 -mt-4 lg:-mx-6 lg:-mt-6 w-[calc(100%+2rem)] lg:w-[calc(100%+3rem)] overflow-hidden bg-linear-to-br from-primary/90 to-primary/60 flex items-center justify-center shadow-md">
        <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSIgLz4KPHBhdGggZD0iTTAgMEw4IDhaTTAgOEw4IDBaIiBzdHJva2U9IiNmZmYiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiAvPgo8L3N2Zz4=')] bg-repeat"></div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-primary-foreground tracking-tight mb-4">
            Explore Stocks
          </h1>
          <p className="text-primary-foreground/80 max-w-xl mx-auto text-sm sm:text-base">
            Discover the top moving equities in the Indian market, updated in
            real-time.
          </p>
        </div>
      </div>

      <div className="w-full flex justify-center -mt-14 relative z-20 px-4 max-w-5xl mx-auto">
        <div className="w-full max-w-2xl bg-white shadow-lg border">
          <StockSearch className="w-full max-w-none!" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4 sm:px-0 max-w-5xl mx-auto w-full">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 text-green-500">
              <HugeiconsIcon icon={ArrowUp01Icon} size={24} />
            </div>
            <h2 className="text-xl font-bold">Top Gainers</h2>
          </div>

          <div className="bg-card border overflow-hidden shadow-sm">
            {isLoading ? (
              <div className="flex flex-col">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 border-b last:border-0"
                  >
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                    <Skeleton className="h-8 w-16" />
                  </div>
                ))}
              </div>
            ) : movers?.gainers?.length ? (
              <div className="flex flex-col divide-y">
                {movers.gainers.map((stock) => (
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
                          {stock.symbol}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {stock.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                      <div className="hidden sm:block">
                        <Sparkline
                          data={stock.sparkline || []}
                          color="#22c55e"
                        />
                      </div>
                      <div className="flex flex-col items-end shrink-0 min-w-17.5">
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
              <div className="p-8 text-center text-muted-foreground">
                No gainers found.
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 text-red-500">
              <HugeiconsIcon icon={ArrowDown01Icon} size={24} />
            </div>
            <h2 className="text-xl font-bold">Top Losers</h2>
          </div>

          <div className="bg-card border overflow-hidden shadow-sm">
            {isLoading ? (
              <div className="flex flex-col">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 border-b last:border-0"
                  >
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                    <Skeleton className="h-8 w-16" />
                  </div>
                ))}
              </div>
            ) : movers?.losers?.length ? (
              <div className="flex flex-col divide-y">
                {movers.losers.map((stock) => (
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
                          {stock.symbol}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {stock.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                      <div className="hidden sm:block">
                        <Sparkline
                          data={stock.sparkline || []}
                          color="#ef4444"
                        />
                      </div>
                      <div className="flex flex-col items-end shrink-0 min-w-17.5">
                        <span className="font-medium text-sm">
                          ₹{stock.price.toFixed(2)}
                        </span>
                        <span className="text-xs font-semibold text-red-500">
                          {stock.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                No losers found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
