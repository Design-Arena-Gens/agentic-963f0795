'use client';

import { useEffect, useState } from 'react';
import TradingChart from '@/components/TradingChart';
import AnalysisPanel from '@/components/AnalysisPanel';
import {
  Candle,
  SupportResistanceLevels,
  PriceReaction,
  Pattern,
  TradingSignal,
  calculateLevels,
  analyzePriceReactions,
  detectPatterns,
  generateSignals,
  generateMarketData,
} from '@/lib/tradingLogic';

export default function Home() {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [levels, setLevels] = useState<SupportResistanceLevels | null>(null);
  const [reactions, setReactions] = useState<PriceReaction[]>([]);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [signal, setSignal] = useState<TradingSignal | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [basePrice, setBasePrice] = useState(50000);

  // Initialize with market data
  useEffect(() => {
    initializeMarket();
  }, []);

  // Live updates simulation
  useEffect(() => {
    if (!isLive || candles.length === 0) return;

    const interval = setInterval(() => {
      setCandles(prevCandles => {
        const lastCandle = prevCandles[prevCandles.length - 1];
        const volatility = 0.002;
        const trend = (Math.random() - 0.5) * 0.001;

        const open = lastCandle.close;
        const change = (Math.random() - 0.5) * basePrice * volatility + (basePrice * trend);
        const close = open + change;
        const high = Math.max(open, close) * (1 + Math.random() * volatility);
        const low = Math.min(open, close) * (1 - Math.random() * volatility);

        const newCandle: Candle = {
          time: lastCandle.time + 5 * 60 * 1000,
          open,
          high,
          low,
          close,
          volume: Math.floor(Math.random() * 1000000) + 500000,
        };

        return [...prevCandles, newCandle];
      });
    }, 2000); // Update every 2 seconds for demo

    return () => clearInterval(interval);
  }, [isLive, candles.length, basePrice]);

  // Recalculate analysis when candles update
  useEffect(() => {
    if (candles.length < 2) return;

    const firstCandle = candles[0];
    const calculatedLevels = calculateLevels(firstCandle);
    setLevels(calculatedLevels);

    const priceReactions = analyzePriceReactions(candles, calculatedLevels);
    setReactions(priceReactions);

    const detectedPatterns = detectPatterns(priceReactions);
    setPatterns(detectedPatterns);

    const currentCandle = candles[candles.length - 1];
    const tradingSignal = generateSignals(currentCandle, calculatedLevels, priceReactions, detectedPatterns);
    setSignal(tradingSignal);
  }, [candles]);

  const initializeMarket = () => {
    const marketData = generateMarketData(basePrice, 1);
    setCandles(marketData);
  };

  const handleReset = () => {
    setIsLive(false);
    initializeMarket();
  };

  const handlePriceChange = (newPrice: number) => {
    setBasePrice(newPrice);
    setIsLive(false);
    const marketData = generateMarketData(newPrice, 1);
    setCandles(marketData);
  };

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 shadow-2xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            AI Trading & Chart Analysis Agent
          </h1>
          <p className="text-blue-100">
            Automated support/resistance detection, pattern recognition, and signal generation
          </p>
        </div>

        {/* Controls */}
        <div className="bg-gray-900 rounded-lg p-4 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4 items-center flex-wrap">
            <button
              onClick={() => setIsLive(!isLive)}
              className={`px-6 py-2 rounded font-semibold transition-colors ${
                isLive
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isLive ? '⏸ Pause' : '▶ Start Live Feed'}
            </button>

            <button
              onClick={handleReset}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded font-semibold transition-colors"
            >
              🔄 Reset
            </button>

            <div className="flex items-center gap-2">
              <label htmlFor="basePrice" className="text-sm text-gray-400">
                Base Price:
              </label>
              <input
                id="basePrice"
                type="number"
                value={basePrice}
                onChange={(e) => handlePriceChange(Number(e.target.value))}
                className="w-32 px-3 py-2 bg-gray-800 rounded border border-gray-700 text-white font-mono"
                step="1000"
                min="1000"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`}></div>
            <span className="text-sm text-gray-400">
              {isLive ? 'Live' : 'Paused'} • {candles.length} candles
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="lg:col-span-2">
            <TradingChart candles={candles} levels={levels} />
          </div>

          {/* Analysis Panel */}
          <div className="lg:col-span-1">
            <AnalysisPanel
              levels={levels}
              reactions={reactions}
              patterns={patterns}
              signal={signal}
            />
          </div>
        </div>

        {/* Info Footer */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-3">How It Works</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div>
              <h4 className="font-semibold text-white mb-2">📊 Level Calculation</h4>
              <p>Based on the first 5-minute candle of the day:</p>
              <ul className="list-disc list-inside mt-1 space-y-1 text-xs">
                <li>Resistance: A1-A4 (red lines) calculated from high</li>
                <li>Support: B1-B4 (green lines) calculated from low</li>
                <li>Formula: geometric progression with increasing percentages</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">🎯 Pattern Detection</h4>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Multiple bounces at same level</li>
                <li>Breakout and retest patterns</li>
                <li>Sequential level breaks (trends)</li>
                <li>Rejection clusters (consolidation)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">⚡ Signal Generation</h4>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>BUY: Near support with bounce history</li>
                <li>SELL: Near resistance with rejection history</li>
                <li>Breakout signals with momentum continuation</li>
                <li>Confidence based on pattern strength</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">📈 Live Analysis</h4>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Real-time price reaction tracking</li>
                <li>Dynamic signal updates</li>
                <li>Risk management with stop loss/take profit</li>
                <li>Pattern recognition and success rates</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
