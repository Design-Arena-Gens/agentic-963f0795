'use client';

import { SupportResistanceLevels, PriceReaction, Pattern, TradingSignal } from '@/lib/tradingLogic';

interface AnalysisPanelProps {
  levels: SupportResistanceLevels | null;
  reactions: PriceReaction[];
  patterns: Pattern[];
  signal: TradingSignal | null;
}

export default function AnalysisPanel({ levels, reactions, patterns, signal }: AnalysisPanelProps) {
  if (!levels) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 text-gray-400">
        Loading analysis...
      </div>
    );
  }

  const formatPrice = (price: number) => price.toFixed(2);
  const formatPercent = (value: number) => value.toFixed(2) + '%';

  const recentReactions = reactions.slice(-10).reverse();

  return (
    <div className="space-y-4">
      {/* Trading Signal */}
      {signal && (
        <div className={`rounded-lg p-6 ${
          signal.type === 'BUY' ? 'bg-green-900/30 border-2 border-green-500' :
          signal.type === 'SELL' ? 'bg-red-900/30 border-2 border-red-500' :
          'bg-gray-900 border-2 border-gray-700'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold flex items-center gap-3">
              {signal.type === 'BUY' && <span className="text-green-400">🟢 BUY SIGNAL</span>}
              {signal.type === 'SELL' && <span className="text-red-400">🔴 SELL SIGNAL</span>}
              {signal.type === 'NEUTRAL' && <span className="text-gray-400">⚪ NEUTRAL</span>}
            </h3>
            {signal.confidence > 0 && (
              <div className="text-right">
                <div className="text-sm text-gray-400">Confidence</div>
                <div className="text-2xl font-bold">{signal.confidence.toFixed(0)}%</div>
              </div>
            )}
          </div>

          <p className="text-gray-300 mb-4">{signal.reason}</p>

          {signal.type !== 'NEUTRAL' && (
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Entry</div>
                <div className="font-mono font-bold text-lg">${formatPrice(signal.entry)}</div>
              </div>
              <div>
                <div className="text-gray-400">Stop Loss</div>
                <div className="font-mono font-bold text-lg text-red-400">${formatPrice(signal.stopLoss)}</div>
              </div>
              <div>
                <div className="text-gray-400">Take Profit</div>
                <div className="font-mono font-bold text-lg text-green-400">${formatPrice(signal.takeProfit)}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Support & Resistance Levels */}
      <div className="bg-gray-900 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">Support & Resistance Levels</h3>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="text-red-400 font-semibold mb-3 flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500 rounded"></span>
              Resistance Levels
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-red-900/20 rounded">
                <span className="font-mono">A1</span>
                <span className="font-mono font-bold">${formatPrice(levels.resistance.A1)}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-red-900/20 rounded">
                <span className="font-mono">A2</span>
                <span className="font-mono font-bold">${formatPrice(levels.resistance.A2)}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-red-900/20 rounded">
                <span className="font-mono">A3</span>
                <span className="font-mono font-bold">${formatPrice(levels.resistance.A3)}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-red-900/20 rounded">
                <span className="font-mono">A4</span>
                <span className="font-mono font-bold">${formatPrice(levels.resistance.A4)}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded"></span>
              Support Levels
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-green-900/20 rounded">
                <span className="font-mono">B1</span>
                <span className="font-mono font-bold">${formatPrice(levels.support.B1)}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-green-900/20 rounded">
                <span className="font-mono">B2</span>
                <span className="font-mono font-bold">${formatPrice(levels.support.B2)}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-green-900/20 rounded">
                <span className="font-mono">B3</span>
                <span className="font-mono font-bold">${formatPrice(levels.support.B3)}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-green-900/20 rounded">
                <span className="font-mono">B4</span>
                <span className="font-mono font-bold">${formatPrice(levels.support.B4)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-yellow-900/20 rounded border border-yellow-700">
          <div className="text-sm text-gray-400">First 5-min Candle Range</div>
          <div className="flex justify-between mt-1">
            <span className="font-mono">High (A): <span className="font-bold">${formatPrice(levels.firstCandle.high)}</span></span>
            <span className="font-mono">Low (B): <span className="font-bold">${formatPrice(levels.firstCandle.low)}</span></span>
          </div>
        </div>
      </div>

      {/* Detected Patterns */}
      {patterns.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">Detected Patterns</h3>
          <div className="space-y-3">
            {patterns.map((pattern, idx) => (
              <div key={idx} className="p-4 bg-blue-900/20 rounded border border-blue-700">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-blue-300">{pattern.name}</h4>
                  <div className="flex gap-4 text-sm">
                    <span className="text-gray-400">
                      Occurrences: <span className="font-bold text-white">{pattern.occurrences}</span>
                    </span>
                    <span className="text-gray-400">
                      Success Rate: <span className="font-bold text-green-400">{pattern.successRate}%</span>
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-300">{pattern.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Price Reactions */}
      <div className="bg-gray-900 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">Recent Price Reactions</h3>
        {recentReactions.length > 0 ? (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {recentReactions.map((reaction, idx) => (
              <div
                key={idx}
                className={`p-3 rounded flex justify-between items-center ${
                  reaction.type === 'resistance' ? 'bg-red-900/20' : 'bg-green-900/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`font-mono font-bold ${
                    reaction.type === 'resistance' ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {reaction.levelName}
                  </span>
                  <span className="text-gray-400">${formatPrice(reaction.level)}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded text-sm font-semibold ${
                    reaction.reactionType === 'bounce' ? 'bg-blue-500/30 text-blue-300' :
                    reaction.reactionType === 'breakout' ? 'bg-purple-500/30 text-purple-300' :
                    'bg-orange-500/30 text-orange-300'
                  }`}>
                    {reaction.reactionType.toUpperCase()}
                  </span>
                  <span className="text-gray-400 text-sm">
                    Strength: <span className="font-bold">{formatPercent(reaction.strength)}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-4">No reactions detected yet</div>
        )}
      </div>
    </div>
  );
}
