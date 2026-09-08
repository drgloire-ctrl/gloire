import type { ReactNode } from 'react';
import { BarChart3, Sparkles, Activity, Settings } from 'lucide-react';
import { ActiveTab } from '../types';
import { playTradeSound } from '../data/forexData';

interface Props {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  audioEnabled: boolean;
  activeSignalsCount?: number;
}

export default function Footer({
  activeTab,
  onChangeTab,
  audioEnabled,
  activeSignalsCount = 3,
}: Props) {
  const tabs: Array<{ id: ActiveTab; label: string; icon: ReactNode; badge?: number }> = [
    { id: 'chart', label: 'Graphique', icon: <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { id: 'ai', label: 'Analyse IA', icon: <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { id: 'signals', label: 'Signaux', icon: <Activity className="w-4 h-4 sm:w-5 sm:h-5" />, badge: activeSignalsCount },
    { id: 'settings', label: 'Paramètres', icon: <Settings className="w-4 h-4 sm:w-5 sm:h-5" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg">
      <div className="max-w-md sm:max-w-2xl mx-auto flex items-center justify-around py-2 px-3">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                onChangeTab(tab.id);
                if (audioEnabled) playTradeSound('beep');
              }}
              className={`relative flex flex-col items-center justify-center gap-1 py-1.5 px-3 sm:px-5 rounded-2xl transition-all ${
                isActive
                  ? 'text-emerald-700 font-black scale-105'
                  : 'text-gray-500 hover:text-gray-900 font-medium'
              }`}
            >
              <div className={`p-1 rounded-xl transition-colors ${
                isActive ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500'
              }`}>
                {tab.icon}
              </div>

              <span className="text-2xs sm:text-xs tracking-tight">
                {tab.label}
              </span>

              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute top-1 right-2 sm:right-4 w-4 h-4 flex items-center justify-center bg-emerald-600 text-white text-3xs font-black rounded-full shadow-xs">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
