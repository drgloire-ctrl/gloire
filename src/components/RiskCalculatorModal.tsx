import { useState } from 'react';
import { X, Calculator, ShieldCheck } from 'lucide-react';
import { ForexPair, ForexSignal, TradingSettings } from '../types';
import { calculatePositionSize } from '../data/forexData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  pair: ForexPair;
  signal?: ForexSignal | null;
  settings: TradingSettings;
}

export default function RiskCalculatorModal({ isOpen, onClose, pair, signal, settings }: Props) {
  const [balance, setBalance] = useState<number>(settings.accountBalance);
  const [riskPercent, setRiskPercent] = useState<number>(settings.riskPercent);
  const [entryPrice, setEntryPrice] = useState<number>(signal ? signal.entryPrice : pair.basePrice);
  const [stopLoss, setStopLoss] = useState<number>(
    signal
      ? signal.stopLoss
      : pair.basePrice - (pair.pipMultiplier * 25)
  );

  if (!isOpen) return null;

  const result = calculatePositionSize(balance, riskPercent, entryPrice, stopLoss, pair.pipMultiplier);

  return (
    <div className="fixed inset-0 z-150 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Calculateur de Risque & Lots</h3>
              <p className="text-xs text-gray-500">Paire active: {pair.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 py-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Capital du Compte ($)
            </label>
            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-mono text-gray-900"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1">
              <span>Risque souhaité</span>
              <span className="text-emerald-600 font-bold">{riskPercent}%</span>
            </div>
            <div className="flex gap-2">
              {[0.5, 1.0, 1.5, 2.0, 3.0].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setRiskPercent(pct)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    riskPercent === pct
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Prix d'Entrée
              </label>
              <input
                type="number"
                step="0.00001"
                value={entryPrice}
                onChange={(e) => setEntryPrice(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-mono text-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Stop Loss (SL)
              </label>
              <input
                type="number"
                step="0.00001"
                value={stopLoss}
                onChange={(e) => setStopLoss(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-mono text-gray-900"
              />
            </div>
          </div>

          {/* Results Display */}
          <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-4 mt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-600">Taille de position suggérée:</span>
              <span className="text-xl font-extrabold text-emerald-700 font-mono">
                {result.lotSize} Lots
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-emerald-200/50">
              <div>
                <span className="text-gray-500">Risque financier max:</span>
                <p className="font-bold text-gray-800 font-mono">${result.riskAmount}</p>
              </div>
              <div>
                <span className="text-gray-500">Distance SL:</span>
                <p className="font-bold text-gray-800 font-mono">{result.pipsRisk} pips</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 text-xs text-gray-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Calcul basé sur une valeur standard de pip institutionnelle.</span>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-xs"
        >
          Appliquer et Fermer
        </button>
      </div>
    </div>
  );
}
