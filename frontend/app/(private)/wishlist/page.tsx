"use client";

import { useState, useMemo } from "react";
import { useGetWishlistQuery } from "@/lib/features/wishlist/wishlistApi";
import { useGetQuotesQuery } from "@/lib/features/stocks/stocksApi";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { WishlistButton } from "@/components/custom/wishlist-button";
import { Sparkline } from "@/components/custom/sparkline";
import { StockSearch } from "@/components/custom/stock-search";
import { Input } from "@/components/ui/input";
import { Search01Icon, HeartIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";

export default function WishlistPage() {
  const [filterQuery, setFilterQuery] = useState("");

  const { data: wishlistItems, isLoading: isWishlistLoading } =
    useGetWishlistQuery();

  const symbols = useMemo(
    () => wishlistItems?.map((item) => item.symbol).join(",") || "",
    [wishlistItems],
  );

  const { data: quotes, isLoading: isQuotesLoading } = useGetQuotesQuery(
    symbols,
    {
      skip: !symbols,
    },
  );

  const isLoading =
    isWishlistLoading || (symbols.length > 0 && isQuotesLoading);

  const filteredWishlist = useMemo(() => {
    if (!wishlistItems) return [];
    if (!filterQuery.trim()) return wishlistItems;
    const q = filterQuery.toLowerCase().trim();
    return wishlistItems.filter(
      (item) =>
        item.symbol.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q),
    );
  }, [wishlistItems, filterQuery]);

  return (
    <div className="flex flex-col gap-8 w-full pb-10">
      {/* 1. Header Banner matching Explore / Portfolio */}
      <div className="relative h-48 sm:h-64 -mx-4 -mt-4 lg:-mx-6 lg:-mt-6 w-[calc(100%+2rem)] lg:w-[calc(100%+3rem)] overflow-hidden bg-linear-to-br from-primary/90 to-primary/60 flex items-center justify-center shadow-md">
        <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSIgLz4KPHBhdGggZD0iTTAgMEw4IDhaTTAgOEw4IDBaIiBzdHJva2U9IiNmZmYiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiAvPgo8L3N2Zz4=')] bg-repeat"></div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-primary-foreground tracking-tight mb-4">
            Wishlisted Stocks
          </h1>
          <p className="text-primary-foreground/80 max-w-xl mx-auto text-sm sm:text-base">
            Track your favorite stocks and monitor their performance in
            real-time.
          </p>
        </div>
      </div>

      {/* 2. Floating Search Area matching Explore (z-30, no overflow-hidden so dropdown shows) */}
      <div className="w-full flex justify-center -mt-14 relative z-30 px-4 max-w-5xl mx-auto">
        <div className="w-full max-w-2xl bg-white dark:bg-card shadow-lg border">
          <StockSearch
            className="w-full max-w-none!"
            placeholder="Search stocks to add to your wishlist (e.g. RELIANCE, TCS)..."
          />
        </div>
      </div>

      {/* 3. Wishlist Items List Section (relative z-10) */}
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-0 flex flex-col gap-4 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <HugeiconsIcon
              icon={HeartIcon}
              size={22}
              className="text-red-500 fill-current"
            />
            <h2 className="text-xl font-bold">
              Saved Stocks ({filteredWishlist.length}
              {filterQuery && wishlistItems
                ? ` of ${wishlistItems.length}`
                : ""}
              )
            </h2>
          </div>

          {/* Quick filter within saved stocks if user has saved stocks */}
          {wishlistItems && wishlistItems.length > 0 && (
            <div className="relative w-full sm:w-64">
              <HugeiconsIcon
                icon={Search01Icon}
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Filter your saved stocks..."
                className="pl-9 pr-8 h-9 text-xs bg-white dark:bg-card border"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
              />
              {filterQuery && (
                <button
                  type="button"
                  onClick={() => setFilterQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  &times;
                </button>
              )}
            </div>
          )}
        </div>

        <div className="bg-card border overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="flex flex-col">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <Skeleton className="hidden sm:block h-8 w-16" />
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredWishlist.length > 0 ? (
            <div className="flex flex-col divide-y">
              {filteredWishlist.map((item) => {
                const quote = quotes?.find((q) => q.symbol === item.symbol);
                const isPositive = (quote?.change ?? 0) >= 0;

                return (
                  <div
                    key={item.symbol}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group"
                  >
                    <Link
                      href={`/trade?symbol=${item.symbol}`}
                      className="flex items-center gap-3 min-w-0 pr-4 flex-1"
                    >
                      <img
                        src={`https://api.dicebear.com/10.x/initials/svg?seed=${item.symbol.replace(".NS", "").replace(".BO", "")}`}
                        alt={item.symbol}
                        className="w-10 h-10 rounded-full shadow-sm shrink-0"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold truncate text-foreground">
                          {item.symbol.replace(".NS", "").replace(".BO", "")}
                        </span>
                        <span className="text-xs text-muted-foreground truncate capitalize">
                          {item.name.toLowerCase()}
                        </span>
                      </div>
                    </Link>

                    <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                      {/* Graph chart (sparkline) */}
                      <div className="hidden sm:block">
                        <Sparkline
                          data={quote?.sparkline || []}
                          color={isPositive ? "#22c55e" : "#ef4444"}
                        />
                      </div>

                      <div className="flex flex-col items-end shrink-0 min-w-17.5">
                        <span className="font-medium text-sm">
                          ₹
                          {quote?.price !== undefined
                            ? quote.price.toFixed(2)
                            : "—"}
                        </span>
                        {quote?.changePercent !== undefined ? (
                          <span
                            className={cn(
                              "text-xs font-semibold",
                              isPositive ? "text-green-500" : "text-red-500",
                            )}
                          >
                            {isPositive ? "+" : ""}
                            {quote.changePercent.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </div>

                      <WishlistButton
                        symbol={item.symbol}
                        name={item.name}
                        exchange={item.exchange}
                        size={18}
                        className="p-2"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : filterQuery ? (
            <div className="p-10 text-center flex flex-col items-center justify-center">
              <p className="text-muted-foreground mb-3 text-sm">
                No saved stocks match &ldquo;
                <strong>{filterQuery}</strong>&rdquo;
              </p>
              <button
                type="button"
                onClick={() => setFilterQuery("")}
                className="text-primary text-sm font-semibold hover:underline cursor-pointer"
              >
                Clear filter
              </button>
            </div>
          ) : (
            <div className="p-12 text-center flex flex-col items-center justify-center min-h-[240px]">
              <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-3">
                <HugeiconsIcon
                  icon={HeartIcon}
                  size={28}
                  className="fill-current"
                />
              </div>
              <h3 className="text-lg font-bold mb-1">Your wishlist is empty</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                Use the search bar above to find any stock and click the heart
                icon to add it to your wishlist.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
