"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
  createChart,
  ColorType,
  IChartApi,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  CrosshairMode,
} from "lightweight-charts";
import { useGetStockHistoryQuery } from "@/lib/features/stocks/stocksApi";
import { skipToken } from "@reduxjs/toolkit/query";

// ---------- TYPES ----------
interface ChartCandle {
  time: any;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface AdvancedChartViewProps {
  symbol: string;
  name?: string;
  price?: number;
  change?: number;
  changePercent?: number;
}

// ---------- CONSTANTS ----------
const TIMEFRAMES = [
  { label: "1m", range: "1d", interval: "1m" },
  { label: "5m", range: "1d", interval: "5m" },
  { label: "15m", range: "5d", interval: "15m" },
  { label: "1H", range: "1mo", interval: "60m" },
  { label: "1D", range: "1y", interval: "1d" },
  { label: "1W", range: "5y", interval: "1wk" },
  { label: "1M", range: "max", interval: "1mo" },
];

const CHART_TYPES = [
  { label: "Candles", value: "candles" },
  { label: "Line", value: "line" },
];

const INDICATORS = [
  { label: "SMA 20", key: "sma20" },
  { label: "SMA 50", key: "sma50" },
  { label: "EMA 12", key: "ema12" },
  { label: "EMA 26", key: "ema26" },
  { label: "Bollinger Bands", key: "bb" },
  { label: "Volume", key: "volume" },
  { label: "VWAP", key: "vwap" },
];

// ---------- INDICATOR HELPERS ----------
function calcSMA(data: ChartCandle[], period: number) {
  const result: { time: any; value: number }[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) sum += data[i - j].close;
    result.push({ time: data[i].time, value: sum / period });
  }
  return result;
}

function calcEMA(data: ChartCandle[], period: number) {
  const result: { time: any; value: number }[] = [];
  const k = 2 / (period + 1);
  let ema = data[0].close;
  result.push({ time: data[0].time, value: ema });
  for (let i = 1; i < data.length; i++) {
    ema = data[i].close * k + ema * (1 - k);
    if (i >= period - 1) result.push({ time: data[i].time, value: ema });
  }
  return result;
}

function calcBollingerBands(data: ChartCandle[], period = 20, mult = 2) {
  const upper: { time: any; value: number }[] = [];
  const lower: { time: any; value: number }[] = [];
  const middle: { time: any; value: number }[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) sum += data[i - j].close;
    const sma = sum / period;
    let sqSum = 0;
    for (let j = 0; j < period; j++) sqSum += (data[i - j].close - sma) ** 2;
    const std = Math.sqrt(sqSum / period);
    middle.push({ time: data[i].time, value: sma });
    upper.push({ time: data[i].time, value: sma + mult * std });
    lower.push({ time: data[i].time, value: sma - mult * std });
  }
  return { upper, middle, lower };
}

function calcVWAP(data: ChartCandle[]) {
  const result: { time: any; value: number }[] = [];
  let cumVol = 0;
  let cumTPV = 0;
  for (let i = 0; i < data.length; i++) {
    const tp = (data[i].high + data[i].low + data[i].close) / 3;
    cumVol += data[i].volume;
    cumTPV += tp * data[i].volume;
    if (cumVol > 0) result.push({ time: data[i].time, value: cumTPV / cumVol });
  }
  return result;
}

// ---------- COMPONENT ----------
export const AdvancedChartView: React.FC<AdvancedChartViewProps> = ({
  symbol,
  name,
  price,
  change,
  changePercent,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const indicatorSeriesRef = useRef<any[]>([]);

  const [activeTimeframe, setActiveTimeframe] = useState(TIMEFRAMES[4]); // 1D default
  const [chartType, setChartType] = useState("candles");
  const [activeIndicators, setActiveIndicators] = useState<string[]>(["volume"]);
  const [showIndicatorMenu, setShowIndicatorMenu] = useState(false);
  const [crosshairData, setCrosshairData] = useState<{
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    volume?: number;
    time?: string;
  } | null>(null);

  const { data: history, isLoading } = useGetStockHistoryQuery(
    symbol
      ? {
          symbol,
          range: activeTimeframe.range,
          interval: activeTimeframe.interval,
        }
      : skipToken,
  );

  // Format candles
  const chartData: ChartCandle[] = useMemo(() => {
    if (!history?.candles) return [];
    return history.candles
      .map((c: any) => {
        let timeVal: any;
        if (typeof c.time === "string") {
          const d = new Date(c.time);
          if (!isNaN(d.getTime())) {
            timeVal = c.time.includes("T")
              ? Math.floor(d.getTime() / 1000)
              : c.time.split("T")[0];
          } else {
            timeVal = c.time;
          }
        } else {
          timeVal = Math.floor(c.time / 1000);
        }
        return {
          time: timeVal,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volume || 0,
        };
      })
      .sort((a: ChartCandle, b: ChartCandle) => {
        if (typeof a.time === "number" && typeof b.time === "number")
          return a.time - b.time;
        if (typeof a.time === "string" && typeof b.time === "string")
          return a.time.localeCompare(b.time);
        return 0;
      })
      .filter(
        (v: ChartCandle, i: number, a: ChartCandle[]) =>
          i === 0 || v.time !== a[i - 1].time,
      );
  }, [history]);

  const toggleIndicator = useCallback((key: string) => {
    setActiveIndicators((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }, []);

  // Chart rendering
  useEffect(() => {
    if (!chartContainerRef.current || chartData.length === 0) return;

    // Clean up previous chart safely
    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch {
        // chart already disposed
      }
      chartRef.current = null;
    }
    indicatorSeriesRef.current = [];

    const container = chartContainerRef.current;

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "#131722" },
        textColor: "#d1d4dc",
        fontSize: 12,
      },
      grid: {
        vertLines: { color: "#1e222d" },
        horzLines: { color: "#1e222d" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "#758696",
          width: 1,
          style: 3,
          labelBackgroundColor: "#2962FF",
        },
        horzLine: {
          color: "#758696",
          width: 1,
          style: 3,
          labelBackgroundColor: "#2962FF",
        },
      },
      rightPriceScale: {
        borderColor: "#2B2B43",
        scaleMargins: {
          top: 0.1,
          bottom: activeIndicators.includes("volume") ? 0.25 : 0.05,
        },
      },
      timeScale: {
        borderColor: "#2B2B43",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        minBarSpacing: 3,
      },
      width: container.clientWidth,
      height: container.clientHeight,
    });

    chartRef.current = chart;

    // Main series
    if (chartType === "candles") {
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#26a69a",
        downColor: "#ef5350",
        borderVisible: false,
        wickUpColor: "#26a69a",
        wickDownColor: "#ef5350",
      });
      candleSeries.setData(chartData);
    } else {
      const lineSeries = chart.addSeries(LineSeries, {
        color: "#2962FF",
        lineWidth: 2,
      });
      lineSeries.setData(
        chartData.map((d) => ({ time: d.time, value: d.close })),
      );
    }

    // Volume
    if (activeIndicators.includes("volume")) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: "volume" },
        priceScaleId: "vol",
      });
      chart.priceScale("vol").applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });
      volumeSeries.setData(
        chartData.map((d) => ({
          time: d.time,
          value: d.volume,
          color:
            d.close >= d.open
              ? "rgba(38, 166, 154, 0.5)"
              : "rgba(239, 83, 80, 0.5)",
        })),
      );
      indicatorSeriesRef.current.push(volumeSeries);
    }

    // SMA 20
    if (activeIndicators.includes("sma20")) {
      const series = chart.addSeries(LineSeries, {
        color: "#f59e0b",
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      series.setData(calcSMA(chartData, 20));
      indicatorSeriesRef.current.push(series);
    }

    // SMA 50
    if (activeIndicators.includes("sma50")) {
      const series = chart.addSeries(LineSeries, {
        color: "#8b5cf6",
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      series.setData(calcSMA(chartData, 50));
      indicatorSeriesRef.current.push(series);
    }

    // EMA 12
    if (activeIndicators.includes("ema12")) {
      const series = chart.addSeries(LineSeries, {
        color: "#06b6d4",
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      series.setData(calcEMA(chartData, 12));
      indicatorSeriesRef.current.push(series);
    }

    // EMA 26
    if (activeIndicators.includes("ema26")) {
      const series = chart.addSeries(LineSeries, {
        color: "#ec4899",
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      series.setData(calcEMA(chartData, 26));
      indicatorSeriesRef.current.push(series);
    }

    // Bollinger Bands
    if (activeIndicators.includes("bb")) {
      const bb = calcBollingerBands(chartData);
      const upperSeries = chart.addSeries(LineSeries, {
        color: "rgba(100, 181, 246, 0.7)",
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      upperSeries.setData(bb.upper);
      const middleSeries = chart.addSeries(LineSeries, {
        color: "rgba(100, 181, 246, 0.4)",
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      middleSeries.setData(bb.middle);
      const lowerSeries = chart.addSeries(LineSeries, {
        color: "rgba(100, 181, 246, 0.7)",
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      lowerSeries.setData(bb.lower);
      indicatorSeriesRef.current.push(upperSeries, middleSeries, lowerSeries);
    }

    // VWAP
    if (activeIndicators.includes("vwap")) {
      const series = chart.addSeries(LineSeries, {
        color: "#a78bfa",
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      series.setData(calcVWAP(chartData));
      indicatorSeriesRef.current.push(series);
    }

    // Crosshair move handler
    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.time) {
        setCrosshairData(null);
        return;
      }
      const candle = chartData.find((c) => c.time === param.time);
      if (candle) {
        setCrosshairData({
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
        });
      }
    });

    chart.timeScale().fitContent();

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      if (!chartRef.current) return;
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        try {
          chartRef.current.applyOptions({ width, height });
        } catch {
          // chart may be disposed during resize
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      try {
        chart.remove();
      } catch {
        // already disposed
      }
      chartRef.current = null;
    };
  }, [chartData, chartType, activeIndicators]);

  const isUp = (change ?? 0) >= 0;
  const displaySymbol = symbol.replace(".NS", "").replace(".BO", "");

  // Choose display data: crosshair hover or last candle
  const displayOHLC = crosshairData || (chartData.length > 0 ? chartData[chartData.length - 1] : null);

  return (
    <div className="fixed inset-0 z-50 bg-[#131722] flex flex-col text-[#d1d4dc]" style={{ top: 0, left: 0 }}>
      {/* Top toolbar */}
      <div className="flex items-center h-12 border-b border-[#2B2B43] px-3 gap-2 shrink-0 overflow-x-auto">
        {/* Symbol & Price */}
        <div className="flex items-center gap-3 pr-3 border-r border-[#2B2B43] shrink-0">
          <span className="text-sm font-bold text-white">{displaySymbol}</span>
          {price !== undefined && (
            <span className="text-sm font-semibold text-white">
              ₹{price.toFixed(2)}
            </span>
          )}
          {change !== undefined && changePercent !== undefined && (
            <span
              className={`text-xs font-bold ${isUp ? "text-[#26a69a]" : "text-[#ef5350]"}`}
            >
              {isUp ? "+" : ""}
              {change.toFixed(2)} ({changePercent.toFixed(2)}%)
            </span>
          )}
        </div>

        {/* Timeframes */}
        <div className="flex items-center gap-0.5 pr-3 border-r border-[#2B2B43] shrink-0">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.label}
              onClick={() => setActiveTimeframe(tf)}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                activeTimeframe.label === tf.label
                  ? "bg-[#2962FF] text-white"
                  : "text-[#787b86] hover:text-white hover:bg-[#2a2e39]"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* Chart type */}
        <div className="flex items-center gap-0.5 pr-3 border-r border-[#2B2B43] shrink-0">
          {CHART_TYPES.map((ct) => (
            <button
              key={ct.value}
              onClick={() => setChartType(ct.value)}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                chartType === ct.value
                  ? "bg-[#2a2e39] text-white"
                  : "text-[#787b86] hover:text-white hover:bg-[#2a2e39]"
              }`}
            >
              {ct.label}
            </button>
          ))}
        </div>

        {/* Indicators button */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowIndicatorMenu(!showIndicatorMenu)}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              showIndicatorMenu
                ? "bg-[#2962FF] text-white"
                : "text-[#787b86] hover:text-white hover:bg-[#2a2e39]"
            }`}
          >
            Indicators{" "}
            {activeIndicators.filter((i) => i !== "volume").length > 0 && (
              <span className="ml-1 bg-[#2962FF] text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {activeIndicators.filter((i) => i !== "volume").length}
              </span>
            )}
          </button>

          {showIndicatorMenu && (
            <div className="absolute top-full left-0 mt-1 bg-[#1e222d] border border-[#2B2B43] rounded-lg shadow-xl z-50 w-52 py-1">
              {INDICATORS.map((ind) => (
                <button
                  key={ind.key}
                  onClick={() => toggleIndicator(ind.key)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-[#2a2e39] flex items-center justify-between"
                >
                  <span>{ind.label}</span>
                  {activeIndicators.includes(ind.key) && (
                    <span className="text-[#2962FF] font-bold">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* OHLCV display */}
        {displayOHLC && (
          <div className="flex items-center gap-3 ml-auto text-[10px] font-mono shrink-0">
            <span>
              O{" "}
              <span className={displayOHLC.close! >= displayOHLC.open! ? "text-[#26a69a]" : "text-[#ef5350]"}>
                {displayOHLC.open?.toFixed(2)}
              </span>
            </span>
            <span>
              H{" "}
              <span className={displayOHLC.close! >= displayOHLC.open! ? "text-[#26a69a]" : "text-[#ef5350]"}>
                {displayOHLC.high?.toFixed(2)}
              </span>
            </span>
            <span>
              L{" "}
              <span className={displayOHLC.close! >= displayOHLC.open! ? "text-[#26a69a]" : "text-[#ef5350]"}>
                {displayOHLC.low?.toFixed(2)}
              </span>
            </span>
            <span>
              C{" "}
              <span className={displayOHLC.close! >= displayOHLC.open! ? "text-[#26a69a]" : "text-[#ef5350]"}>
                {displayOHLC.close?.toFixed(2)}
              </span>
            </span>
            {displayOHLC.volume !== undefined && (
              <span>
                Vol{" "}
                <span className="text-[#787b86]">
                  {displayOHLC.volume >= 1e6
                    ? `${(displayOHLC.volume / 1e6).toFixed(2)}M`
                    : displayOHLC.volume >= 1e3
                      ? `${(displayOHLC.volume / 1e3).toFixed(1)}K`
                      : displayOHLC.volume}
                </span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Active indicators legend */}
      {activeIndicators.filter((i) => i !== "volume").length > 0 && (
        <div className="flex items-center gap-3 px-3 h-7 border-b border-[#2B2B43] text-[10px] shrink-0 overflow-x-auto">
          {activeIndicators.includes("sma20") && (
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-[#f59e0b] inline-block rounded" />
              <span className="text-[#f59e0b]">SMA 20</span>
            </span>
          )}
          {activeIndicators.includes("sma50") && (
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-[#8b5cf6] inline-block rounded" />
              <span className="text-[#8b5cf6]">SMA 50</span>
            </span>
          )}
          {activeIndicators.includes("ema12") && (
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-[#06b6d4] inline-block rounded" />
              <span className="text-[#06b6d4]">EMA 12</span>
            </span>
          )}
          {activeIndicators.includes("ema26") && (
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-[#ec4899] inline-block rounded" />
              <span className="text-[#ec4899]">EMA 26</span>
            </span>
          )}
          {activeIndicators.includes("bb") && (
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-[#64b5f6] inline-block rounded" />
              <span className="text-[#64b5f6]">BB(20,2)</span>
            </span>
          )}
          {activeIndicators.includes("vwap") && (
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-[#a78bfa] inline-block rounded" />
              <span className="text-[#a78bfa]">VWAP</span>
            </span>
          )}
        </div>
      )}

      {/* Chart area */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#131722]/80 z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-[#2962FF] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-[#787b86]">Loading chart data...</span>
            </div>
          </div>
        )}
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
};
