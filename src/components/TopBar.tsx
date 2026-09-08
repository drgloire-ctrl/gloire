import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Volume2, VolumeX, Calculator, Sparkles, TrendingUp, TrendingDown, Clock, Search } from 'lucide-react';
import { ForexPair } from '../types';
import { FOREX_PAIRS, playTradeSound } from '../data/forexData';

interface Props {
  selectedPair: ForexPair;
  onSelectPair: (pair: ForexPair) => void;
  timeframe: string;
  onChangeTimeframe: (tf: string) => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  onOpenCalculator: () => void;
  onGoToAI: () => void;
}

const TIMEFRAMES = ['M1', 'M3', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'];

export default function TopBar({
  selectedPair,
  onSelectPair,
  timeframe,
  onChangeTimeframe,
  audioEnabled,
  onToggleAudio,
  onOpenCalculator,
  onGoToAI,
}: Props) {
  const [currentPrice, setCurrentPrice] = useState<number>(selectedPair.basePrice);
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update current price when pair changes
  useEffect(() => {
    setCurrentPrice(selectedPair.basePrice);
  }, [selectedPair]);

  // Simulate realistic micro ticks
  useEffect(() => {
    const interval = setInterval(() => {
      const deltaFactor = (Math.random() - 0.49) * selectedPair.pipMultiplier * 0.8;
      setCurrentPrice((prev) => {
        const next = Number((prev + deltaFactor).toFixed(selectedPair.decimals));
        if (next > prev) setPriceFlash('up');
        else if (next < prev) setPriceFlash('down');
        setTimeout(() => setPriceFlash(null), 600);
        return next;
      });
    }, 2200);

    return () => clearInterval(interval);
  }, [selectedPair]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeIsPositive = selectedPair.change24h >= 0;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-2xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Pair selector & Live Price */}
          <div className="flex items-center gap-4">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors text-left"
              >
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Paire Forex</span>
                  <span className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                    {selectedPair.name}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-72 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden py-1 max-h-96 overflow-y-auto">
                  {/* Search input */}
                  <div className="p-2 border-b border-gray-100 bg-gray-50/70 sticky top-0 z-10">
                    <div className="relative flex items-center">
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5" />
                      <input
                        type="text"
                        placeholder="Rechercher (ex: XAU, Or, BTC, EUR)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-2.5 py-1 text-xs bg-white border border-gray-200 rounded-lg outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="px-3 py-1.5 text-2xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                    Actifs disponibles ({FOREX_PAIRS.length})
                  </div>

                  {FOREX_PAIRS.filter((p) =>
                    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.category.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map((pair) => {
                    const isGold = pair.id === 'XAUUSD';
                    const isSelected = selectedPair.id === pair.id;
                    return (
                      <button
                        key={pair.id}
                        onClick={() => {
                          onSelectPair(pair);
                          setIsDropdownOpen(false);
                          setSearchQuery('');
                          if (audioEnabled) playTradeSound('beep');
                        }}
                        className={`w-full px-3 py-2 text-left flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-emerald-50/90 font-bold text-emerald-900 border-l-3 border-emerald-500'
                            : isGold
                            ? 'bg-amber-50/60 hover:bg-amber-50 text-amber-950 border-l-2 border-amber-400'
                            : 'hover:bg-gray-50 text-gray-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isGold && <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />}
                          <div>
                            <div className="text-sm font-semibold flex items-center gap-1.5">
                              {pair.name}
                              {isGold && (
                                <span className="text-3xs font-bold uppercase tracking-wider px-1.5 py-0.2 bg-amber-200 text-amber-900 rounded-sm">
                                  Top
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400">{pair.category} • Spread {pair.spreadPips}p</div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-mono font-bold text-gray-700">{pair.basePrice}</div>
                          <div className={`text-2xs font-semibold ${pair.change24h >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {pair.change24h >= 0 ? '+' : ''}{pair.change24h}%
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Price badge with tick animation */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xl sm:text-2xl font-mono font-black transition-colors duration-300 ${
                    priceFlash === 'up'
                      ? 'text-emerald-500 bg-emerald-50 px-1 rounded-sm'
                      : priceFlash === 'down'
                      ? 'text-rose-500 bg-rose-50 px-1 rounded-sm'
                      : 'text-gray-900'
                  }`}
                >
                  {currentPrice.toFixed(selectedPair.decimals)}
                </span>
                
                <span
                  className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-xs font-bold ${
                    changeIsPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {changeIsPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {changeIsPositive ? '+' : ''}{selectedPair.change24h}%
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                <span>Spread: <strong className="text-gray-700 font-mono">{selectedPair.spreadPips} pips</strong></span>
                <span className="hidden sm:inline">H: <span className="font-mono text-gray-700">{selectedPair.high24h}</span></span>
                <span className="hidden sm:inline">B: <span className="font-mono text-gray-700">{selectedPair.low24h}</span></span>
              </div>
            </div>
          </div>

          {/* Timeframe & Action Badges */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            {/* Timeframe Selector */}
            <div className="hidden md:flex items-center bg-gray-100 p-1 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-gray-400 ml-1.5 mr-1" />
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  onClick={() => onChangeTimeframe(tf)}
                  className={`px-2 py-1 text-xs font-bold rounded-lg transition-all ${
                    timeframe === tf
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* AI Active Pill */}
            <button
              onClick={onGoToAI}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-black text-emerald-400 rounded-xl text-xs font-bold shadow-xs transition-transform active:scale-95"
              title="Consulter l'analyse IA avancée"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
              <span className="hidden xs:inline">SIGNAL IA ACTIF</span>
              <span className="xs:hidden">IA</span>
            </button>

            {/* Position Size / Calculator trigger */}
            <button
              onClick={onOpenCalculator}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200 transition-colors"
              title="Calculer la taille des lots et le risque"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lots</span>
            </button>

            {/* Audio Toggle */}
            <button
              onClick={onToggleAudio}
              className={`p-2 rounded-xl border transition-colors ${
                audioEnabled
                  ? 'bg-gray-100 text-gray-700 border-gray-200'
                  : 'bg-gray-50 text-gray-400 border-gray-200'
              }`}
              title={audioEnabled ? 'Désactiver les alertes sonores' : 'Activer les alertes sonores'}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
