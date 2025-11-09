export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface SupportResistanceLevels {
  resistance: {
    A1: number;
    A2: number;
    A3: number;
    A4: number;
  };
  support: {
    B1: number;
    B2: number;
    B3: number;
    B4: number;
  };
  firstCandle: Candle;
}

export interface PriceReaction {
  level: number;
  levelName: string;
  type: 'support' | 'resistance';
  reactionType: 'bounce' | 'breakout' | 'rejection';
  strength: number;
  timestamp: number;
}

export interface TradingSignal {
  type: 'BUY' | 'SELL' | 'NEUTRAL';
  confidence: number;
  reason: string;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  timestamp: number;
}

export interface Pattern {
  name: string;
  occurrences: number;
  successRate: number;
  description: string;
}

/**
 * Calculate support and resistance levels based on first 5-minute candle
 */
export function calculateLevels(firstCandle: Candle): SupportResistanceLevels {
  const A = firstCandle.high;
  const B = firstCandle.low;

  // Resistance levels (RED)
  const A1 = A + (A * 0.0009);
  const A2 = A1 + (A1 * 0.0018);
  const A3 = A2 + (A2 * 0.0036);
  const A4 = A3 + (A3 * 0.0072);

  // Support levels (GREEN)
  const B1 = B - (B * 0.0009);
  const B2 = B1 - (B1 * 0.0018);
  const B3 = B2 - (B2 * 0.0036);
  const B4 = B3 - (B3 * 0.0072);

  return {
    resistance: { A1, A2, A3, A4 },
    support: { B1, B2, B3, B4 },
    firstCandle
  };
}

/**
 * Analyze price reactions to support/resistance levels
 */
export function analyzePriceReactions(
  candles: Candle[],
  levels: SupportResistanceLevels
): PriceReaction[] {
  const reactions: PriceReaction[] = [];
  const tolerance = 0.0005; // 0.05% tolerance for level touches

  const allLevels = [
    { value: levels.resistance.A1, name: 'A1', type: 'resistance' as const },
    { value: levels.resistance.A2, name: 'A2', type: 'resistance' as const },
    { value: levels.resistance.A3, name: 'A3', type: 'resistance' as const },
    { value: levels.resistance.A4, name: 'A4', type: 'resistance' as const },
    { value: levels.support.B1, name: 'B1', type: 'support' as const },
    { value: levels.support.B2, name: 'B2', type: 'support' as const },
    { value: levels.support.B3, name: 'B3', type: 'support' as const },
    { value: levels.support.B4, name: 'B4', type: 'support' as const },
  ];

  for (let i = 1; i < candles.length; i++) {
    const prevCandle = candles[i - 1];
    const currentCandle = candles[i];

    allLevels.forEach(level => {
      const touchesLevel =
        (currentCandle.low <= level.value * (1 + tolerance) &&
         currentCandle.high >= level.value * (1 - tolerance));

      if (touchesLevel) {
        let reactionType: 'bounce' | 'breakout' | 'rejection' = 'bounce';
        let strength = 0;

        if (level.type === 'resistance') {
          if (currentCandle.close > level.value && currentCandle.high > level.value * 1.001) {
            reactionType = 'breakout';
            strength = ((currentCandle.close - level.value) / level.value) * 100;
          } else if (currentCandle.close < currentCandle.open && currentCandle.high >= level.value) {
            reactionType = 'rejection';
            strength = ((level.value - currentCandle.close) / level.value) * 100;
          } else {
            reactionType = 'bounce';
            strength = Math.abs((currentCandle.close - level.value) / level.value) * 100;
          }
        } else {
          if (currentCandle.close < level.value && currentCandle.low < level.value * 0.999) {
            reactionType = 'breakout';
            strength = ((level.value - currentCandle.close) / level.value) * 100;
          } else if (currentCandle.close > currentCandle.open && currentCandle.low <= level.value) {
            reactionType = 'bounce';
            strength = ((currentCandle.close - level.value) / level.value) * 100;
          } else {
            reactionType = 'rejection';
            strength = Math.abs((currentCandle.close - level.value) / level.value) * 100;
          }
        }

        reactions.push({
          level: level.value,
          levelName: level.name,
          type: level.type,
          reactionType,
          strength: Math.abs(strength),
          timestamp: currentCandle.time
        });
      }
    });
  }

  return reactions;
}

/**
 * Detect repeating behavioral patterns
 */
export function detectPatterns(reactions: PriceReaction[]): Pattern[] {
  const patterns: Pattern[] = [];

  // Pattern 1: Multiple bounces at same level
  const levelBounces: { [key: string]: number } = {};
  reactions.forEach(r => {
    if (r.reactionType === 'bounce') {
      levelBounces[r.levelName] = (levelBounces[r.levelName] || 0) + 1;
    }
  });

  Object.entries(levelBounces).forEach(([level, count]) => {
    if (count >= 2) {
      patterns.push({
        name: `Multiple Bounces at ${level}`,
        occurrences: count,
        successRate: 75 + (count * 5),
        description: `Price has bounced ${count} times at level ${level}, indicating strong ${level.startsWith('A') ? 'resistance' : 'support'}`
      });
    }
  });

  // Pattern 2: Breakout followed by retest
  for (let i = 1; i < reactions.length; i++) {
    if (reactions[i - 1].reactionType === 'breakout' &&
        reactions[i].reactionType === 'bounce' &&
        reactions[i - 1].levelName === reactions[i].levelName) {
      patterns.push({
        name: `Breakout-Retest Pattern at ${reactions[i].levelName}`,
        occurrences: 1,
        successRate: 85,
        description: `Breakout at ${reactions[i].levelName} followed by successful retest`
      });
    }
  }

  // Pattern 3: Sequential level breaks
  const resistanceBreaks = reactions.filter(r =>
    r.type === 'resistance' && r.reactionType === 'breakout'
  );
  const supportBreaks = reactions.filter(r =>
    r.type === 'support' && r.reactionType === 'breakout'
  );

  if (resistanceBreaks.length >= 2) {
    patterns.push({
      name: 'Uptrend - Sequential Resistance Breaks',
      occurrences: resistanceBreaks.length,
      successRate: 70 + (resistanceBreaks.length * 5),
      description: `Strong uptrend with ${resistanceBreaks.length} resistance levels broken`
    });
  }

  if (supportBreaks.length >= 2) {
    patterns.push({
      name: 'Downtrend - Sequential Support Breaks',
      occurrences: supportBreaks.length,
      successRate: 70 + (supportBreaks.length * 5),
      description: `Strong downtrend with ${supportBreaks.length} support levels broken`
    });
  }

  // Pattern 4: Rejection streaks
  const rejections = reactions.filter(r => r.reactionType === 'rejection');
  if (rejections.length >= 3) {
    patterns.push({
      name: 'High Rejection Activity',
      occurrences: rejections.length,
      successRate: 60,
      description: `${rejections.length} rejections detected - market indecision or consolidation`
    });
  }

  return patterns;
}

/**
 * Generate trading signals based on analysis
 */
export function generateSignals(
  currentCandle: Candle,
  levels: SupportResistanceLevels,
  reactions: PriceReaction[],
  patterns: Pattern[]
): TradingSignal {
  let signalType: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
  let confidence = 0;
  let reason = '';
  let entry = currentCandle.close;
  let stopLoss = 0;
  let takeProfit = 0;

  const currentPrice = currentCandle.close;
  const recentReactions = reactions.slice(-5);

  // Check proximity to levels
  const supportLevels = [levels.support.B1, levels.support.B2, levels.support.B3, levels.support.B4];
  const resistanceLevels = [levels.resistance.A1, levels.resistance.A2, levels.resistance.A3, levels.resistance.A4];

  const nearSupport = supportLevels.find(s => Math.abs(currentPrice - s) / s < 0.002);
  const nearResistance = resistanceLevels.find(r => Math.abs(currentPrice - r) / r < 0.002);

  // BUY Signal Logic
  if (nearSupport) {
    const supportBounces = recentReactions.filter(r =>
      r.type === 'support' && r.reactionType === 'bounce'
    ).length;

    const uptrendPattern = patterns.find(p => p.name.includes('Uptrend'));

    if (supportBounces >= 2 || uptrendPattern) {
      signalType = 'BUY';
      confidence = Math.min(95, 60 + (supportBounces * 10) + (uptrendPattern ? 15 : 0));
      reason = `Price near support ${nearSupport.toFixed(2)} with ${supportBounces} recent bounces`;
      entry = currentPrice;
      stopLoss = nearSupport * 0.997;
      takeProfit = resistanceLevels[0];
    }
  }

  // SELL Signal Logic
  if (nearResistance) {
    const resistanceRejections = recentReactions.filter(r =>
      r.type === 'resistance' && r.reactionType === 'rejection'
    ).length;

    const downtrendPattern = patterns.find(p => p.name.includes('Downtrend'));

    if (resistanceRejections >= 2 || downtrendPattern) {
      signalType = 'SELL';
      confidence = Math.min(95, 60 + (resistanceRejections * 10) + (downtrendPattern ? 15 : 0));
      reason = `Price near resistance ${nearResistance.toFixed(2)} with ${resistanceRejections} recent rejections`;
      entry = currentPrice;
      stopLoss = nearResistance * 1.003;
      takeProfit = supportLevels[0];
    }
  }

  // Breakout signals
  const lastReaction = recentReactions[recentReactions.length - 1];
  if (lastReaction && lastReaction.reactionType === 'breakout') {
    if (lastReaction.type === 'resistance') {
      signalType = 'BUY';
      confidence = Math.min(90, 70 + lastReaction.strength * 2);
      reason = `Resistance breakout at ${lastReaction.levelName} - momentum continuation`;
      entry = currentPrice;
      stopLoss = lastReaction.level * 0.998;
      takeProfit = resistanceLevels[resistanceLevels.indexOf(lastReaction.level) + 1] || lastReaction.level * 1.01;
    } else {
      signalType = 'SELL';
      confidence = Math.min(90, 70 + lastReaction.strength * 2);
      reason = `Support breakdown at ${lastReaction.levelName} - momentum continuation`;
      entry = currentPrice;
      stopLoss = lastReaction.level * 1.002;
      takeProfit = supportLevels[supportLevels.indexOf(lastReaction.level) + 1] || lastReaction.level * 0.99;
    }
  }

  if (signalType === 'NEUTRAL') {
    reason = 'No clear signal - monitoring price action';
    confidence = 0;
  }

  return {
    type: signalType,
    confidence,
    reason,
    entry,
    stopLoss,
    takeProfit,
    timestamp: currentCandle.time
  };
}

/**
 * Generate realistic market data for demonstration
 */
export function generateMarketData(basePrice: number = 50000, days: number = 1): Candle[] {
  const candles: Candle[] = [];
  const now = Date.now();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  let currentPrice = basePrice;
  const candlesPerDay = (24 * 60) / 5; // 5-minute candles

  for (let day = 0; day < days; day++) {
    for (let i = 0; i < candlesPerDay; i++) {
      const timestamp = startOfDay.getTime() + (day * 24 * 60 * 60 * 1000) + (i * 5 * 60 * 1000);

      const volatility = 0.002;
      const trend = (Math.random() - 0.5) * 0.001;

      const open = currentPrice;
      const change = (Math.random() - 0.5) * basePrice * volatility + (basePrice * trend);
      const close = open + change;

      const high = Math.max(open, close) * (1 + Math.random() * volatility);
      const low = Math.min(open, close) * (1 - Math.random() * volatility);

      candles.push({
        time: timestamp,
        open,
        high,
        low,
        close,
        volume: Math.floor(Math.random() * 1000000) + 500000
      });

      currentPrice = close;
    }
  }

  return candles;
}
