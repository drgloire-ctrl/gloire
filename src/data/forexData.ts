import { ForexPair, ForexSignal, TradingSettings } from '../types';

export const FOREX_PAIRS: ForexPair[] = [
  {
    id: 'XAUUSD',
    name: 'XAU / USD (Or / Gold)',
    symbol: 'XAUUSD',
    tvSymbol: 'OANDA:XAUUSD',
    category: 'Commodity',
    basePrice: 2685.40,
    decimals: 2,
    pipMultiplier: 0.1,
    spreadPips: 1.8,
    change24h: 0.85,
    high24h: 2698.00,
    low24h: 2664.50,
  },
  {
    id: 'EURUSD',
    name: 'EUR / USD',
    symbol: 'EURUSD',
    tvSymbol: 'FX:EURUSD',
    category: 'Major',
    basePrice: 1.08642,
    decimals: 5,
    pipMultiplier: 0.0001,
    spreadPips: 0.5,
    change24h: 0.34,
    high24h: 1.08920,
    low24h: 1.08310,
  },
  {
    id: 'GBPUSD',
    name: 'GBP / USD',
    symbol: 'GBPUSD',
    tvSymbol: 'FX:GBPUSD',
    category: 'Major',
    basePrice: 1.29450,
    decimals: 5,
    pipMultiplier: 0.0001,
    spreadPips: 0.9,
    change24h: -0.15,
    high24h: 1.29820,
    low24h: 1.29110,
  },
  {
    id: 'USDJPY',
    name: 'USD / JPY',
    symbol: 'USDJPY',
    tvSymbol: 'FX:USDJPY',
    category: 'Major',
    basePrice: 153.420,
    decimals: 3,
    pipMultiplier: 0.01,
    spreadPips: 0.7,
    change24h: 0.42,
    high24h: 153.850,
    low24h: 152.920,
  },
  {
    id: 'EURGBP',
    name: 'EUR / GBP',
    symbol: 'EURGBP',
    tvSymbol: 'FX:EURGBP',
    category: 'Cross',
    basePrice: 0.87236,
    decimals: 5,
    pipMultiplier: 0.0001,
    spreadPips: 0.8,
    change24h: 0.19,
    high24h: 0.87410,
    low24h: 0.87080,
  },
  {
    id: 'BTCUSD',
    name: 'BTC / USD (Bitcoin)',
    symbol: 'BTCUSD',
    tvSymbol: 'BINANCE:BTCUSDT',
    category: 'Crypto',
    basePrice: 67450.00,
    decimals: 2,
    pipMultiplier: 1.0,
    spreadPips: 5.0,
    change24h: 2.45,
    high24h: 68100.00,
    low24h: 66300.00,
  },
  {
    id: 'ETHUSD',
    name: 'ETH / USD (Ethereum)',
    symbol: 'ETHUSD',
    tvSymbol: 'BINANCE:ETHUSDT',
    category: 'Crypto',
    basePrice: 2540.50,
    decimals: 2,
    pipMultiplier: 0.1,
    spreadPips: 1.5,
    change24h: 1.80,
    high24h: 2585.00,
    low24h: 2490.00,
  },
  {
    id: 'XAGUSD',
    name: 'XAG / USD (Argent / Silver)',
    symbol: 'XAGUSD',
    tvSymbol: 'OANDA:XAGUSD',
    category: 'Commodity',
    basePrice: 31.850,
    decimals: 3,
    pipMultiplier: 0.01,
    spreadPips: 1.2,
    change24h: 1.15,
    high24h: 32.200,
    low24h: 31.400,
  },
  {
    id: 'US30',
    name: 'US30 (Dow Jones)',
    symbol: 'US30',
    tvSymbol: 'FOREXCOM:DJI',
    category: 'Indices',
    basePrice: 43280.0,
    decimals: 1,
    pipMultiplier: 1.0,
    spreadPips: 2.5,
    change24h: 0.48,
    high24h: 43450.0,
    low24h: 43100.0,
  },
  {
    id: 'USOIL',
    name: 'USOIL (Pétrole Brut WTI)',
    symbol: 'USOIL',
    tvSymbol: 'TVC:USOIL',
    category: 'Commodity',
    basePrice: 71.65,
    decimals: 2,
    pipMultiplier: 0.01,
    spreadPips: 2.0,
    change24h: -0.85,
    high24h: 72.80,
    low24h: 71.10,
  },
  {
    id: 'AUDUSD',
    name: 'AUD / USD',
    symbol: 'AUDUSD',
    tvSymbol: 'FX:AUDUSD',
    category: 'Major',
    basePrice: 0.65820,
    decimals: 5,
    pipMultiplier: 0.0001,
    spreadPips: 1.1,
    change24h: 0.28,
    high24h: 0.66050,
    low24h: 0.65510,
  },
  {
    id: 'USDCAD',
    name: 'USD / CAD',
    symbol: 'USDCAD',
    tvSymbol: 'FX:USDCAD',
    category: 'Major',
    basePrice: 1.38120,
    decimals: 5,
    pipMultiplier: 0.0001,
    spreadPips: 1.2,
    change24h: -0.22,
    high24h: 1.38540,
    low24h: 1.37850,
  },
  {
    id: 'USDCHF',
    name: 'USD / CHF',
    symbol: 'USDCHF',
    tvSymbol: 'FX:USDCHF',
    category: 'Major',
    basePrice: 0.86540,
    decimals: 5,
    pipMultiplier: 0.0001,
    spreadPips: 1.0,
    change24h: -0.10,
    high24h: 0.86800,
    low24h: 0.86350,
  },
  {
    id: 'GBPJPY',
    name: 'GBP / JPY (Dragon)',
    symbol: 'GBPJPY',
    tvSymbol: 'FX:GBPJPY',
    category: 'Cross',
    basePrice: 198.650,
    decimals: 3,
    pipMultiplier: 0.01,
    spreadPips: 1.4,
    change24h: 0.62,
    high24h: 199.200,
    low24h: 197.800,
  },
];

export const INITIAL_SIGNALS: ForexSignal[] = [
  {
    id: 'sig-xau',
    pairId: 'XAUUSD',
    pairName: 'XAU / USD (Or / Gold)',
    type: 'BUY',
    status: 'ACTIVE',
    timeframe: 'M15',
    entryPrice: 2685.40,
    stopLoss: 2674.00,
    tp1: 2698.00,
    tp2: 2712.00,
    tp3: 2735.00,
    riskReward: '4.3:1',
    confidence: 93,
    timestamp: 'Il y a 6 min',
    pipsGained: 126,
    rationale: 'Rebond puissant sur l\'Order Block M15 + Rupture haussière (BOS) avec afflux massif de capitaux refuges.',
  },
  {
    id: 'sig-1',
    pairId: 'EURGBP',
    pairName: 'EUR / GBP',
    type: 'BUY',
    status: 'ACTIVE',
    timeframe: 'M15',
    entryPrice: 0.87236,
    stopLoss: 0.87210,
    tp1: 0.87260,
    tp2: 0.87280,
    tp3: 0.87300,
    riskReward: '3:1',
    confidence: 88,
    timestamp: 'Il y a 12 min',
    pipsGained: 14,
    rationale: 'Rejet propre de l\'Order Block M15 + Balayage de liquidité asiatique + MACD en expansion haussière.',
  },
  {
    id: 'sig-2',
    pairId: 'EURUSD',
    pairName: 'EUR / USD',
    type: 'BUY',
    status: 'ACTIVE',
    timeframe: 'H1',
    entryPrice: 1.08642,
    stopLoss: 1.08400,
    tp1: 1.08950,
    tp2: 1.09250,
    tp3: 1.09600,
    riskReward: '3.9:1',
    confidence: 91,
    timestamp: 'Il y a 22 min',
    pipsGained: 24,
    rationale: 'Break of Structure (BOS) H1 après déclaration BCE. Entrée sniper sur Fair Value Gap.',
  },
  {
    id: 'sig-btc',
    pairId: 'BTCUSD',
    pairName: 'BTC / USD (Bitcoin)',
    type: 'BUY',
    status: 'ACTIVE',
    timeframe: 'H1',
    entryPrice: 67450.00,
    stopLoss: 66600.00,
    tp1: 68400.00,
    tp2: 69500.00,
    tp3: 71000.00,
    riskReward: '4.1:1',
    confidence: 89,
    timestamp: 'Il y a 18 min',
    pipsGained: 650,
    rationale: 'Compression de volatilité haussière + Balayage de liquidité sous 66.8k + Reprise agressive du carnet d\'ordres.',
  },
  {
    id: 'sig-3',
    pairId: 'USDJPY',
    pairName: 'USD / JPY',
    type: 'SELL',
    status: 'ACTIVE',
    timeframe: 'M30',
    entryPrice: 153.650,
    stopLoss: 154.050,
    tp1: 153.250,
    tp2: 152.850,
    tp3: 152.400,
    riskReward: '3.1:1',
    confidence: 84,
    timestamp: 'Il y a 38 min',
    pipsGained: 23,
    rationale: 'Double sommet (Double Top) sur résistance institutionnelle 154.00 avec divergence baissière RSI (14).',
  },
  {
    id: 'sig-us30',
    pairId: 'US30',
    pairName: 'US30 (Dow Jones)',
    type: 'BUY',
    status: 'ACTIVE',
    timeframe: 'M15',
    entryPrice: 43280.0,
    stopLoss: 43160.0,
    tp1: 43440.0,
    tp2: 43580.0,
    tp3: 43750.0,
    riskReward: '3.9:1',
    confidence: 87,
    timestamp: 'Il y a 30 min',
    pipsGained: 95,
    rationale: 'Rebond sur support clé avant l\'ouverture de Wall Street avec impulsion haussière des futures.',
  },
  {
    id: 'sig-5',
    pairId: 'GBPUSD',
    pairName: 'GBP / USD',
    type: 'SELL',
    status: 'PENDING',
    timeframe: 'M15',
    entryPrice: 1.29650,
    stopLoss: 1.29900,
    tp1: 1.29350,
    tp2: 1.29050,
    tp3: 1.28700,
    riskReward: '2.8:1',
    confidence: 80,
    timestamp: 'Il y a 5 min',
    pipsGained: 0,
    rationale: 'Ordre Limit en attente au niveau de l\'Order Block Premium avant la session de New York.',
  },
];

export const DEFAULT_SETTINGS: TradingSettings = {
  accountBalance: 10000,
  riskPercent: 1.5,
  leverage: 100,
  preferredTimeframe: 'M15',
  audioAlerts: true,
  chartTheme: 'light',
  autoBreakeven: true,
};

// Subtle Web Audio alert generator
export function playTradeSound(type: 'beep' | 'success' | 'alert' = 'beep') {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'success') {
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'alert') {
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(660, now + 0.1);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else {
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    }
  } catch {
    // browser audio permissions or no audio context
  }
}

// Calculate position sizing (lot size)
export function calculatePositionSize(
  balance: number,
  riskPercent: number,
  entry: number,
  stopLoss: number,
  pipMultiplier: number
): { riskAmount: number; pipsRisk: number; lotSize: number } {
  const riskAmount = (balance * riskPercent) / 100;
  const pipsRisk = Math.abs(entry - stopLoss) / pipMultiplier;
  if (pipsRisk <= 0) return { riskAmount, pipsRisk: 0, lotSize: 0 };
  
  // Standard lot = 10$ per pip in major pairs (approximate)
  const pipValuePerLot = 10;
  const lotSize = Number((riskAmount / (pipsRisk * pipValuePerLot)).toFixed(2));

  return {
    riskAmount: Number(riskAmount.toFixed(2)),
    pipsRisk: Math.round(pipsRisk),
    lotSize: Math.max(0.01, lotSize),
  };
}
