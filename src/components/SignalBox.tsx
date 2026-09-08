import { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronUp, Sparkles, Calculator, ShieldAlert, Target } from 'lucide-react';
import { ForexSignal, ForexPair } from '../types';
import { playTradeSound } from '../data/forexData';

interface Props {
  pair: ForexPair;
  signal?: ForexSignal | null;
  onOpenCalculator: () => void;
  onGoToAI: () => void;
  audioEnabled: boolean;
}

export default function SignalBox({
  pair,
  signal,
  onOpenCalculator,
  onGoToAI,
  audioEnabled,
}: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fallback default signal values if not found for the selected pair
  const defaultBuy = {
    type: 'BUY' as const,
    entryPrice: pair.basePrice,
    stopLoss: Number((pair.basePrice - pair.pipMultiplier * 26).toFixed(pair.decimals)),
    tp1: Number((pair.basePrice + pair.pipMultiplier * 25).toFixed(pair.decimals)),
    tp2: Number((pair.basePrice + pair.pipMultiplier * 50).toFixed(pair.decimals)),
    tp3: Number((pair.basePrice + pair.pipMultiplier * 85).toFixed(pair.decimals)),
    riskReward: '3:1',
    confidence: 86,
  };

  const current = signal || defaultBuy;
  const isBuy = current.type === 'BUY';

  const handleCopy = () => {
    const text = `🎯 SIGNAL AI FOREX (${pair.name})
Direction: ${isBuy ? 'ACHAT (LONG)' : 'VENTE (SHORT)'}
Entrée: ${current.entryPrice}
Stop Loss: ${current.stopLoss}
TP1: ${current.tp1}
TP2: ${current.tp2}
TP3: ${current.tp3}
R:R: ${current.riskReward}
Confiance IA: ${current.confidence}%`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      if (audioEnabled) playTradeSound('success');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 w-64 sm:w-72 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/80 overflow-hidden transition-all duration-300 select-none">
      
      {/* Header bar */}
      <div className={`p-3 sm:p-3.5 flex items-center justify-between border-b ${
        isBuy ? 'bg-emerald-50/70 border-emerald-100' : 'bg-rose-50/70 border-rose-100'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isBuy ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
            <Target className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className={`text-base sm:text-lg font-black tracking-tight ${
                isBuy ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                {isBuy ? 'LONG 📈' : 'SHORT 📉'}
              </span>
              <span className="text-2xs font-bold px-1.5 py-0.5 rounded-sm bg-gray-900 text-emerald-400">
                IA
              </span>
            </div>
            <p className="text-2xs font-semibold text-gray-500">{pair.name} • {signal?.timeframe || 'M15'}</p>
          </div>
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white/80 transition-colors"
          title={isCollapsed ? 'Agrandir' : 'Réduire'}
        >
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Signal Details */}
      {!isCollapsed && (
        <div className="p-3.5 space-y-2.5 text-xs sm:text-sm">
          
          {/* Confidence bar */}
          <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
            <div className="flex justify-between items-center text-2xs font-bold text-gray-500 mb-1">
              <span>Indice de Confiance IA</span>
              <span className="text-emerald-600 font-mono text-xs">{current.confidence}%</span>
            </div>
            <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${current.confidence}%` }}
              />
            </div>
          </div>

          {/* Numbers Grid */}
          <div className="space-y-1.5 font-mono">
            <div className="flex justify-between items-center py-0.5 border-b border-gray-100">
              <span className="text-gray-500 text-xs font-sans">Entrée (Entry):</span>
              <span className="font-bold text-gray-900">{current.entryPrice}</span>
            </div>

            <div className="flex justify-between items-center py-0.5 border-b border-gray-100">
              <span className="text-gray-500 text-xs font-sans flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-rose-500 inline" /> Stop Loss:
              </span>
              <span className="font-bold text-rose-600">{current.stopLoss}</span>
            </div>

            <div className="flex justify-between items-center py-0.5 border-b border-gray-100">
              <span className="text-gray-500 text-xs font-sans">Take Profit 1:</span>
              <span className="font-bold text-emerald-600">{current.tp1}</span>
            </div>

            <div className="flex justify-between items-center py-0.5 border-b border-gray-100">
              <span className="text-gray-500 text-xs font-sans">Take Profit 2:</span>
              <span className="font-bold text-emerald-600">{current.tp2}</span>
            </div>

            <div className="flex justify-between items-center py-0.5 border-b border-gray-100">
              <span className="text-gray-500 text-xs font-sans">Take Profit 3:</span>
              <span className="font-bold text-emerald-600">{current.tp3}</span>
            </div>

            <div className="flex justify-between items-center py-0.5">
              <span className="text-gray-500 text-xs font-sans">Ratio Risque:Rendement:</span>
              <span className="font-bold text-amber-500">{current.riskReward}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-1 py-1.5 px-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copié !' : 'Copier'}</span>
            </button>

            <button
              onClick={onOpenCalculator}
              className="flex items-center justify-center gap-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold transition-colors"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Calculer</span>
            </button>
          </div>

          <button
            onClick={onGoToAI}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-gray-900 hover:bg-black text-emerald-400 rounded-lg text-xs font-bold transition-colors mt-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Consulter l'Analyse IA Complète</span>
          </button>
        </div>
      )}
    </div>
  );
}
