import { useState } from 'react';
import { Target, TrendingUp, TrendingDown, CheckCircle2, Clock, Copy, Check, ExternalLink, Award, BarChart3, ShieldCheck } from 'lucide-react';
import { ForexSignal, ForexPair } from '../types';
import { FOREX_PAIRS, playTradeSound } from '../data/forexData';

interface Props {
  signals: ForexSignal[];
  onSelectPairAndGoToChart: (pair: ForexPair) => void;
  audioEnabled: boolean;
}

export default function SignalsListView({
  signals,
  onSelectPairAndGoToChart,
  audioEnabled,
}: Props) {
  const [filter, setFilter] = useState<'ALL' | 'BUY' | 'SELL' | 'ACTIVE' | 'TP'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredSignals = signals.filter((sig) => {
    if (filter === 'BUY') return sig.type === 'BUY';
    if (filter === 'SELL') return sig.type === 'SELL';
    if (filter === 'ACTIVE') return sig.status === 'ACTIVE' || sig.status === 'PENDING';
    if (filter === 'TP') return sig.status.startsWith('TP');
    return true;
  });

  const handleCopy = (sig: ForexSignal) => {
    const text = `🎯 SIGNAL AI FOREX (${sig.pairName})
Direction: ${sig.type === 'BUY' ? 'ACHAT' : 'VENTE'}
Entrée: ${sig.entryPrice}
Stop Loss: ${sig.stopLoss}
TP1: ${sig.tp1} | TP2: ${sig.tp2} | TP3: ${sig.tp3}
R:R: ${sig.riskReward}
Confiance: ${sig.confidence}%`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(sig.id);
      if (audioEnabled) playTradeSound('success');
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const getStatusBadge = (status: ForexSignal['status']) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            En cours
          </span>
        );
      case 'TP1_HIT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            TP1 Atteint
          </span>
        );
      case 'TP2_HIT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            TP2 Atteint
          </span>
        );
      case 'TP3_HIT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white shadow-xs">
            <Award className="w-3.5 h-3.5 text-white" />
            Full TP (+100%)
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
            <Clock className="w-3.5 h-3.5 text-gray-500" />
            En attente
          </span>
        );
      case 'SL_HIT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
            Stop Loss
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 pb-24">
      
      {/* Performance Highlights Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <span className="text-xs font-bold text-gray-500 block mb-1">Taux de Réussite (Win Rate)</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">78.4%</span>
            <span className="text-2xs text-gray-400 font-semibold">sur 142 trades</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <span className="text-xs font-bold text-gray-500 block mb-1">Pips Nets Gagnés</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">+1,420</span>
            <span className="text-2xs text-emerald-700 font-bold">pips</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <span className="text-xs font-bold text-gray-500 block mb-1">Facteur de Profit</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-gray-900 font-mono">2.45</span>
            <span className="text-2xs text-gray-400 font-semibold">Excellence</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <span className="text-xs font-bold text-gray-500 block mb-1">Ratio R:R Moyen</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-amber-600 font-mono">3.1 : 1</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'Tous les Signaux' },
            { id: 'ACTIVE', label: '🟢 Actifs' },
            { id: 'BUY', label: 'Achat (Long)' },
            { id: 'SELL', label: 'Vente (Short)' },
            { id: 'TP', label: '🎯 Objectifs Atteints' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as typeof filter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                filter === tab.id
                  ? 'bg-gray-900 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-gray-500 font-semibold">
          {filteredSignals.length} signaux trouvés
        </span>
      </div>

      {/* Signals List Cards */}
      <div className="space-y-4">
        {filteredSignals.map((sig) => {
          const isBuy = sig.type === 'BUY';
          const pairObj = FOREX_PAIRS.find((p) => p.id === sig.pairId) || FOREX_PAIRS[0];

          return (
            <div
              key={sig.id}
              className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl ${
                      isBuy ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {isBuy ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-gray-900 text-base sm:text-lg">
                        {sig.pairName}
                      </h4>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                          isBuy ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                        }`}
                      >
                        {isBuy ? 'ACHAT (BUY)' : 'VENTE (SELL)'}
                      </span>
                      <span className="text-xs font-mono font-bold bg-gray-100 px-2 py-0.5 rounded-md text-gray-600">
                        {sig.timeframe}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                      <span>{sig.timestamp}</span>
                      <span>•</span>
                      <span>Confiance IA: <strong className="text-gray-700 font-mono">{sig.confidence}%</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  {getStatusBadge(sig.status)}
                  {sig.pipsGained > 0 && (
                    <span className="font-mono font-black text-emerald-600 text-sm">
                      +{sig.pipsGained} pips
                    </span>
                  )}
                </div>
              </div>

              {/* Price Targets Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 sm:gap-3 py-3 font-mono text-xs">
                <div className="bg-gray-50 p-2.5 rounded-xl">
                  <span className="text-gray-500 block text-2xs font-sans">Entrée</span>
                  <span className="font-bold text-gray-900">{sig.entryPrice}</span>
                </div>

                <div className="bg-rose-50/50 p-2.5 rounded-xl">
                  <span className="text-rose-500 block text-2xs font-sans">Stop Loss (SL)</span>
                  <span className="font-bold text-rose-700">{sig.stopLoss}</span>
                </div>

                <div className="bg-emerald-50/40 p-2.5 rounded-xl">
                  <span className="text-emerald-600 block text-2xs font-sans">Take Profit 1</span>
                  <span className="font-bold text-emerald-700">{sig.tp1}</span>
                </div>

                <div className="bg-emerald-50/40 p-2.5 rounded-xl">
                  <span className="text-emerald-600 block text-2xs font-sans">Take Profit 2</span>
                  <span className="font-bold text-emerald-700">{sig.tp2}</span>
                </div>

                <div className="bg-emerald-50/40 p-2.5 rounded-xl">
                  <span className="text-emerald-600 block text-2xs font-sans">Take Profit 3</span>
                  <span className="font-bold text-emerald-700">{sig.tp3}</span>
                </div>

                <div className="bg-amber-50/50 p-2.5 rounded-xl">
                  <span className="text-amber-600 block text-2xs font-sans">Ratio R:R</span>
                  <span className="font-bold text-amber-700">{sig.riskReward}</span>
                </div>
              </div>

              {/* Technical Rationale */}
              <div className="pt-2 text-xs text-gray-600 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong>Justification institutionnelle :</strong> {sig.rationale}
                </span>
              </div>

              {/* Action Buttons Footer */}
              <div className="flex items-center justify-end gap-2 pt-4 mt-2 border-t border-gray-100">
                <button
                  onClick={() => handleCopy(sig)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors"
                >
                  {copiedId === sig.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copier Paramètres</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => onSelectPairAndGoToChart(pairObj)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  <span>Afficher le Graphique</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
