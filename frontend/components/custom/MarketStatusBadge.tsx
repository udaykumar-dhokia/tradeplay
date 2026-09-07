import { useGetMarketStatusQuery } from "@/lib/features/market/marketApi";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

export const MarketStatusBadge = () => {
  const { data: currentData } = useGetMarketStatusQuery(undefined, { skip: false });

  const pollingInterval = useMemo(() => {
    if (!currentData) return 60000; // default 1 min
    
    if (currentData.status === "CLOSED") {
      // Get current hour in IST
      const currentHourIST = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        hour12: false,
      });
      const hour = parseInt(currentHourIST, 10);

      // If it is between 4 PM (16:00) and 8 AM (08:00) IST, the market is definitely closed for a long time.
      // Poll every 1 hour (3600000ms) to save resources.
      if (hour >= 16 || hour < 8) {
        return 3600000;
      }
      
      // If it's closed but during the day (e.g., weekends or holidays or just before 9 AM), poll every 5 mins.
      return 300000; // 5 mins
    }
    
    // If OPEN or PRE_OPEN, poll every 1 minute
    return 60000;
  }, [currentData?.status]);

  const { data, isLoading, isError } = useGetMarketStatusQuery(undefined, {
    pollingInterval,
  });

  if (isLoading || isError || !data) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border">
        <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
        <span className="text-xs font-medium text-muted-foreground">Checking...</span>
      </div>
    );
  }

  const statusConfig = {
    OPEN: {
      color: "bg-emerald-500",
      textColor: "text-emerald-500",
      borderColor: "border-emerald-500/20",
      bgColor: "bg-emerald-500/10",
      label: "Market Open",
    },
    PRE_OPEN: {
      color: "bg-yellow-500",
      textColor: "text-yellow-600 dark:text-yellow-500",
      borderColor: "border-yellow-500/20",
      bgColor: "bg-yellow-500/10",
      label: "Pre-Open",
    },
    CLOSED: {
      color: "bg-rose-500",
      textColor: "text-rose-500",
      borderColor: "border-rose-500/20",
      bgColor: "bg-rose-500/10",
      label: "Market Closed",
    },
  };

  const config = statusConfig[data.status] || statusConfig.CLOSED;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1 rounded-full border",
        config.bgColor,
        config.borderColor
      )}
    >
      <div className="relative flex h-2 w-2">
        {data.status === "OPEN" && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        )}
        <span className={cn("relative inline-flex rounded-full h-2 w-2", config.color)}></span>
      </div>
      <span className={cn("text-xs font-medium", config.textColor)}>
        {config.label}
      </span>
    </div>
  );
};
