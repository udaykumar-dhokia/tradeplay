"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { useLazySearchStocksQuery } from "@/lib/features/stocks/stocksApi";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { WishlistButton } from "@/components/custom/wishlist-button";

export const StockSearch = ({
  className,
  placeholder = "Search (e.g. RELIANCE, TCS)...",
}: {
  className?: string;
  placeholder?: string;
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const debouncedQuery = useDebounce(query, 300);
  const [triggerSearch, { data: results, isFetching, isLoading }] =
    useLazySearchStocksQuery();

  useEffect(() => {
    if (debouncedQuery.trim().length > 0) {
      triggerSearch(debouncedQuery);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [debouncedQuery, triggerSearch]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const showLoading = isFetching || isLoading;

  return (
    <div className={cn("relative w-full", className)} ref={wrapperRef}>
      <div className="relative">
        <HugeiconsIcon
          icon={Search01Icon}
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          className="pl-9 pr-14 bg-muted/50 border-transparent focus-visible:bg-background focus-visible:border-primary w-full"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim().length > 0) setIsOpen(true);
          }}
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
          {showLoading ? (
            <svg
              className="animate-spin h-4 w-4 text-muted-foreground"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            <Kbd className="hidden lg:inline-flex" title="Ctrl + K">
              Ctrl K
            </Kbd>
          )}
        </div>
      </div>

      {isOpen && (results || showLoading) && (
        <div className="absolute top-full mt-2 w-full bg-background border rounded-md shadow-lg overflow-hidden z-50">
          {showLoading && (!results || results.length === 0) ? (
            <div className="p-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-4 w-4 text-muted-foreground"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Searching stocks...
            </div>
          ) : results?.length === 0 && !showLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No stocks found.
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results?.map((stock) => (
                <li
                  key={stock.symbol}
                  className="px-4 py-2 hover:bg-accent hover:text-accent-foreground flex items-center justify-between group transition-colors"
                >
                  <div
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                    onClick={() => {
                      setIsOpen(false);
                      setQuery("");
                      router.push(`/trade?symbol=${stock.symbol}`);
                    }}
                  >
                    <img
                      src={`https://api.dicebear.com/10.x/initials/svg?seed=${stock.symbol.replace(".NS", "").replace(".BO", "")}`}
                      alt={stock.symbol}
                      className="w-8 h-8 rounded-full shadow-sm shrink-0"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-sm truncate">
                        {stock.symbol.replace(".NS", "").replace(".BO", "")}
                      </span>
                      <span className="text-xs text-muted-foreground truncate capitalize">
                        {stock.name.toLowerCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-xs font-medium bg-muted px-2 py-1 rounded">
                      {stock.exchange}
                    </span>
                    <WishlistButton
                      symbol={stock.symbol}
                      name={stock.name}
                      exchange={stock.exchange}
                      size={16}
                      className="p-1.5 hover:bg-background/80"
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
