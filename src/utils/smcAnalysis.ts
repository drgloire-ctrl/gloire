import { Time } from 'lightweight-charts';
import { ForexPair } from '../types';
import { CandlePoint } from './chartData';

export type OrderBlockType = 'BULLISH_DEMAND' | 'BEARISH_SUPPLY';
export type OrderBlockStatus = 'UNMITIGATED' | 'TESTED' | 'MITIGATED';

export interface InstitutionalOrderBlock {
  id: string;
  type: OrderBlockType;
  candleIndex: number;
  time: Time;
  lastCandleTime: Time;
  high: number;
  low: number;
  equilibrium: number; // 50% Mean Threshold
  pipRange: number;
  displacementPips: number;
  strengthScore: number; // 0 - 100
  status: OrderBlockStatus;
  testCount: number;
  hasFVG: boolean;
  fvgZone?: { high: number; low: number };
  rationale: string;
}

/**
 * Calculates Institutional Order Blocks (areas of supply and demand)
 * from historical candlestick price action using Smart Money Concepts (SMC).
 */
export function detectInstitutionalOrderBlocks(
  candles: CandlePoint[],
  pair: ForexPair,
  options: {
    minDisplacementMultiplier?: number;
    lookback?: number;
  } = {}
): InstitutionalOrderBlock[] {
  if (!candles || candles.length < 10) return [];

  const pip = pair.pipMultiplier;
  const decimals = pair.decimals;
  const minMult = options.minDisplacementMultiplier || 1.8;
  const count = candles.length;
  const orderBlocks: InstitutionalOrderBlock[] = [];

  // Calculate average candle body size to measure institutional displacement
  let totalBody = 0;
  for (let i = 0; i < count; i++) {
    totalBody += Math.abs(candles[i].close - candles[i].open);
  }
  const avgBody = Math.max(pip * 2, totalBody / count);

  for (let i = 2; i < count - 4; i++) {
    const current = candles[i];
    const isBearish = current.close < current.open;
    const isBullish = current.close > current.open;

    // 1. BULLISH ORDER BLOCK (DEMAND ZONE)
    // Last bearish candle before a violent upward impulse breaking previous local highs
    if (isBearish) {
      const next1 = candles[i + 1];
      const next2 = candles[i + 2];
      const next3 = candles[i + 3] || next2;

      // Net upward displacement over the next 1-3 candles
      const displacement = Math.max(next1.high, next2.high, next3.high) - current.high;
      const impulsiveMove = displacement > avgBody * minMult;

      // Break of local structure (higher than previous 3 candle highs)
      const prevHigh = Math.max(candles[i - 1].high, candles[i - 2].high);
      const isBOS = Math.max(next1.close, next2.close) > prevHigh;

      if (impulsiveMove && isBOS) {
        const obHigh = Math.max(current.open, current.high);
        const obLow = current.low;
        const eq = Number(((obHigh + obLow) / 2).toFixed(decimals));
        const pipRange = Number(((obHigh - obLow) / pip).toFixed(1));
        const dispPips = Number((displacement / pip).toFixed(1));

        // Check for Fair Value Gap (FVG) between candle[i] and candle[i+2]
        const hasFVG = next2.low > current.high;
        const fvgZone = hasFVG ? { high: next2.low, low: current.high } : undefined;

        // Check subsequent mitigation
        let testCount = 0;
        let isMitigated = false;

        for (let j = i + 3; j < count; j++) {
          const testCandle = candles[j];
          if (testCandle.low <= obHigh && testCandle.high >= obLow) {
            testCount++;
          }
          // Full invalidation / penetration
          if (testCandle.close < obLow) {
            isMitigated = true;
            break;
          }
        }

        const status: OrderBlockStatus = isMitigated
          ? 'MITIGATED'
          : testCount > 0
          ? 'TESTED'
          : 'UNMITIGATED';

        const strength = Math.min(
          99,
          Math.round(75 + (dispPips / (avgBody / pip)) * 3.5 + (hasFVG ? 8 : 0) - (testCount * 6))
        );

        orderBlocks.push({
          id: `ob-bullish-${i}`,
          type: 'BULLISH_DEMAND',
          candleIndex: i,
          time: current.time,
          lastCandleTime: candles[count - 1].time,
          high: obHigh,
          low: obLow,
          equilibrium: eq,
          pipRange,
          displacementPips: dispPips,
          strengthScore: Math.max(65, strength),
          status,
          testCount,
          hasFVG,
          fvgZone,
          rationale: `Order Block Acheteur institutionnel (Zone de Demande). Impulsion haussière de +${dispPips} pips avec rupture de structure (BOS).`,
        });
      }
    }

    // 2. BEARISH ORDER BLOCK (SUPPLY ZONE)
    // Last bullish candle before a violent downward impulse breaking previous local lows
    if (isBullish) {
      const next1 = candles[i + 1];
      const next2 = candles[i + 2];
      const next3 = candles[i + 3] || next2;

      // Net downward displacement over next 1-3 candles
      const displacement = current.low - Math.min(next1.low, next2.low, next3.low);
      const impulsiveMove = displacement > avgBody * minMult;

      // Break of local structure
      const prevLow = Math.min(candles[i - 1].low, candles[i - 2].low);
      const isBOS = Math.min(next1.close, next2.close) < prevLow;

      if (impulsiveMove && isBOS) {
        const obHigh = current.high;
        const obLow = Math.min(current.open, current.low);
        const eq = Number(((obHigh + obLow) / 2).toFixed(decimals));
        const pipRange = Number(((obHigh - obLow) / pip).toFixed(1));
        const dispPips = Number((displacement / pip).toFixed(1));

        // Check for Bearish FVG between candle[i] and candle[i+2]
        const hasFVG = next2.high < current.low;
        const fvgZone = hasFVG ? { high: current.low, low: next2.high } : undefined;

        let testCount = 0;
        let isMitigated = false;

        for (let j = i + 3; j < count; j++) {
          const testCandle = candles[j];
          if (testCandle.high >= obLow && testCandle.low <= obHigh) {
            testCount++;
          }
          if (testCandle.close > obHigh) {
            isMitigated = true;
            break;
          }
        }

        const status: OrderBlockStatus = isMitigated
          ? 'MITIGATED'
          : testCount > 0
          ? 'TESTED'
          : 'UNMITIGATED';

        const strength = Math.min(
          99,
          Math.round(75 + (dispPips / (avgBody / pip)) * 3.5 + (hasFVG ? 8 : 0) - (testCount * 6))
        );

        orderBlocks.push({
          id: `ob-bearish-${i}`,
          type: 'BEARISH_SUPPLY',
          candleIndex: i,
          time: current.time,
          lastCandleTime: candles[count - 1].time,
          high: obHigh,
          low: obLow,
          equilibrium: eq,
          pipRange,
          displacementPips: dispPips,
          strengthScore: Math.max(65, strength),
          status,
          testCount,
          hasFVG,
          fvgZone,
          rationale: `Order Block Vendeur institutionnel (Zone d'Offre). Impulsion baissière de -${dispPips} pips avec rejet net.`,
        });
      }
    }
  }

  // Deduplicate very close overlapping blocks and sort by most recent
  return orderBlocks
    .filter((ob, idx, self) => {
      // Keep blocks that aren't exact duplicates
      return idx === self.findIndex((t) => Math.abs(t.high - ob.high) < pip * 1.5);
    })
    .sort((a, b) => b.candleIndex - a.candleIndex);
}
