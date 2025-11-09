'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, UTCTimestamp } from 'lightweight-charts';
import { Candle, SupportResistanceLevels } from '@/lib/tradingLogic';

interface TradingChartProps {
  candles: Candle[];
  levels: SupportResistanceLevels | null;
}

export default function TradingChart({ candles, levels }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#0a0a0a' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: '#1f2937' },
        horzLines: { color: '#1f2937' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 600,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#374151',
      },
      crosshair: {
        mode: 1,
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderUpColor: '#10b981',
      borderDownColor: '#ef4444',
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!candlestickSeriesRef.current || candles.length === 0) return;

    const formattedCandles = candles.map(candle => ({
      time: (candle.time / 1000) as UTCTimestamp,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));

    candlestickSeriesRef.current.setData(formattedCandles);
  }, [candles]);

  useEffect(() => {
    if (!chartRef.current || !levels) return;

    // Remove existing price lines
    chartRef.current.options();

    const resistanceLevels = [
      { value: levels.resistance.A1, label: 'A1' },
      { value: levels.resistance.A2, label: 'A2' },
      { value: levels.resistance.A3, label: 'A3' },
      { value: levels.resistance.A4, label: 'A4' },
    ];

    const supportLevels = [
      { value: levels.support.B1, label: 'B1' },
      { value: levels.support.B2, label: 'B2' },
      { value: levels.support.B3, label: 'B3' },
      { value: levels.support.B4, label: 'B4' },
    ];

    if (candlestickSeriesRef.current) {
      // Draw resistance levels (RED)
      resistanceLevels.forEach(level => {
        candlestickSeriesRef.current!.createPriceLine({
          price: level.value,
          color: '#ef4444',
          lineWidth: 2,
          lineStyle: 2,
          axisLabelVisible: true,
          title: level.label,
        });
      });

      // Draw support levels (GREEN)
      supportLevels.forEach(level => {
        candlestickSeriesRef.current!.createPriceLine({
          price: level.value,
          color: '#10b981',
          lineWidth: 2,
          lineStyle: 2,
          axisLabelVisible: true,
          title: level.label,
        });
      });

      // Highlight first candle range
      const firstCandle = levels.firstCandle;
      candlestickSeriesRef.current.createPriceLine({
        price: firstCandle.high,
        color: '#fbbf24',
        lineWidth: 1,
        lineStyle: 0,
        axisLabelVisible: true,
        title: 'First High (A)',
      });

      candlestickSeriesRef.current.createPriceLine({
        price: firstCandle.low,
        color: '#fbbf24',
        lineWidth: 1,
        lineStyle: 0,
        axisLabelVisible: true,
        title: 'First Low (B)',
      });
    }
  }, [levels]);

  return (
    <div className="w-full bg-gray-900 rounded-lg p-4">
      <div ref={chartContainerRef} className="w-full" />
    </div>
  );
}
