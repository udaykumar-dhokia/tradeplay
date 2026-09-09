"use client";

import { useState, useEffect } from "react";
import {
  useExecuteTradeMutation,
  useGetPositionsQuery,
} from "@/lib/features/transactions/transactionsApi";
import { useGetCurrentBalanceQuery } from "@/lib/features/portfolio/portfolioApi";
import { cn } from "@/lib/utils";
import { MarketStatusBadge } from "./MarketStatusBadge";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Wallet02Icon } from "@hugeicons/core-free-icons";
import { toast } from "@/components/ui/toast";

interface TradeOrderPanelProps {
  symbol: string;
  name: string;
  exchange: string;
  currentPrice?: number;
  isOpen: boolean;
  onClose: () => void;
  orderType: "BUY" | "SELL";
  setOrderType: (type: "BUY" | "SELL") => void;
  initialQuantity?: number;
}

export const TradeOrderPanel = ({
  symbol,
  name,
  exchange,
  currentPrice = 0,
  isOpen,
  onClose,
  orderType,
  setOrderType,
  initialQuantity,
}: TradeOrderPanelProps) => {
  const [quantity, setQuantity] = useState<number | "">(initialQuantity || "");
  const [executeTrade, { isLoading }] = useExecuteTradeMutation();
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const { data: balanceData } = useGetCurrentBalanceQuery();
  const { data: positionsData } = useGetPositionsQuery();

  const currentBalance = parseFloat(balanceData?.current_balance || "0");
  const position = positionsData?.positions?.find(
    (p: any) => p.symbol === symbol,
  );
  const ownedQuantity = position?.quantity || 0;

  useEffect(() => {
    setErrorMsg("");
    setSuccessMsg("");
    if (initialQuantity && initialQuantity > 0) {
      setQuantity(initialQuantity);
    } else if (!isOpen) {
      setQuantity("");
    }
  }, [symbol, orderType, isOpen, initialQuantity]);

  const cleanSymbol = symbol.replace(".NS", "").replace(".BO", "");
  const estimatedValue = currentPrice * (Number(quantity) || 0);

  const handleTrade = async () => {
    const qtyNum = Number(quantity);
    if (!qtyNum || qtyNum <= 0) return;

    setErrorMsg("");
    setSuccessMsg("");

    try {
      await executeTrade({
        symbol,
        name,
        exchange,
        type: orderType,
        quantity: qtyNum,
        price: currentPrice,
      }).unwrap();

      const message = `Successfully executed ${orderType} order for ${qtyNum} share${qtyNum > 1 ? "s" : ""} of ${cleanSymbol}.`;
      setSuccessMsg(message);
      toast.add({
        title: `${orderType === "BUY" ? "Buy" : "Sell"} Order Executed`,
        description: message,
        type: "success",
      });
      setQuantity("");
      onClose();
    } catch (err: any) {
      const msg =
        err.data?.message ||
        err.message ||
        "An error occurred while executing trade";
      setErrorMsg(msg);
      toast.add({
        title: "Order Failed",
        description: msg,
        type: "error",
      });
    }
  };

  const handleQuickQty = (add: number) => {
    setQuantity((prev) => {
      const current = typeof prev === "number" ? prev : 0;
      return current + add;
    });
    setErrorMsg("");
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 sm:hidden animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Trade Sheet / Bottom-Right Floating Card */}
      <div
        className={cn(
          "fixed z-50 bg-card border border-border text-card-foreground shadow-sm overflow-hidden flex flex-col",
          // Mobile: Bottom sheet docked to bottom screen
          "bottom-0 inset-x-0 max-h-[90vh]",
          // Desktop: Docked in bottom-right corner
          "sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-105 sm:max-h-[85vh]",
          "animate-in slide-in-from-bottom-6 duration-200",
        )}
      >
        {/* Mobile drag handle */}
        <div className="w-10 h-1 bg-muted-foreground/20 rounded-full mx-auto mt-2 sm:hidden" />

        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between gap-2 bg-muted/20">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-extrabold text-base sm:text-lg truncate">
              {cleanSymbol}
            </span>
            <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground uppercase">
              {exchange || "NSE"}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="font-bold text-sm text-foreground ml-1">
              ₹{currentPrice.toFixed(2)}
            </span>
            <button
              onClick={onClose}
              className="p-1  text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Close"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Buy / Sell Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-muted/40 border-b gap-1.5">
          <button
            onClick={() => {
              setOrderType("BUY");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={cn(
              "py-2 px-4  text-xs font-bold uppercase transition-all tracking-wider flex items-center justify-center gap-1.5",
              orderType === "BUY"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60",
            )}
          >
            <span>Buy</span>
            {orderType === "BUY" && (
              <span className="text-[10px] opacity-80">• Market</span>
            )}
          </button>
          <button
            onClick={() => {
              setOrderType("SELL");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={cn(
              "py-2 px-4  text-xs font-bold uppercase transition-all tracking-wider flex items-center justify-center gap-1.5",
              orderType === "SELL"
                ? "bg-rose-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60",
            )}
          >
            <span>Sell</span>
            {orderType === "SELL" && (
              <span className="text-[10px] opacity-80">• Market</span>
            )}
          </button>
        </div>

        {/* Card Body */}
        <div className="p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto">
          {/* Quantity Input */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <label className="text-muted-foreground tracking-wider text-[11px]">
                Quantity
              </label>
              {orderType === "SELL" && (
                <span className="text-muted-foreground">
                  Owned:{" "}
                  <strong className="text-foreground">{ownedQuantity}</strong>{" "}
                  shares
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => {
                  const val = e.target.value;
                  setQuantity(val === "" ? "" : Math.max(0, parseInt(val, 10)));
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                placeholder="0"
                className="w-full bg-background border border-input  px-3 py-2.5 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground pointer-events-none">
                SHARES
              </span>
            </div>

            {/* Quick Quantity Chips */}
            <div className="flex items-center gap-1.5 pt-1 overflow-x-auto pb-1 scrollbar-hide">
              <span className="text-[11px] text-muted-foreground font-medium mr-1 shrink-0">
                Quick:
              </span>
              {[1, 5, 10, 25, 50].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleQuickQty(num)}
                  className="px-2 py-1 text-xs font-semibold rounded bg-muted hover:bg-muted/80 text-foreground shrink-0 transition-colors"
                >
                  +{num}
                </button>
              ))}
              {orderType === "SELL" && ownedQuantity > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setQuantity(ownedQuantity);
                    setErrorMsg("");
                  }}
                  className="px-2 py-1 text-xs font-bold rounded bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 shrink-0 transition-colors ml-auto"
                >
                  Sell All ({ownedQuantity})
                </button>
              )}
            </div>
          </div>

          {/* Pricing & Balances Summary */}
          <div className="bg-muted/30 border  p-3 flex flex-col gap-2 text-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Price per share</span>
              <span className="font-semibold text-foreground">
                ₹{currentPrice.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-border/50 pt-2 text-muted-foreground">
              <span className="flex items-center gap-1">
                <HugeiconsIcon icon={Wallet02Icon} size={13} />
                <span>Available Funds</span>
              </span>
              <span className="font-semibold text-foreground">
                ₹
                {currentBalance.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-border/50 pt-2">
              <span className="font-bold text-sm text-foreground">
                Total Estimated
              </span>
              <span className="font-black text-base text-foreground">
                ₹
                {estimatedValue.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          {/* Feedback Banners */}
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs  font-medium leading-relaxed">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs  font-medium leading-relaxed">
              {successMsg}
            </div>
          )}

          {/* Submit Action Button */}
          <button
            disabled={!quantity || quantity <= 0 || isLoading}
            onClick={handleTrade}
            className={cn(
              "w-full py-3 font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2 shadow-sm",
              orderType === "BUY"
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-rose-600 text-white hover:bg-rose-700",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            {isLoading ? (
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>
                {orderType === "BUY" ? "Place Buy Order" : "Place Sell Order"} •
                ₹{estimatedValue.toFixed(2)}
              </span>
            )}
          </button>
        </div>
      </div>
    </>
  );
};
