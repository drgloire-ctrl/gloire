import { useEffect, useRef, useState, useMemo } from 'react';
import {
  createChart,
  CandlestickSeries,
  LineStyle,
  createSeriesMarkers,
  ColorType,
  IChartApi,
  ISeriesApi,
  IPriceLine,
} from 'lightweight-charts';
import {
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Zap,
  Target,
  ShieldAlert,
  Crosshair,
  Copy,
  Check,
  RotateCcw,
  X,
  Calculator,
  ChevronDown,
  ChevronUp,
  Activity,
  Bot,
  Landmark,
  Layers,
  Compass,
} from 'lucide-react';
import { ForexPair, ForexSignal } from '../types';
import { FOREX_PAIRS, playTradeSound } from '../data/forexData';
import { generateCandlestickHistory, CandlePoint } from '../utils/chartData';
import { detectInstitutionalOrderBlocks } from '../utils/smcAnalysis';
import OrderBlockOverlay from './OrderBlockOverlay';

interface Props {
  selectedPair: ForexPair;
  timeframe: string;
  activeSignal?: ForexSignal | null;
  chartTheme?: 'light' | 'dark';
  onSelectPair?: (pair: ForexPair) => void;
  audioEnabled?: boolean;
  onOpenCalculator?: () => void;
  onGoToAI?: () => void;
}

declare global {
  interface Window {
    TradingView?: {
      widget: new (config: Record<string, unknown>) => unknown;
    };
  }
}

interface ActiveTrade {
  id: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  lotSize: number;
  openTime: string;
  sl: number;
  tp: number;
}

export default function ForexChart({
  selectedPair,
  timeframe,
  activeSignal,
  chartTheme = 'light',
  onSelectPair,
  audioEnabled = true,
  onOpenCalculator,
  onGoToAI,
}: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const tvIframeContainerRef = useRef<HTMLDivElement>(null);

  // Chart view mode: Native Canvas with price-scale lines vs TradingView iframe widget
  const [chartMode, setChartMode] = useState<'native' | 'iframe'>('native');

  // Chart settings
  const [signalDirection, setSignalDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [showEntryZone, setShowEntryZone] = useState<boolean>(true);
  const [showStopLoss, setShowStopLoss] = useState<boolean>(true);
  const [showTakeProfits, setShowTakeProfits] = useState<boolean>(true);
  const [showSMCLevels, setShowSMCLevels] = useState<boolean>(true);
  const [showOrderBlocksOverlay, setShowOrderBlocksOverlay] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  // On-Chart Signal Overlay Box display state
  const [showSignalOverlay, setShowSignalOverlay] = useState<boolean>(true);
  const [isSignalBoxCollapsed, setIsSignalBoxCollapsed] = useState<boolean>(false);
  const [signalCardTab, setSignalCardTab] = useState<'signal' | 'institutional'>('signal');
  const [showInstitutionalDrawer, setShowInstitutionalDrawer] = useState<boolean>(false);

  // Execution & simulation state
  const [lotSize, setLotSize] = useState<number>(0.1);
  const [activeTrade, setActiveTrade] = useState<ActiveTrade | null>(null);
  const [tradeProfitPips, setTradeProfitPips] = useState<number>(12);
  const [tradeNotification, setTradeNotification] = useState<string | null>(null);

  // References and state for chart instances
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const [chartInstance, setChartInstance] = useState<IChartApi | null>(null);
  const [seriesInstance, setSeriesInstance] = useState<ISeriesApi<'Candlestick'> | null>(null);
  const priceLinesRef = useRef<IPriceLine[]>([]);

  // Candle history state & Order Block calculation based on historical price action
  const [candles, setCandles] = useState<CandlePoint[]>(() =>
    generateCandlestickHistory(selectedPair, timeframe, 120)
  );

  useEffect(() => {
    setCandles(generateCandlestickHistory(selectedPair, timeframe, 120));
  }, [selectedPair.id, timeframe]);

  // Algorithmic calculation of Institutional Order Blocks (Supply and Demand areas)
  const orderBlocks = useMemo(() => {
    return detectInstitutionalOrderBlocks(candles, selectedPair);
  }, [candles, selectedPair]);

  // Nearest active Order Blocks
  const nearestDemandOB = useMemo(() => {
    return orderBlocks.find((ob) => ob.type === 'BULLISH_DEMAND' && ob.status !== 'MITIGATED');
  }, [orderBlocks]);

  const nearestSupplyOB = useMemo(() => {
    return orderBlocks.find((ob) => ob.type === 'BEARISH_SUPPLY' && ob.status !== 'MITIGATED');
  }, [orderBlocks]);

  // Sync direction when activeSignal changes
  useEffect(() => {
    if (activeSignal) {
      setSignalDirection(activeSignal.type);
    }
  }, [activeSignal]);

  // Derived price levels
  const isBuy = signalDirection === 'BUY';
  const pip = selectedPair.pipMultiplier;
  const decimals = selectedPair.decimals;

  const hasMatchedSignal = activeSignal && activeSignal.type === signalDirection;
  const entryPrice = hasMatchedSignal ? activeSignal.entryPrice : selectedPair.basePrice;

  // Entry corridor buffer (e.g. 2.5 pips around entry)
  const entryBuffer = pip * (selectedPair.category === 'Crypto' ? 20 : selectedPair.id === 'XAUUSD' ? 1.5 : 2.5);
  const entryZoneMin = Number((entryPrice - entryBuffer).toFixed(decimals));
  const entryZoneMax = Number((entryPrice + entryBuffer).toFixed(decimals));

  // Stop Loss
  const stopLoss = hasMatchedSignal
    ? activeSignal.stopLoss
    : isBuy
    ? Number((entryPrice - (pip * (selectedPair.id === 'XAUUSD' ? 12 : 25))).toFixed(decimals))
    : Number((entryPrice + (pip * (selectedPair.id === 'XAUUSD' ? 12 : 25))).toFixed(decimals));

  // Take Profit 1, 2, 3
  const tp1 = hasMatchedSignal
    ? activeSignal.tp1
    : isBuy
    ? Number((entryPrice + (pip * (selectedPair.id === 'XAUUSD' ? 15 : 30))).toFixed(decimals))
    : Number((entryPrice - (pip * (selectedPair.id === 'XAUUSD' ? 15 : 30))).toFixed(decimals));

  const tp2 = hasMatchedSignal
    ? activeSignal.tp2
    : isBuy
    ? Number((entryPrice + (pip * (selectedPair.id === 'XAUUSD' ? 30 : 60))).toFixed(decimals))
    : Number((entryPrice - (pip * (selectedPair.id === 'XAUUSD' ? 30 : 60))).toFixed(decimals));

  const tp3 = hasMatchedSignal
    ? activeSignal.tp3
    : isBuy
    ? Number((entryPrice + (pip * (selectedPair.id === 'XAUUSD' ? 55 : 100))).toFixed(decimals))
    : Number((entryPrice - (pip * (selectedPair.id === 'XAUUSD' ? 55 : 100))).toFixed(decimals));

  // Pip distances
  const slPips = Math.max(1, Math.round(Math.abs(entryPrice - stopLoss) / pip));
  const tp1Pips = Math.max(1, Math.round(Math.abs(tp1 - entryPrice) / pip));
  const tp2Pips = Math.max(1, Math.round(Math.abs(tp2 - entryPrice) / pip));
  const tp3Pips = Math.max(1, Math.round(Math.abs(tp3 - entryPrice) / pip));

  // Risk / Reward ratio
  const riskReward = (tp1Pips > 0 && slPips > 0)
    ? `1 : ${(tp1Pips / slPips).toFixed(1)}`
    : activeSignal?.riskReward || '1 : 2.5';

  const confidenceScore = hasMatchedSignal ? activeSignal.confidence : (isBuy ? 94 : 91);
  const signalRationale = hasMatchedSignal
    ? activeSignal.rationale
    : isBuy
    ? "Rebond puissant sur l'Order Block institutionnel M15 + Rupture haussière (BOS) avec afflux de liquidités institutionnelles."
    : "Rejet violent de résistance clé + Divergence baissière RSI avec balayage des stops acheteurs (Liquidity Sweep).";

  // Financial estimations
  const pipValue = selectedPair.category === 'Crypto' ? 1 : 10;
  const riskUsd = (slPips * lotSize * pipValue).toFixed(2);
  const gainTp1Usd = (tp1Pips * lotSize * pipValue).toFixed(2);
  const gainTp2Usd = (tp2Pips * lotSize * pipValue).toFixed(2);
  const gainTp3Usd = (tp3Pips * lotSize * pipValue).toFixed(2);

  // INSTITUTIONAL ANALYSIS DATA
  const institutionalData = {
    bias: isBuy ? 'Haussier Institutionnel (Smart Money Bullish)' : 'Baissier Institutionnel (Smart Money Bearish)',
    institutionalRatio: isBuy ? 88 : 84,
    retailRatio: isBuy ? 72 : 68,
    orderBlockZone: nearestDemandOB
      ? `${nearestDemandOB.low.toFixed(decimals)} - ${nearestDemandOB.high.toFixed(decimals)}`
      : isBuy
      ? `${(entryPrice - pip * 6).toFixed(decimals)} - ${entryPrice.toFixed(decimals)}`
      : `${entryPrice.toFixed(decimals)} - ${(entryPrice + pip * 6).toFixed(decimals)}`,
    orderBlockPrice: nearestDemandOB
      ? nearestDemandOB.equilibrium
      : isBuy
      ? Number((entryPrice - pip * (selectedPair.id === 'XAUUSD' ? 4 : 8)).toFixed(decimals))
      : Number((entryPrice + pip * (selectedPair.id === 'XAUUSD' ? 4 : 8)).toFixed(decimals)),
    fvgPrice: isBuy
      ? Number((entryPrice + pip * (selectedPair.id === 'XAUUSD' ? 6 : 12)).toFixed(decimals))
      : Number((entryPrice - pip * (selectedPair.id === 'XAUUSD' ? 6 : 12)).toFixed(decimals)),
    liquiditySweepPrice: isBuy
      ? Number((stopLoss - pip * (selectedPair.id === 'XAUUSD' ? 2 : 5)).toFixed(decimals))
      : Number((stopLoss + pip * (selectedPair.id === 'XAUUSD' ? 2 : 5)).toFixed(decimals)),
    marketStructure: isBuy ? 'Break of Structure (BOS) Confirmé en M15' : 'Change of Character (CHoCH) Baissier',
    liquidityType: isBuy ? 'Prise de Sell-Side Liquidity (SSL) sous les plus bas' : 'Balayage de Buy-Side Liquidity (BSL)',
    fvgStatus: 'Fair Value Gap (FVG) actif en cours de mitigation',
    amdPhase: isBuy ? 'Distribution en cours (Phase 3 après Judas Swing)' : 'Manipulation / Infiltration baissière',
    institutionalAction: isBuy ? 'Absorption massive d\'ordres vendeurs par les teneurs de marché' : 'Distribution agressive de contrats institutionnels',
    cotSentiment: isBuy ? 'Rapports COT CFTC : Positions nettes acheteuses en hausse (+14.2%)' : 'Rapports COT CFTC : Réduction des positions longues institutionnelles',
  };

  // Initialize Native Lightweight Charts with native Price Lines
  useEffect(() => {
    if (chartMode !== 'native' || !chartContainerRef.current) return;

    const container = chartContainerRef.current;
    container.innerHTML = '';

    const isDark = chartTheme === 'dark';

    const chart = createChart(container, {
      width: container.clientWidth || 800,
      height: container.clientHeight || 550,
      layout: {
        background: {
          type: ColorType.Solid,
          color: isDark ? '#0f172a' : '#ffffff',
        },
        textColor: isDark ? '#94a3b8' : '#334155',
      },
      grid: {
        vertLines: {
          color: isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.8)',
        },
        horzLines: {
          color: isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.8)',
        },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: isDark ? '#334155' : '#cbd5e1',
        scaleMargins: {
          top: 0.12,
          bottom: 0.12,
        },
      },
      timeScale: {
        borderColor: isDark ? '#334155' : '#cbd5e1',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartInstanceRef.current = chart;
    setChartInstance(chart);

    // Add Candlestick Series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00d084',
      downColor: '#ff4d4d',
      borderVisible: true,
      borderUpColor: '#00b371',
      borderDownColor: '#e03e3e',
      wickUpColor: '#00d084',
      wickDownColor: '#ff4d4d',
      priceFormat: {
        type: 'price',
        precision: decimals,
        minMove: 1 / Math.pow(10, decimals),
      },
    });

    seriesRef.current = candleSeries;
    setSeriesInstance(candleSeries);

    // Load candlestick data
    candleSeries.setData(candles);

    // Add Native Price Lines onto the Candlestick Price Scale
    const createdLines: IPriceLine[] = [];

    // 1. Take Profit 3 (Final Target)
    if (showTakeProfits) {
      const lineTp3 = candleSeries.createPriceLine({
        price: tp3,
        color: '#059669',
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `🎯 TP3 (+${tp3Pips}p)`,
      });
      createdLines.push(lineTp3);

      // 2. Take Profit 2 (Intermediate)
      const lineTp2 = candleSeries.createPriceLine({
        price: tp2,
        color: '#10b981',
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `🎯 TP2 (+${tp2Pips}p)`,
      });
      createdLines.push(lineTp2);

      // 3. Take Profit 1 (Conservative / BE)
      const lineTp1 = candleSeries.createPriceLine({
        price: tp1,
        color: '#34d399',
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `🎯 TP1 (+${tp1Pips}p)`,
      });
      createdLines.push(lineTp1);
    }

    // 4. Entry Zone & Main Entry Price
    if (showEntryZone) {
      const lineZoneMax = candleSeries.createPriceLine({
        price: entryZoneMax,
        color: '#60a5fa',
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        axisLabelVisible: true,
        title: 'ZONE MAX',
      });
      createdLines.push(lineZoneMax);

      const lineEntry = candleSeries.createPriceLine({
        price: entryPrice,
        color: '#2563eb',
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: `📍 ENTRÉE ${isBuy ? 'ACHAT' : 'VENTE'}`,
      });
      createdLines.push(lineEntry);

      const lineZoneMin = candleSeries.createPriceLine({
        price: entryZoneMin,
        color: '#60a5fa',
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        axisLabelVisible: true,
        title: 'ZONE MIN',
      });
      createdLines.push(lineZoneMin);
    }

    // 5. Stop Loss (Invalidation / Protection)
    if (showStopLoss) {
      const lineSl = candleSeries.createPriceLine({
        price: stopLoss,
        color: '#ef4444',
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: `🛑 SL (-${slPips}p)`,
      });
      createdLines.push(lineSl);
    }

    // 6. INSTITUTIONAL SMC LINES (Order Block, FVG, Liquidity Pool)
    if (showSMCLevels) {
      // Order Block (OB)
      const lineOB = candleSeries.createPriceLine({
        price: institutionalData.orderBlockPrice,
        color: '#a855f7',
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `🏛️ OB MT (${institutionalData.orderBlockPrice.toFixed(decimals)})`,
      });
      createdLines.push(lineOB);

      // Fair Value Gap (FVG)
      const lineFVG = candleSeries.createPriceLine({
        price: institutionalData.fvgPrice,
        color: '#06b6d4',
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        axisLabelVisible: true,
        title: `⚡ FVG IMBALANCE (${institutionalData.fvgPrice.toFixed(decimals)})`,
      });
      createdLines.push(lineFVG);

      // Liquidity Sweep
      const lineSweep = candleSeries.createPriceLine({
        price: institutionalData.liquiditySweepPrice,
        color: '#f59e0b',
        lineWidth: 1,
        lineStyle: LineStyle.LargeDashed,
        axisLabelVisible: true,
        title: isBuy ? `💧 SWEEP SSL (${institutionalData.liquiditySweepPrice.toFixed(decimals)})` : `💧 SWEEP BSL (${institutionalData.liquiditySweepPrice.toFixed(decimals)})`,
      });
      createdLines.push(lineSweep);
    }

    priceLinesRef.current = createdLines;

    // Add On-Chart Markers directly on the signal & institutional candles
    if (candles.length > 0) {
      const lastCandle = candles[candles.length - 1];
      const triggerCandle = candles[candles.length - 4] || lastCandle;

      createSeriesMarkers(candleSeries, [
        {
          time: triggerCandle.time,
          position: isBuy ? 'belowBar' : 'aboveBar',
          color: isBuy ? '#00d084' : '#ff4d4d',
          shape: isBuy ? 'arrowUp' : 'arrowDown',
          text: `⚡ SIGNAL IA ${isBuy ? 'ACHAT (BUY)' : 'VENTE (SELL)'} @ ${entryPrice.toFixed(decimals)}`,
          size: 2,
        },
        {
          time: lastCandle.time,
          position: isBuy ? 'aboveBar' : 'belowBar',
          color: '#a855f7',
          shape: 'circle',
          text: `🏛️ FLUX INSTITUTIONNEL : ${institutionalData.institutionalRatio}% SMART MONEY`,
          size: 1,
        },
      ]);
    }

    chart.timeScale().fitContent();

    // Auto resize observer
    const handleResize = () => {
      if (container && chart) {
        chart.applyOptions({
          width: container.clientWidth,
          height: container.clientHeight,
        });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Live tick simulation
    const tickInterval = setInterval(() => {
      if (!seriesRef.current || candles.length === 0) return;
      const lastBar = candles[candles.length - 1];
      const tickDelta = (Math.random() - 0.49) * (pip * 1.5);
      const updatedClose = Number((lastBar.close + tickDelta).toFixed(decimals));
      const updatedHigh = Math.max(lastBar.high, updatedClose);
      const updatedLow = Math.min(lastBar.low, updatedClose);

      const updatedBar = {
        ...lastBar,
        close: updatedClose,
        high: updatedHigh,
        low: updatedLow,
      };

      seriesRef.current.update(updatedBar);
    }, 2200);

    return () => {
      clearInterval(tickInterval);
      resizeObserver.disconnect();
      chart.remove();
      chartInstanceRef.current = null;
      seriesRef.current = null;
      setChartInstance(null);
      setSeriesInstance(null);
    };
  }, [
    chartMode,
    selectedPair,
    timeframe,
    chartTheme,
    signalDirection,
    showEntryZone,
    showStopLoss,
    showTakeProfits,
    showSMCLevels,
    candles,
  ]);

  // Fallback / Alternate TradingView iframe initialization
  useEffect(() => {
    if (chartMode !== 'iframe' || !tvIframeContainerRef.current) return;

    const container = tvIframeContainerRef.current;
    container.innerHTML = '';
    const chartDiv = document.createElement('div');
    chartDiv.id = `tv_iframe_${selectedPair.id}`;
    chartDiv.style.width = '100%';
    chartDiv.style.height = '100%';
    container.appendChild(chartDiv);

    const getTvInterval = (tf: string): string => {
      switch (tf) {
        case 'M1': return '1';
        case 'M5': return '5';
        case 'M15': return '15';
        case 'M30': return '30';
        case 'H1': return '60';
        case 'H4': return '240';
        case 'D1': return 'D';
        default: return '15';
      }
    };

    if (window.TradingView) {
      new window.TradingView.widget({
        container_id: chartDiv.id,
        width: '100%',
        height: '100%',
        symbol: selectedPair.tvSymbol,
        interval: getTvInterval(timeframe),
        timezone: 'Europe/Paris',
        theme: chartTheme,
        style: '1',
        locale: 'fr',
        toolbar_bg: chartTheme === 'dark' ? '#1e222d' : '#f1f3f6',
        enable_publishing: false,
        hide_side_toolbar: false,
        allow_symbol_change: true,
        save_image: false,
        details: true,
      });
    }
  }, [chartMode, selectedPair, timeframe, chartTheme]);

  // Simulate floating trade profit
  useEffect(() => {
    if (!activeTrade) return;
    const interval = setInterval(() => {
      setTradeProfitPips((prev) => {
        const delta = (Math.random() - 0.44) * 1.5;
        return Number((prev + delta).toFixed(1));
      });
    }, 1800);
    return () => clearInterval(interval);
  }, [activeTrade]);

  // Instant order execution handler
  const handleExecuteOrder = (type: 'BUY' | 'SELL', customEntry?: number) => {
    const executedPrice = customEntry || entryPrice;
    if (audioEnabled) playTradeSound(type === 'BUY' ? 'success' : 'alert');
    const newTrade: ActiveTrade = {
      id: `trade-${Date.now()}`,
      type,
      entryPrice: executedPrice,
      lotSize,
      openTime: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      sl: stopLoss,
      tp: tp1,
    };
    setActiveTrade(newTrade);
    setTradeProfitPips(3.5);
    setTradeNotification(`Ordre ${type} exécuté sur ${selectedPair.name} : ${lotSize} lot(s) @ ${executedPrice} [SL: ${stopLoss} | TP: ${tp1}]`);
    setTimeout(() => setTradeNotification(null), 5000);
  };

  const handleCloseTrade = () => {
    if (audioEnabled) playTradeSound('beep');
    setTradeNotification(`Position clôturée : ${tradeProfitPips >= 0 ? '+' : ''}${tradeProfitPips} pips (${((tradeProfitPips * lotSize * pipValue)).toFixed(2)} $)`);
    setActiveTrade(null);
    setTimeout(() => setTradeNotification(null), 4500);
  };

  // Copy levels to clipboard
  const handleCopyLevels = () => {
    const text = `🎯 SIGNAL AI FOREX & ANALYSE INSTITUTIONNELLE (${selectedPair.name})
Direction: ${isBuy ? 'ACHAT (BUY)' : 'VENTE (SELL)'}
Unité de temps: ${timeframe}
Entrée: ${entryPrice.toFixed(decimals)} [Zone: ${entryZoneMin.toFixed(decimals)} - ${entryZoneMax.toFixed(decimals)}]
Stop Loss (SL): ${stopLoss.toFixed(decimals)} (-${slPips} pips)
Take Profit 1: ${tp1.toFixed(decimals)} (+${tp1Pips} pips)
Take Profit 2: ${tp2.toFixed(decimals)} (+${tp2Pips} pips)
Take Profit 3: ${tp3.toFixed(decimals)} (+${tp3Pips} pips)
Ratio R:R: ${riskReward}
Confiance IA: ${confidenceScore}%

🏛️ ANALYSE INSTITUTIONNELLE (SMC):
- Flux Smart Money: ${institutionalData.institutionalRatio}% ACHAT vs ${institutionalData.retailRatio}% RETAIL
- Order Block Actif: ${institutionalData.orderBlockZone}
- Structure: ${institutionalData.marketStructure}
- Fair Value Gap: ${institutionalData.fvgStatus}
- Liquidité: ${institutionalData.liquidityType}
- Phase Cycle: ${institutionalData.amdPhase}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    if (audioEnabled) playTradeSound('beep');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetView = () => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.timeScale().fitContent();
    }
  };

  const hotPairs = FOREX_PAIRS.slice(0, 7);

  return (
    <div className="relative w-full h-[calc(100vh-125px)] min-h-[580px] bg-slate-950 flex flex-col select-none overflow-hidden">
      
      {/* 1. TOP RESPONSIVE CONTROL BAR */}
      <div className="z-20 bg-slate-900/95 border-b border-slate-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2 shadow-md">
        
        {/* Left: Quick Asset Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 pl-1 pr-1 hidden sm:inline">Paires :</span>
          {hotPairs.map((pair) => {
            const isSelected = selectedPair.id === pair.id;
            const isGold = pair.id === 'XAUUSD';
            return (
              <button
                key={pair.id}
                onClick={() => {
                  if (onSelectPair) onSelectPair(pair);
                  if (audioEnabled) playTradeSound('beep');
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? isGold
                      ? 'bg-amber-500 text-white shadow-sm font-black ring-2 ring-amber-300/80'
                      : 'bg-blue-600 text-white shadow-sm'
                    : isGold
                    ? 'bg-amber-950/40 text-amber-300 hover:bg-amber-900/50 border border-amber-500/40'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {isGold && <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />}
                <span>{pair.id === 'XAUUSD' ? 'XAU/USD (Or)' : pair.name.replace(/\s+/g, '')}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Mode Selector + Order Buttons */}
        <div className="flex items-center gap-2">
          {/* Chart Engine Switcher */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-2xs">
            <button
              onClick={() => setChartMode('native')}
              className={`px-2.5 py-1 rounded-md font-bold transition-colors ${
                chartMode === 'native' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title="Graphique interactif avec Order Blocks dessinés et lignes de prix sur l'axe"
            >
              Niveaux Réels (Canvas)
            </button>
            <button
              onClick={() => setChartMode('iframe')}
              className={`px-2.5 py-1 rounded-md font-bold transition-colors ${
                chartMode === 'iframe' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title="Widget TradingView Web avec indicateurs officiels"
            >
              Widget TV Web
            </button>
          </div>

          {/* Quick Order Buttons */}
          <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-800">
            <select
              value={lotSize}
              onChange={(e) => setLotSize(parseFloat(e.target.value))}
              className="bg-slate-800 text-slate-200 font-mono font-bold text-xs rounded-lg px-2 py-1 outline-hidden cursor-pointer border border-slate-700"
            >
              <option value={0.01}>0.01</option>
              <option value={0.05}>0.05</option>
              <option value={0.1}>0.10</option>
              <option value={0.5}>0.50</option>
              <option value={1.0}>1.00</option>
            </select>

            <button
              onClick={() => handleExecuteOrder('BUY')}
              className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-lg shadow-sm active:scale-95 transition-all"
            >
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
              <span>BUY</span>
            </button>

            <button
              onClick={() => handleExecuteOrder('SELL')}
              className="flex items-center gap-1 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-lg shadow-sm active:scale-95 transition-all"
            >
              <ArrowDownRight className="w-3.5 h-3.5 stroke-[3]" />
              <span>SELL</span>
            </button>
          </div>
        </div>

      </div>

      {/* 2. HIGH-VISIBILITY SIGNAL & INSTITUTIONAL BANNER */}
      <div className={`z-20 border-b px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs transition-colors ${
        isBuy ? 'bg-emerald-950/70 border-emerald-800/80 text-emerald-200' : 'bg-rose-950/70 border-rose-800/80 text-rose-200'
      }`}>
        {/* Left: Signal & Institutional Summary */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 font-mono">
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${isBuy ? 'bg-emerald-400 animate-ping' : 'bg-rose-400 animate-ping'}`} />
            <span className={`px-2 py-0.5 rounded-md font-black text-2xs uppercase tracking-wider ${
              isBuy ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-rose-500 text-white font-black'
            }`}>
              SIGNAL {isBuy ? 'ACHAT (BUY)' : 'VENTE (SELL)'}
            </span>
          </div>

          <div className="flex items-center gap-1 text-slate-100 font-sans font-bold">
            <span>{selectedPair.name}</span>
            <span className="text-2xs bg-slate-800 px-1.5 py-0.2 rounded font-mono text-slate-300">{timeframe}</span>
          </div>

          {/* Institutional Badge in Top Banner */}
          <div className="flex items-center gap-1 bg-purple-950/70 text-purple-200 border border-purple-500/40 px-2 py-0.5 rounded-md font-sans text-2xs">
            <Landmark className="w-3 h-3 text-purple-400" />
            <span>Smart Money : <strong>{institutionalData.institutionalRatio}% {isBuy ? 'ACHAT' : 'VENTE'}</strong></span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-2xs">
            <span className="text-slate-300">Entrée: <strong className="text-white">{entryPrice.toFixed(decimals)}</strong></span>
            <span className="text-slate-400">•</span>
            <span className="text-rose-300">SL: <strong className="text-rose-200">{stopLoss.toFixed(decimals)} (-{slPips}p)</strong></span>
            <span className="text-slate-400">•</span>
            <span className="text-emerald-300">TP1: <strong className="text-emerald-200">{tp1.toFixed(decimals)} (+{tp1Pips}p)</strong></span>
            <span className="text-slate-400">•</span>
            <span className="text-amber-300">R:R: <strong className="text-amber-200">{riskReward}</strong></span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 font-sans">
          <button
            onClick={() => setShowInstitutionalDrawer(true)}
            className="flex items-center gap-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/50 px-2.5 py-0.5 rounded-md text-2xs font-bold transition-all hover:scale-105"
            title="Ouvrir l'Analyse Institutionnelle Complète (SMC, Order Flow, COT)"
          >
            <Landmark className="w-3 h-3 text-purple-400" />
            <span>🏛️ Analyse Institutionnelle</span>
          </button>

          <button
            onClick={() => setShowSignalOverlay(!showSignalOverlay)}
            className={`px-2 py-0.5 rounded-md text-2xs font-bold transition-colors ${
              showSignalOverlay ? 'bg-slate-800 text-white border border-slate-700' : 'bg-slate-900 text-slate-400'
            }`}
          >
            {showSignalOverlay ? 'Masquer Signal' : 'Afficher Signal'}
          </button>

          <button
            onClick={handleCopyLevels}
            className="flex items-center gap-1 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-2xs font-bold rounded-md border border-slate-700 transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copié !' : 'Copier'}</span>
          </button>
        </div>
      </div>

      {/* 3. TRADE NOTIFICATION TOAST */}
      {tradeNotification && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 bg-slate-950/95 text-white px-4 py-2 rounded-xl shadow-2xl border border-emerald-500/60 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{tradeNotification}</span>
          <button onClick={() => setTradeNotification(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4. ACTIVE POSITION FLOATING PILL */}
      {activeTrade && (
        <div className="absolute top-28 left-4 z-30 bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-xl border border-emerald-500/80 flex items-center gap-2.5 text-xs animate-in fade-in">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="font-black text-white">{activeTrade.type} {activeTrade.lotSize}L</span>
          <span className={`font-mono font-bold ${tradeProfitPips >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {tradeProfitPips >= 0 ? '+' : ''}{tradeProfitPips} pips (${((tradeProfitPips * activeTrade.lotSize * pipValue)).toFixed(2)})
          </span>
          <button
            onClick={handleCloseTrade}
            className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white text-3xs font-bold rounded-md transition-colors"
          >
            Clôturer
          </button>
        </div>
      )}

      {/* 5. FLOATING INTERACTIVE SIGNAL & INSTITUTIONAL BOX DIRECTLY ON THE CHART */}
      {showSignalOverlay && (
        <div
          className={`absolute left-3 sm:left-4 top-24 sm:top-28 z-30 transition-all duration-300 max-w-[310px] sm:max-w-[340px] w-[calc(100vw-24px)] ${
            isSignalBoxCollapsed ? 'w-auto' : ''
          }`}
        >
          {/* Collapsed Pill State */}
          {isSignalBoxCollapsed ? (
            <div
              onClick={() => setIsSignalBoxCollapsed(false)}
              className={`cursor-pointer flex items-center gap-2 px-3 py-2 rounded-xl shadow-2xl backdrop-blur-md border text-white font-bold text-xs select-none hover:scale-105 active:scale-95 transition-all ${
                isBuy
                  ? 'bg-emerald-600/90 border-emerald-400 buy-signal'
                  : 'bg-rose-600/90 border-rose-400 sell-signal'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span>{isBuy ? 'BUY' : 'SELL'} @ {entryPrice.toFixed(decimals)}</span>
              <span className="bg-purple-900/80 px-1.5 py-0.5 rounded text-3xs font-mono text-purple-200">SMC</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          ) : (
            /* Full Expanded Signal & Institutional Card */
            <div
              className={`rounded-2xl shadow-2xl backdrop-blur-xl border overflow-hidden transition-all select-none ${
                isBuy
                  ? 'bg-slate-950/95 border-emerald-500/80 shadow-emerald-950/50'
                  : 'bg-slate-950/95 border-rose-500/80 shadow-rose-950/50'
              }`}
            >
              {/* Card Header with Tabs Switcher */}
              <div
                className={`px-3 py-2 flex items-center justify-between border-b ${
                  isBuy ? 'bg-emerald-950/50 border-emerald-500/40' : 'bg-rose-950/50 border-rose-500/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`p-1.5 rounded-lg ${
                      isBuy ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                    }`}
                  >
                    {isBuy ? <ArrowUpRight className="w-4 h-4 stroke-[3]" /> : <ArrowDownRight className="w-4 h-4 stroke-[3]" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm font-black tracking-tight ${isBuy ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isBuy ? 'ACHAT (BUY)' : 'VENTE (SELL)'}
                      </span>
                      <span className="text-3xs font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40">
                        IA {confidenceScore}%
                      </span>
                    </div>
                    <p className="text-3xs text-slate-400 font-mono">{selectedPair.name} • {timeframe}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={handleCopyLevels}
                    className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-md transition-colors"
                    title="Copier les niveaux"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => setIsSignalBoxCollapsed(true)}
                    className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-md transition-colors"
                    title="Réduire"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* TAB SELECTOR */}
              <div className="grid grid-cols-2 bg-slate-900 border-b border-slate-800 text-2xs font-bold">
                <button
                  onClick={() => setSignalCardTab('signal')}
                  className={`py-1.5 flex items-center justify-center gap-1 transition-colors ${
                    signalCardTab === 'signal'
                      ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-500'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Target className="w-3 h-3" />
                  <span>Signal & Niveaux</span>
                </button>
                <button
                  onClick={() => setSignalCardTab('institutional')}
                  className={`py-1.5 flex items-center justify-center gap-1 transition-colors ${
                    signalCardTab === 'institutional'
                      ? 'bg-slate-800 text-purple-400 border-b-2 border-purple-500'
                      : 'text-slate-400 hover:text-purple-300'
                  }`}
                >
                  <Landmark className="w-3 h-3 text-purple-400" />
                  <span>🏛️ Inst. (SMC)</span>
                </button>
              </div>

              {/* Card Body - TAB 1: SIGNAL & NUMBERS */}
              {signalCardTab === 'signal' && (
                <div className="p-3 space-y-2 text-xs">
                  {/* Confidence Bar */}
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                    <div className="flex justify-between items-center text-3xs font-bold text-slate-400 mb-1">
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3 text-emerald-400" /> Fiabilité Algorithmique IA
                      </span>
                      <span className="text-emerald-400 font-mono text-xs">{confidenceScore}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${confidenceScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Numbers Grid */}
                  <div className="space-y-1 font-mono text-xs">
                    {/* Entry */}
                    <div className="flex justify-between items-center py-1 px-1.5 bg-blue-950/30 rounded border border-blue-500/20">
                      <span className="text-slate-400 text-2xs font-sans flex items-center gap-1">
                        <Crosshair className="w-3 h-3 text-blue-400" /> Entrée (Entry) :
                      </span>
                      <span className="font-bold text-blue-200">{entryPrice.toFixed(decimals)}</span>
                    </div>

                    {/* Stop Loss */}
                    <div className="flex justify-between items-center py-1 px-1.5 bg-rose-950/30 rounded border border-rose-500/20">
                      <span className="text-slate-400 text-2xs font-sans flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-rose-400" /> Stop Loss (SL) :
                      </span>
                      <span className="font-bold text-rose-300">{stopLoss.toFixed(decimals)} (-{slPips}p)</span>
                    </div>

                    {/* Take Profit 1 */}
                    <div className="flex justify-between items-center py-1 px-1.5 bg-emerald-950/30 rounded border border-emerald-500/20">
                      <span className="text-slate-400 text-2xs font-sans flex items-center gap-1">
                        <Target className="w-3 h-3 text-emerald-400" /> Take Profit 1 :
                      </span>
                      <span className="font-bold text-emerald-300">{tp1.toFixed(decimals)} (+{tp1Pips}p)</span>
                    </div>

                    {/* Take Profit 2 & 3 */}
                    <div className="grid grid-cols-2 gap-1 pt-0.5">
                      <div className="bg-slate-900/60 p-1 rounded border border-slate-800 text-center">
                        <div className="text-3xs text-slate-400">TP 2 (+{tp2Pips}p)</div>
                        <div className="font-bold text-emerald-400 text-2xs">{tp2.toFixed(decimals)}</div>
                      </div>
                      <div className="bg-slate-900/60 p-1 rounded border border-slate-800 text-center">
                        <div className="text-3xs text-slate-400">TP 3 (+{tp3Pips}p)</div>
                        <div className="font-bold text-emerald-400 text-2xs">{tp3.toFixed(decimals)}</div>
                      </div>
                    </div>

                    {/* Risk Reward Ratio */}
                    <div className="flex justify-between items-center pt-1 px-1 text-2xs">
                      <span className="text-slate-400 font-sans">Ratio Risque : Rendement</span>
                      <span className="font-bold text-amber-400">{riskReward}</span>
                    </div>
                  </div>

                  {/* AI Rationale / Confluence */}
                  <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800 text-3xs text-slate-300 leading-relaxed">
                    <div className="flex items-center gap-1 font-bold text-amber-300 mb-0.5">
                      <Bot className="w-3 h-3" /> Confluences IA :
                    </div>
                    {signalRationale}
                  </div>

                  {/* Instant 1-Click Execution */}
                  <button
                    onClick={() => handleExecuteOrder(signalDirection)}
                    className={`w-full flex items-center justify-center gap-1.5 py-2 font-black text-xs rounded-xl shadow-lg transition-all active:scale-95 ${
                      isBuy
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white buy-signal'
                        : 'bg-rose-600 hover:bg-rose-500 text-white sell-signal'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>EXÉCUTER {isBuy ? 'ACHAT (BUY)' : 'VENTE (SELL)'} ({lotSize} lot)</span>
                  </button>

                  {/* Secondary Actions */}
                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    {onOpenCalculator && (
                      <button
                        onClick={onOpenCalculator}
                        className="flex items-center justify-center gap-1 py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-3xs font-bold transition-colors border border-slate-700"
                      >
                        <Calculator className="w-3 h-3" />
                        <span>Calculateur</span>
                      </button>
                    )}

                    <button
                      onClick={() => setShowInstitutionalDrawer(true)}
                      className="flex items-center justify-center gap-1 py-1 px-2 bg-purple-950/70 hover:bg-purple-900/80 text-purple-300 rounded-lg text-3xs font-bold transition-colors border border-purple-500/40"
                    >
                      <Landmark className="w-3 h-3 text-purple-400" />
                      <span>Audit Inst.</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Card Body - TAB 2: ANALYSE INSTITUTIONNELLE */}
              {signalCardTab === 'institutional' && (
                <div className="p-3 space-y-2.5 text-xs animate-in fade-in">
                  
                  {/* Smart Money vs Retail Gauge */}
                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-purple-500/30">
                    <div className="flex items-center justify-between text-3xs font-bold text-slate-300 mb-1.5">
                      <span className="flex items-center gap-1 text-purple-400 font-bold">
                        <Landmark className="w-3 h-3" /> Smart Money (Banques/Fonds)
                      </span>
                      <span className="text-emerald-400 font-mono font-black">{institutionalData.institutionalRatio}% {isBuy ? 'ACHAT' : 'VENTE'}</span>
                    </div>

                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                      <div
                        className="bg-purple-500 h-full transition-all duration-500"
                        style={{ width: `${institutionalData.institutionalRatio}%` }}
                      />
                      <div
                        className="bg-rose-500/60 h-full transition-all duration-500"
                        style={{ width: `${100 - institutionalData.institutionalRatio}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-3xs text-slate-400 mt-1">
                      <span>Particuliers (Retail) : <strong className="text-rose-400">{institutionalData.retailRatio}% {isBuy ? 'Vendeurs' : 'Acheteurs'}</strong></span>
                      <span className="text-emerald-400 font-bold">Effet Contre-Tendance</span>
                    </div>
                  </div>

                  {/* SMC Matrix Elements with Real Order Blocks */}
                  <div className="space-y-1.5 text-3xs">
                    
                    {/* Nearest Demand Order Block */}
                    <div className="bg-emerald-950/30 p-2 rounded-lg border border-emerald-500/30 flex items-start gap-2">
                      <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-emerald-300 block">Zone de Demande (Demand OB) :</span>
                        <p className="text-slate-200 font-mono text-2xs">
                          {nearestDemandOB ? `${nearestDemandOB.low.toFixed(decimals)} - ${nearestDemandOB.high.toFixed(decimals)}` : institutionalData.orderBlockZone}
                          {nearestDemandOB && <span className="ml-1 text-amber-300 font-sans">({nearestDemandOB.strengthScore}%★)</span>}
                        </p>
                        <p className="text-slate-400 text-3xs mt-0.5">50% Équilibre MT : {nearestDemandOB ? nearestDemandOB.equilibrium.toFixed(decimals) : institutionalData.orderBlockPrice.toFixed(decimals)}</p>
                      </div>
                    </div>

                    {/* Nearest Supply Order Block */}
                    {nearestSupplyOB && (
                      <div className="bg-rose-950/30 p-2 rounded-lg border border-rose-500/30 flex items-start gap-2">
                        <Layers className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-rose-300 block">Zone d'Offre (Supply OB) :</span>
                          <p className="text-slate-200 font-mono text-2xs">
                            {nearestSupplyOB.low.toFixed(decimals)} - {nearestSupplyOB.high.toFixed(decimals)}
                            <span className="ml-1 text-amber-300 font-sans">({nearestSupplyOB.strengthScore}%★)</span>
                          </p>
                          <p className="text-slate-400 text-3xs mt-0.5">50% Équilibre MT : {nearestSupplyOB.equilibrium.toFixed(decimals)}</p>
                        </div>
                      </div>
                    )}

                    {/* Liquidity Sweep */}
                    <div className="bg-amber-950/30 p-2 rounded-lg border border-amber-500/30 flex items-start gap-2">
                      <Compass className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-amber-300 block">Liquidité / Manipulation :</span>
                        <p className="text-slate-300">{institutionalData.liquidityType}</p>
                      </div>
                    </div>

                    {/* AMD Cycle Phase */}
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <span className="font-bold text-slate-400 block mb-0.5">Cycle AMD (Power of 3) :</span>
                      <p className="text-emerald-400 font-bold">{institutionalData.amdPhase}</p>
                    </div>

                  </div>

                  {/* Open Deep Institutional Drawer Button */}
                  <button
                    onClick={() => setShowInstitutionalDrawer(true)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95"
                  >
                    <Landmark className="w-3.5 h-3.5" />
                    <span>AUDIT INSTITUTIONNEL COMPLET (SMC)</span>
                  </button>

                  <button
                    onClick={() => setSignalCardTab('signal')}
                    className="w-full text-center text-3xs text-slate-400 hover:text-white py-0.5"
                  >
                    ← Revenir au Signal & Niveaux
                  </button>

                </div>
              )}

            </div>
          )}
        </div>
      )}

      {/* 6. COMPLETE INSTITUTIONAL AUDIT DRAWER */}
      {showInstitutionalDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-purple-500/50 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-purple-950/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-600 text-white rounded-xl shadow-sm">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>Analyse Institutionnelle & Smart Money Concepts</span>
                    <span className="text-3xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono">
                      SMC • ALGO
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">{selectedPair.name} • {timeframe} • {orderBlocks.length} Order Blocks identifiés</p>
                </div>
              </div>

              <button
                onClick={() => setShowInstitutionalDrawer(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-4 sm:p-6 space-y-5 text-xs text-slate-300">
              
              {/* Institutional Order Flow Score */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Positionnement Institutionnel vs Particuliers</span>
                  <span className="text-xs font-bold text-purple-400 font-mono">Rapports Banques / COT</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-purple-950/40 p-3 rounded-lg border border-purple-500/30">
                    <div className="text-3xs text-purple-300 font-bold mb-1">Smart Money (Fonds & Teneurs de Marché)</div>
                    <div className="text-2xl font-black text-purple-300 font-mono">{institutionalData.institutionalRatio}% {isBuy ? 'ACHAT' : 'VENTE'}</div>
                    <div className="text-3xs text-slate-400 mt-1">Accumulation nette d'ordres limites et absorption de liquidité.</div>
                  </div>

                  <div className="bg-rose-950/30 p-3 rounded-lg border border-rose-500/30">
                    <div className="text-3xs text-rose-300 font-bold mb-1">Traders Particuliers (Retail Sentiment)</div>
                    <div className="text-2xl font-black text-rose-300 font-mono">{institutionalData.retailRatio}% {isBuy ? 'VENTE' : 'ACHAT'}</div>
                    <div className="text-3xs text-slate-400 mt-1">Piégeage classique (Trapped Traders) créant le carburant du mouvement.</div>
                  </div>
                </div>

                <p className="text-2xs text-slate-400 leading-relaxed italic border-t border-slate-800/80 pt-2">
                  📌 <strong>Principe Institutionnel :</strong> Les grandes banques et teneurs de marché ont besoin de contreparties. Le fait que {institutionalData.retailRatio}% des particuliers soient orientés à contre-courant valide l'impulsion {isBuy ? 'haussière' : 'baissière'} par effet de squeeze.
                </p>
              </div>

              {/* Order Blocks list from price action */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-2xs font-bold text-slate-300">
                  <span className="flex items-center gap-1 text-purple-400">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Order Blocks Détectés sur l'Historique ({orderBlocks.length})</span>
                  </span>
                  <span className="text-3xs text-slate-400">Smart Money SMC</span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {orderBlocks.map((ob) => {
                    const isDemand = ob.type === 'BULLISH_DEMAND';
                    return (
                      <div
                        key={ob.id}
                        className={`p-2 rounded-lg border text-2xs flex items-center justify-between ${
                          isDemand
                            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                            : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold flex items-center gap-1.5">
                            <span>{isDemand ? '🏛️ DEMAND OB (Zone Acheteuse)' : '🏛️ SUPPLY OB (Zone Vendeuse)'}</span>
                            <span className={`px-1.5 py-0.2 rounded text-3xs font-mono ${
                              ob.status === 'UNMITIGATED' ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {ob.status === 'UNMITIGATED' ? 'NON MITIGÉ (FRAIS)' : 'TESTÉ'}
                            </span>
                          </div>
                          <div className="font-mono text-3xs text-slate-400">
                            Borne: {ob.low.toFixed(decimals)} - {ob.high.toFixed(decimals)} | 50% MT: {ob.equilibrium.toFixed(decimals)} ({ob.pipRange} pips)
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-bold font-mono text-purple-300">{ob.strengthScore}%★</div>
                          <div className="text-3xs text-cyan-400 font-mono">+{ob.displacementPips}p</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Power of 3 (AMD) Model */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-2xs font-bold text-slate-300">
                  <span>Modèle Algorithmique ICT / AMD (Power of 3)</span>
                  <span className="text-emerald-400 font-mono">{institutionalData.amdPhase}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-3xs font-mono">
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <span className="text-slate-400 block">1. Accumulation</span>
                    <span className="text-slate-300 text-3xs">Session Asie</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <span className="text-amber-400 block">2. Manipulation</span>
                    <span className="text-amber-300 text-3xs">Judas Swing Londres</span>
                  </div>
                  <div className="p-2 bg-emerald-950/60 rounded border border-emerald-500/50">
                    <span className="text-emerald-300 font-black block">3. Distribution</span>
                    <span className="text-emerald-400 text-3xs font-bold">Impulsion NY (En cours)</span>
                  </div>
                </div>
              </div>

              {/* Macro & COT Catalysts */}
              <div className="p-3 bg-purple-950/20 border border-purple-500/30 rounded-xl text-3xs text-slate-300 leading-relaxed">
                <span className="font-bold text-purple-300 block mb-1">Rapports Macro & COT (Commitment of Traders) :</span>
                {institutionalData.cotSentiment}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <button
                onClick={() => setShowInstitutionalDrawer(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
              >
                Fermer
              </button>

              <button
                onClick={() => {
                  setShowInstitutionalDrawer(false);
                  handleExecuteOrder(signalDirection);
                }}
                className={`flex items-center gap-1.5 px-4 py-2 font-black text-xs rounded-xl shadow-lg transition-all active:scale-95 ${
                  isBuy ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-rose-600 hover:bg-rose-500 text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>EXÉCUTER ORDRE INSTITUTIONNEL ({lotSize} lot)</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 7. BOTTOM CONTROLS STRIP */}
      <div className="absolute bottom-2 left-2 sm:left-4 z-30 flex flex-wrap items-center gap-1.5 bg-slate-950/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl shadow-lg border border-slate-800 text-xs">
        
        {/* Toggle Order Block Overlay Boxes */}
        <button
          onClick={() => setShowOrderBlocksOverlay(!showOrderBlocksOverlay)}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-2xs font-bold transition-all ${
            showOrderBlocksOverlay ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50 font-black' : 'bg-slate-800 text-slate-400'
          }`}
          title="Afficher/Masquer le calque des Order Blocks institutionnels (Supply & Demand) dessinés sur le graphique"
        >
          <Layers className="w-3 h-3 text-purple-400" />
          <span>Zones Order Blocks</span>
        </button>

        {/* Toggle Institutional SMC Lines */}
        <button
          onClick={() => setShowSMCLevels(!showSMCLevels)}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-2xs font-bold transition-all ${
            showSMCLevels ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40' : 'bg-slate-800 text-slate-400'
          }`}
          title="Afficher/Masquer les niveaux institutionnels SMC sur l'axe des prix"
        >
          <Landmark className="w-3 h-3 text-purple-400" />
          <span>Lignes SMC</span>
        </button>

        {/* Toggle Levels Lines */}
        <button
          onClick={() => setShowEntryZone(!showEntryZone)}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-2xs font-bold transition-all ${
            showEntryZone ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40' : 'bg-slate-800 text-slate-400'
          }`}
          title="Afficher/Masquer la zone d'entrée"
        >
          <Crosshair className="w-3 h-3" />
          <span>Zone Entrée</span>
        </button>

        <button
          onClick={() => setShowStopLoss(!showStopLoss)}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-2xs font-bold transition-all ${
            showStopLoss ? 'bg-rose-600/20 text-rose-300 border border-rose-500/40' : 'bg-slate-800 text-slate-400'
          }`}
          title="Afficher/Masquer le Stop Loss"
        >
          <ShieldAlert className="w-3 h-3" />
          <span>Stop Loss</span>
        </button>

        <button
          onClick={() => setShowTakeProfits(!showTakeProfits)}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-2xs font-bold transition-all ${
            showTakeProfits ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
          }`}
          title="Afficher/Masquer les Take Profits"
        >
          <Target className="w-3 h-3" />
          <span>Take Profits</span>
        </button>

        <button
          onClick={handleResetView}
          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
          title="Recentrer le graphique"
        >
          <RotateCcw className="w-3 h-3" />
        </button>

        {/* Switch Direction (BUY vs SELL) */}
        <div className="flex items-center gap-0.5 bg-slate-900 p-0.5 rounded-lg border border-slate-800 ml-1">
          <button
            onClick={() => setSignalDirection('BUY')}
            className={`px-2 py-0.5 rounded text-3xs font-black transition-colors ${
              isBuy ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            BUY
          </button>
          <button
            onClick={() => setSignalDirection('SELL')}
            className={`px-2 py-0.5 rounded text-3xs font-black transition-colors ${
              !isBuy ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            SELL
          </button>
        </div>

      </div>

      {/* 8. MAIN CHART AREA */}
      <div className="relative flex-1 w-full h-full">
        {/* Native Lightweight Chart */}
        <div
          ref={chartContainerRef}
          className={`w-full h-full ${chartMode === 'native' ? 'block' : 'hidden'}`}
        />

        {/* Visual Overlay for Institutional Order Blocks (Supply & Demand Zones) */}
        {chartMode === 'native' && (
          <OrderBlockOverlay
            chart={chartInstance}
            series={seriesInstance}
            orderBlocks={orderBlocks}
            pair={selectedPair}
            visible={showOrderBlocksOverlay}
            onToggleVisible={() => setShowOrderBlocksOverlay((prev) => !prev)}
            onExecuteOrderAtBlock={(price, type) => {
              handleExecuteOrder(type, price);
            }}
          />
        )}

        {/* TradingView Web Widget (iframe) */}
        <div
          ref={tvIframeContainerRef}
          className={`w-full h-full ${chartMode === 'iframe' ? 'block' : 'hidden'}`}
        />
      </div>

    </div>
  );
}
