import { useEffect, useState, useCallback, useRef } from 'react';
import { IChartApi, ISeriesApi } from 'lightweight-charts';
import {
  Layers,
  Sparkles,
  Target,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  Eye,
  EyeOff,
  Filter,
  X,
  Crosshair,
} from 'lucide-react';
import { ForexPair } from '../types';
import { InstitutionalOrderBlock } from '../utils/smcAnalysis';

interface Props {
  chart: IChartApi | null;
  series: ISeriesApi<'Candlestick'> | null;
  orderBlocks: InstitutionalOrderBlock[];
  pair: ForexPair;
  visible: boolean;
  onToggleVisible: () => void;
  onExecuteOrderAtBlock?: (price: number, type: 'BUY' | 'SELL') => void;
}

interface BlockCoordinate {
  ob: InstitutionalOrderBlock;
  x: number;
  y: number;
  width: number;
  height: number;
  midY: number;
  isOffscreen: boolean;
}

export default function OrderBlockOverlay({
  chart,
  series,
  orderBlocks,
  pair,
  visible,
  onToggleVisible,
  onExecuteOrderAtBlock,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [coordinates, setCoordinates] = useState<BlockCoordinate[]>([]);
  const [filterMode, setFilterMode] = useState<'ALL' | 'UNMITIGATED' | 'DEMAND' | 'SUPPLY'>('UNMITIGATED');
  const [selectedOB, setSelectedOB] = useState<InstitutionalOrderBlock | null>(null);
  const [hoveredOBId, setHoveredOBId] = useState<string | null>(null);

  // Recalculate pixel coordinates of the Order Blocks on the chart canvas
  const updateCoordinates = useCallback(() => {
    if (!chart || !series || !containerRef.current || !visible) {
      setCoordinates([]);
      return;
    }

    const containerWidth = containerRef.current.clientWidth || 800;
    const containerHeight = containerRef.current.clientHeight || 550;

    const timeScale = chart.timeScale();
    const coords: BlockCoordinate[] = [];

    orderBlocks.forEach((ob) => {
      const startX = timeScale.timeToCoordinate(ob.time);
      const topY = series.priceToCoordinate(ob.high);
      const bottomY = series.priceToCoordinate(ob.low);
      const midY = series.priceToCoordinate(ob.equilibrium);

      // If price bounds are not available, skip
      if (topY === null || bottomY === null) return;

      const y = Math.min(topY, bottomY);
      const height = Math.max(12, Math.abs(bottomY - topY));

      // Order Blocks extend from their origin candle to the current live price axis
      const x = startX !== null ? Math.max(0, startX) : 0;
      const width = Math.max(80, containerWidth - x - 55); // leave margin for price scale axis

      const isOffscreen = y < -50 || y > containerHeight + 50;

      coords.push({
        ob,
        x,
        y,
        width,
        height,
        midY: midY !== null ? midY : y + height / 2,
        isOffscreen,
      });
    });

    setCoordinates(coords);
  }, [chart, series, orderBlocks, visible]);

  // Subscribe to chart movements, zooms and pans
  useEffect(() => {
    if (!chart || !visible) return;

    updateCoordinates();

    const timeScale = chart.timeScale();
    timeScale.subscribeVisibleTimeRangeChange(updateCoordinates);
    timeScale.subscribeVisibleLogicalRangeChange(updateCoordinates);

    const resizeObserver = new ResizeObserver(() => {
      updateCoordinates();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Secondary interval to catch rapid chart dimension stabilization
    const timer = setTimeout(updateCoordinates, 250);

    return () => {
      clearTimeout(timer);
      timeScale.unsubscribeVisibleTimeRangeChange(updateCoordinates);
      timeScale.unsubscribeVisibleLogicalRangeChange(updateCoordinates);
      resizeObserver.disconnect();
    };
  }, [chart, series, visible, updateCoordinates]);

  // Filtered blocks based on user preference
  const filteredCoordinates = coordinates.filter(({ ob }) => {
    if (filterMode === 'UNMITIGATED') return ob.status !== 'MITIGATED';
    if (filterMode === 'DEMAND') return ob.type === 'BULLISH_DEMAND';
    if (filterMode === 'SUPPLY') return ob.type === 'BEARISH_SUPPLY';
    return true;
  });

  const unmitigatedCount = orderBlocks.filter((b) => b.status === 'UNMITIGATED').length;
  const demandCount = orderBlocks.filter((b) => b.type === 'BULLISH_DEMAND').length;
  const supplyCount = orderBlocks.filter((b) => b.type === 'BEARISH_SUPPLY').length;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none z-15 overflow-hidden"
    >
      {/* 1. TOP-RIGHT ORDER BLOCK CONTROLS & FILTER BADGE */}
      <div className="absolute top-2 right-14 sm:right-16 z-25 pointer-events-auto flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-purple-500/40 shadow-xl text-2xs select-none">
        <button
          onClick={onToggleVisible}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-lg font-bold transition-colors ${
            visible
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
          title="Afficher ou masquer les Order Blocks institutionnels sur le graphique"
        >
          {visible ? <Eye className="w-3 h-3 text-purple-200" /> : <EyeOff className="w-3 h-3" />}
          <span>Order Blocks (SMC)</span>
        </button>

        {visible && (
          <div className="flex items-center gap-1 pl-1 border-l border-slate-800">
            <span className="text-3xs text-slate-400 hidden sm:inline">Filtre :</span>
            <div className="flex items-center bg-slate-950 p-0.5 rounded-md border border-slate-800 text-3xs font-bold">
              <button
                onClick={() => setFilterMode('UNMITIGATED')}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  filterMode === 'UNMITIGATED'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Afficher uniquement les Order Blocks frais non mitigés"
              >
                Actifs ({unmitigatedCount})
              </button>
              <button
                onClick={() => setFilterMode('DEMAND')}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  filterMode === 'DEMAND'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-emerald-300'
                }`}
                title="Zones de demande acheteuses uniquement"
              >
                Demande ({demandCount})
              </button>
              <button
                onClick={() => setFilterMode('SUPPLY')}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  filterMode === 'SUPPLY'
                    ? 'bg-rose-600 text-white'
                    : 'text-slate-400 hover:text-rose-300'
                }`}
                title="Zones d'offre vendeuses uniquement"
              >
                Offre ({supplyCount})
              </button>
              <button
                onClick={() => setFilterMode('ALL')}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  filterMode === 'ALL'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tous ({orderBlocks.length})
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. VISUAL ORDER BLOCK BOXES PROJECTED ONTO THE CANDLESTICK SCALE */}
      {visible &&
        filteredCoordinates.map(({ ob, x, y, width, height, midY, isOffscreen }) => {
          if (isOffscreen) return null;

          const isDemand = ob.type === 'BULLISH_DEMAND';
          const isUnmitigated = ob.status === 'UNMITIGATED';
          const isHovered = hoveredOBId === ob.id;
          const isSelected = selectedOB?.id === ob.id;

          // Theme colors
          const bgColor = isDemand
            ? isUnmitigated
              ? 'rgba(16, 185, 129, 0.18)'
              : 'rgba(16, 185, 129, 0.08)'
            : isUnmitigated
            ? 'rgba(244, 63, 94, 0.18)'
            : 'rgba(244, 63, 94, 0.08)';

          const borderColor = isDemand
            ? isUnmitigated
              ? 'rgba(52, 211, 153, 0.85)'
              : 'rgba(52, 211, 153, 0.35)'
            : isUnmitigated
            ? 'rgba(251, 113, 133, 0.85)'
            : 'rgba(251, 113, 133, 0.35)';

          return (
            <div
              key={ob.id}
              onClick={() => setSelectedOB(ob)}
              onMouseEnter={() => setHoveredOBId(ob.id)}
              onMouseLeave={() => setHoveredOBId(null)}
              className={`absolute pointer-events-auto cursor-pointer transition-all duration-150 rounded-xs select-none group ${
                isSelected ? 'ring-2 ring-purple-400 z-20' : 'z-10'
              }`}
              style={{
                left: `${x}px`,
                top: `${y}px`,
                width: `${width}px`,
                height: `${height}px`,
                backgroundColor: bgColor,
                borderTop: `1.5px solid ${borderColor}`,
                borderBottom: `1.5px solid ${borderColor}`,
                borderLeft: `2.5px solid ${isDemand ? '#10b981' : '#f43f5e'}`,
              }}
            >
              {/* Equilibrium 50% Mean Threshold dashed line */}
              <div
                className="absolute left-0 right-0 border-t border-dashed pointer-events-none opacity-50"
                style={{
                  top: `${Math.max(0, midY - y)}px`,
                  borderColor: isDemand ? '#34d399' : '#fb7185',
                }}
              />

              {/* Order Block Label Tag */}
              <div
                className={`absolute left-1.5 top-1 px-1.5 py-0.5 rounded text-3xs font-mono font-bold flex items-center gap-1 shadow-md transition-transform ${
                  isHovered ? 'scale-105' : ''
                } ${
                  isDemand
                    ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/50'
                    : 'bg-rose-950/90 text-rose-300 border border-rose-500/50'
                }`}
              >
                <span>{isDemand ? '🏛️ DEMAND OB' : '🏛️ SUPPLY OB'}</span>
                <span className="opacity-75">
                  ({ob.low.toFixed(pair.decimals)} - {ob.high.toFixed(pair.decimals)})
                </span>
                {isUnmitigated ? (
                  <span className="bg-amber-400/20 text-amber-300 px-1 rounded text-4xs font-sans">
                    FRAIS
                  </span>
                ) : (
                  <span className="bg-slate-800 text-slate-400 px-1 rounded text-4xs font-sans">
                    TESTÉ ({ob.testCount}x)
                  </span>
                )}
                <span className="text-purple-300 font-sans">{ob.strengthScore}%★</span>
              </div>

              {/* Equilibrium pill on right */}
              <div
                className="absolute right-1 text-4xs font-mono text-slate-400/80 px-1 py-0.2 rounded bg-slate-950/60 hidden sm:block pointer-events-none"
                style={{ top: `${Math.max(0, midY - y - 6)}px` }}
              >
                50% MT: {ob.equilibrium.toFixed(pair.decimals)}
              </div>
            </div>
          );
        })}

      {/* 3. INTERACTIVE ORDER BLOCK DETAIL CARD (WHEN CLICKED) */}
      {selectedOB && (
        <div className="absolute top-16 right-3 sm:right-6 z-35 pointer-events-auto bg-slate-900/95 border border-purple-500/60 rounded-2xl shadow-2xl p-4 max-w-sm w-full backdrop-blur-xl animate-in fade-in select-none">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div
                className={`p-1.5 rounded-lg ${
                  selectedOB.type === 'BULLISH_DEMAND'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-rose-600 text-white'
                }`}
              >
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                  <span>
                    {selectedOB.type === 'BULLISH_DEMAND'
                      ? 'Order Block Acheteur (Demande)'
                      : 'Order Block Vendeur (Offre)'}
                  </span>
                  <span
                    className={`text-3xs px-1.5 py-0.2 rounded font-mono ${
                      selectedOB.status === 'UNMITIGATED'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {selectedOB.status === 'UNMITIGATED' ? 'NON MITIGÉ' : 'MITIGÉ / TESTÉ'}
                  </span>
                </h4>
                <p className="text-3xs text-slate-400">
                  {pair.name} • {selectedOB.pipRange} pips de largeur
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedOB(null)}
              className="p-1 text-slate-400 hover:text-white rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Metrics Grid */}
          <div className="py-3 space-y-2 text-xs">
            {/* Range Levels */}
            <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
              <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                <span className="text-3xs text-slate-400 block font-sans">Borne Haute</span>
                <span className="font-bold text-slate-200 text-2xs">
                  {selectedOB.high.toFixed(pair.decimals)}
                </span>
              </div>
              <div className="bg-purple-950/40 p-1.5 rounded-lg border border-purple-500/40">
                <span className="text-3xs text-purple-300 block font-sans">50% Équilibre (MT)</span>
                <span className="font-black text-purple-300 text-2xs">
                  {selectedOB.equilibrium.toFixed(pair.decimals)}
                </span>
              </div>
              <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                <span className="text-3xs text-slate-400 block font-sans">Borne Basse</span>
                <span className="font-bold text-slate-200 text-2xs">
                  {selectedOB.low.toFixed(pair.decimals)}
                </span>
              </div>
            </div>

            {/* Institutional Stats */}
            <div className="space-y-1 text-2xs">
              <div className="flex justify-between py-1 px-2 bg-slate-950/60 rounded border border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" /> Score de Conviction IA :
                </span>
                <span className="font-bold font-mono text-emerald-400">
                  {selectedOB.strengthScore}%
                </span>
              </div>

              <div className="flex justify-between py-1 px-2 bg-slate-950/60 rounded border border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-cyan-400" /> Impulsion (Displacement) :
                </span>
                <span className="font-bold font-mono text-cyan-300">
                  +{selectedOB.displacementPips} pips
                </span>
              </div>

              <div className="flex justify-between py-1 px-2 bg-slate-950/60 rounded border border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-purple-400" /> Tests de Liquidité :
                </span>
                <span className="font-bold font-mono text-slate-200">
                  {selectedOB.testCount === 0 ? 'Zone Vierge (Haute Réactivité)' : `${selectedOB.testCount} re-test(s)`}
                </span>
              </div>
            </div>

            {/* Rationale explanation */}
            <p className="text-3xs text-slate-300 leading-relaxed bg-slate-950 p-2 rounded-lg border border-slate-800">
              💡 <strong>Règle SMC :</strong> {selectedOB.rationale}
            </p>

            {/* Actions */}
            <div className="pt-1 flex items-center gap-2">
              {onExecuteOrderAtBlock && (
                <button
                  onClick={() => {
                    const isDemand = selectedOB.type === 'BULLISH_DEMAND';
                    onExecuteOrderAtBlock(selectedOB.equilibrium, isDemand ? 'BUY' : 'SELL');
                    setSelectedOB(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 font-bold text-xs rounded-xl shadow-lg transition-all active:scale-95 ${
                    selectedOB.type === 'BULLISH_DEMAND'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-rose-600 hover:bg-rose-500 text-white'
                  }`}
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>
                    Placer Ordre au 50% MT ({selectedOB.equilibrium.toFixed(pair.decimals)})
                  </span>
                </button>
              )}

              <button
                onClick={() => setSelectedOB(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
