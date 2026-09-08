import { useState } from 'react';
import { Settings, Shield, Volume2, Moon, Sun, Sliders, CheckCircle2, AlertTriangle, Save } from 'lucide-react';
import { TradingSettings } from '../types';
import { playTradeSound } from '../data/forexData';

interface Props {
  settings: TradingSettings;
  onUpdateSettings: (newSettings: TradingSettings) => void;
}

export default function SettingsView({ settings, onUpdateSettings }: Props) {
  const [localSettings, setLocalSettings] = useState<TradingSettings>(settings);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onUpdateSettings(localSettings);
    setSaved(true);
    if (localSettings.audioAlerts) playTradeSound('success');
    setTimeout(() => setSaved(false), 2500);
  };

  const handleTestAudio = () => {
    playTradeSound('success');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-28">
      
      {/* Title */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gray-100 text-gray-800 rounded-xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">Paramètres & Gestion du Risque</h2>
            <p className="text-xs sm:text-sm text-gray-500">Configurez votre profil de trading et vos règles de calcul.</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm"
        >
          {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{saved ? 'Enregistré !' : 'Sauvegarder'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Account & Capital Management */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
            <Shield className="w-4 h-4" />
            <span>Gestion du Capital & Risque</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Capital du Compte ($)
            </label>
            <input
              type="number"
              value={localSettings.accountBalance}
              onChange={(e) => setLocalSettings({ ...localSettings, accountBalance: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1">
              <span>Risque par Trade (%)</span>
              <span className="text-emerald-600 font-bold">{localSettings.riskPercent}%</span>
            </div>
            <div className="flex gap-2">
              {[0.5, 1.0, 1.5, 2.0, 3.0].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setLocalSettings({ ...localSettings, riskPercent: pct })}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    localSettings.riskPercent === pct
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Effet de Levier
            </label>
            <select
              value={localSettings.leverage}
              onChange={(e) => setLocalSettings({ ...localSettings, leverage: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-gray-900"
            >
              <option value={30}>1:30 (Réglementé UE / ESMA)</option>
              <option value={100}>1:100 (Standard)</option>
              <option value={200}>1:200 (Avancé)</option>
              <option value={500}>1:500 (Offshore / Pro)</option>
            </select>
          </div>
        </div>

        {/* Interface & Preferences */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
            <Sliders className="w-4 h-4" />
            <span>Interface & Alertes</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Timeframe d'Analyse Favori
            </label>
            <select
              value={localSettings.preferredTimeframe}
              onChange={(e) => setLocalSettings({ ...localSettings, preferredTimeframe: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-gray-900"
            >
              <option value="M1">M1 (Scalping Ultra-Rapide)</option>
              <option value="M5">M5 (Scalping Dynamique)</option>
              <option value="M15">M15 (Day Trading Institutionnel)</option>
              <option value="M30">M30 (Day Trading)</option>
              <option value="H1">H1 (Swing Court Terme)</option>
              <option value="H4">H4 (Swing Trading)</option>
              <option value="D1">D1 (Positionnel)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Thème TradingView
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, chartTheme: 'light' })}
                className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border transition-all ${
                  localSettings.chartTheme === 'light'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Thème Clair</span>
              </button>

              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, chartTheme: 'dark' })}
                className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border transition-all ${
                  localSettings.chartTheme === 'dark'
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Moon className="w-4 h-4 text-emerald-400" />
                <span>Thème Sombre</span>
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-800 block">Alertes Sonores</span>
              <span className="text-2xs text-gray-500">Signaux et actions confirmées</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestAudio}
                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1"
                title="Tester le son"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Tester</span>
              </button>
              <input
                type="checkbox"
                checked={localSettings.audioAlerts}
                onChange={(e) => setLocalSettings({ ...localSettings, audioAlerts: e.target.checked })}
                className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Trade Automation Rules */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
        <h4 className="text-sm font-bold text-gray-900">Règles de Sécurisation Intelligente (Trade Management)</h4>
        
        <label className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100/70 rounded-xl cursor-pointer transition-colors">
          <div>
            <span className="text-xs font-bold text-gray-800 block">Passage automatique au Breakeven au TP1</span>
            <span className="text-2xs text-gray-500">Déplace le Stop Loss au prix d'entrée dès que le Take Profit 1 est atteint pour éliminer le risque.</span>
          </div>
          <input
            type="checkbox"
            checked={localSettings.autoBreakeven}
            onChange={(e) => setLocalSettings({ ...localSettings, autoBreakeven: e.target.checked })}
            className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
          />
        </label>
      </div>

      {/* Regulatory & Risk Disclaimer */}
      <div className="bg-amber-50/60 border border-amber-200/80 p-4 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="block mb-0.5">Avertissement sur les risques financiers (CFD / Forex) :</strong>
          Le trading sur devises et matières premières comporte un niveau de risque élevé et peut ne pas convenir à tous les investisseurs. Les signaux fournis par l'intelligence artificielle constituent une aide à la décision technique et ne constituent en aucun cas un conseil en investissement personnalisé. N'investissez que des capitaux que vous êtes prêt à perdre.
        </div>
      </div>

    </div>
  );
}
