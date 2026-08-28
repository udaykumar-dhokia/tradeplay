"use client";

import { useEffect, useState } from "react";
import Marquee from "react-fast-marquee";
import { axiosClient } from "@/utils/api";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown, ArrowUp } from "@hugeicons/core-free-icons";

interface Quote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

const StockMarquee = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const symbols =
          "RELIANCE.NS,TCS.NS,INFY.NS,HDFCBANK.NS,ICICIBANK.NS,SBIN.NS,BHARTIARTL.NS,ITC.NS,HINDUNILVR.NS,LT.NS,BAJFINANCE.NS,AXISBANK.NS,KOTAKBANK.NS,MARUTI.NS";
        const res = await axiosClient.get(`/stocks/quotes?symbols=${symbols}`);
        if (res.data) {
          setQuotes(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch quotes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotes();

    const interval = setInterval(fetchQuotes, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading || quotes.length === 0) {
    return (
      <div className="sticky top-0 z-40 bg-gray-100 border-b border-gray-200 py-2 h-10.5 w-full shadow-sm"></div>
    );
  }

  return (
    <div className="sticky top-0 z-40 border-t bg-gray-50 border-b border-gray-200 py-2 overflow-hidden flex items-center w-full shadow-sm">
      <Marquee speed={40} gradient={false} pauseOnHover>
        {quotes.map((quote) => {
          const isPositive = quote.change >= 0;
          return (
            <div
              key={quote.symbol}
              className="flex items-center gap-2 mx-6 text-sm whitespace-nowrap"
            >
              <span className="font-semibold text-gray-800">
                {quote.symbol.replace(".NS", "")}
              </span>
              <span className="text-gray-900 font-medium">
                ₹{quote.price.toFixed(2)}
              </span>
              <span
                className={`flex items-center text-xs font-semibold ${
                  isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {isPositive ? (
                  <HugeiconsIcon icon={ArrowUp} size={14} />
                ) : (
                  <HugeiconsIcon icon={ArrowDown} size={14} />
                )}
                {Math.abs(quote.changePercent).toFixed(2)}%
              </span>
            </div>
          );
        })}
      </Marquee>
    </div>
  );
};

export default StockMarquee;
