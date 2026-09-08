export type SignalType = 'BUY' | 'SELL';

export type SignalStatus = 'ACTIVE' | 'TP1_HIT' | 'TP2_HIT' | 'TP3_HIT' | 'SL_HIT' | 'PENDING';

export interface ForexPair {
  id: string;
  name: string; // e.g., "EUR / GBP"
  symbol: string; // e.g., "EURGBP"
  tvSymbol: string; // e.g., "FX:EURGBP"
  category: 'Major' | 'Cross' | 'Commodity' | 'Crypto' | 'Indices';
  basePrice: number;
  decimals: number;
  pipMultiplier: number;
  spreadPips: number;
  change24h: number; // percentage
  high24h: number;
  low24h: number;
}

export interface ForexSignal {
  id: string;
  pairId: string;
  pairName: string;
  type: SignalType;
  status: SignalStatus;
  timeframe: string;
  entryPrice: number;
  stopLoss: number;
  tp1: number;
  tp2: number;
  tp3: number;
  riskReward: string;
  confidence: number;
  timestamp: string;
  pipsGained: number;
  rationale: string;
}

export interface SMCAnalysis {
  structure: string;
  orderBlock: string;
  liquidity: string;
  fvg: string;
}

export interface TechnicalIndicators {
  rsi: string;
  macd: string;
  ema: string;
  support: string;
  resistance: string;
}

export interface AIAnalysisData {
  pair: string;
  sentiment: string;
  confidenceScore: number;
  trendSummary: string;
  smc: SMCAnalysis;
  technicalIndicators: TechnicalIndicators;
  catalysts: string;
  strategyPlan: string;
  keyAdvice: string;
}

export interface TradingSettings {
  accountBalance: number;
  riskPercent: number;
  leverage: number;
  preferredTimeframe: string;
  audioAlerts: boolean;
  chartTheme: 'light' | 'dark';
  autoBreakeven: boolean;
}

export type ActiveTab = 'chart' | 'ai' | 'signals' | 'settings';
