import { Time } from 'lightweight-charts';
import { ForexPair } from '../types';

export interface CandlePoint {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

export function getTimeframeSeconds(tf: string): number {
  switch (tf) {
    case 'M1': return 60;
    case 'M5': return 300;
    case 'M15': return 900;
    case 'M30': return 1800;
    case 'H1': return 3600;
    case 'H4': return 14400;
    case 'D1': return 86400;
    default: return 900;
  }
}

/**
 * Generates realistic candlestick price action ending exactly at pair.basePrice
 */
export function generateCandlestickHistory(
  pair: ForexPair,
  timeframe: string = 'M15',
  count: number = 100
): CandlePoint[] {
  const stepSec = getTimeframeSeconds(timeframe);
  const nowSec = Math.floor(Date.now() / 1000);
  const startTime = nowSec - (count * stepSec);
  const pip = pair.pipMultiplier;
  const targetClose = pair.basePrice;

  // Typical candle volatility for this asset
  const baseVolatility = pip * (pair.id === 'XAUUSD' ? 12 : pair.category === 'Crypto' ? 35 : 10);
  
  // Starting price with a realistic market trend
  let currentPrice = targetClose - (baseVolatility * 14);

  const candles: CandlePoint[] = [];

  for (let i = 0; i < count; i++) {
    const time = (startTime + (i * stepSec)) as unknown as Time;
    const progress = i / count;

    // Gradual drift towards current price, with oscillations, order blocks, and pullbacks
    const meanReversion = (targetClose - currentPrice) * (progress > 0.75 ? 0.3 : 0.08);
    const noise = (Math.random() - 0.48) * baseVolatility * (0.6 + Math.random() * 0.8);
    const delta = noise + meanReversion;

    const open = Number(currentPrice.toFixed(pair.decimals));
    let close = i === count - 1 
      ? targetClose 
      : Number((open + delta).toFixed(pair.decimals));

    const maxBody = Math.max(open, close);
    const minBody = Math.min(open, close);

    const upperWick = Math.random() * baseVolatility * 0.45;
    const lowerWick = Math.random() * baseVolatility * 0.45;

    const high = Number((maxBody + upperWick).toFixed(pair.decimals));
    const low = Number((minBody - lowerWick).toFixed(pair.decimals));

    candles.push({
      time,
      open,
      high,
      low,
      close,
    });

    currentPrice = close;
  }

  return candles;
}
