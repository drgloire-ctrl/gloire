/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ActiveTab, ForexPair, ForexSignal, TradingSettings } from './types';
import { FOREX_PAIRS, INITIAL_SIGNALS, DEFAULT_SETTINGS, playTradeSound } from './data/forexData';
import TopBar from './components/TopBar';
import ForexChart from './components/ForexChart';
import ForexAIView from './components/ForexAIView';
import SignalsListView from './components/SignalsListView';
import SettingsView from './components/SettingsView';
import Footer from './components/Footer';
import RiskCalculatorModal from './components/RiskCalculatorModal';

export default function App() {
  const [selectedPair, setSelectedPair] = useState<ForexPair>(FOREX_PAIRS[0]);
  const [timeframe, setTimeframe] = useState<string>('M15');
  const [activeTab, setActiveTab] = useState<ActiveTab>('chart');
  const [settings, setSettings] = useState<TradingSettings>(DEFAULT_SETTINGS);
  const [signals] = useState<ForexSignal[]>(INITIAL_SIGNALS);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState<boolean>(false);

  // Find the active signal for the currently selected pair, if any
  const currentPairSignal = signals.find((s) => s.pairId === selectedPair.id) || null;

  const handleSelectPairAndGoToChart = (pair: ForexPair) => {
    setSelectedPair(pair);
    setActiveTab('chart');
    if (settings.audioAlerts) playTradeSound('beep');
  };

  const activeSignalsCount = signals.filter((s) => s.status === 'ACTIVE' || s.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col selection:bg-emerald-500 selection:text-white">
      
      {/* Top Navigation & Live Ticker */}
      <TopBar
        selectedPair={selectedPair}
        onSelectPair={setSelectedPair}
        timeframe={timeframe}
        onChangeTimeframe={setTimeframe}
        audioEnabled={settings.audioAlerts}
        onToggleAudio={() =>
          setSettings((prev) => ({ ...prev, audioAlerts: !prev.audioAlerts }))
        }
        onOpenCalculator={() => setIsCalculatorOpen(true)}
        onGoToAI={() => setActiveTab('ai')}
      />

      {/* Main Content by Tab */}
      <main className="flex-1 relative">
        {activeTab === 'chart' && (
          <div className="relative w-full h-full">
            {/* TradingView & Native Live Chart with integrated High-Visibility Signal Overlay */}
            <ForexChart
              selectedPair={selectedPair}
              timeframe={timeframe}
              activeSignal={currentPairSignal}
              chartTheme={settings.chartTheme}
              onSelectPair={setSelectedPair}
              audioEnabled={settings.audioAlerts}
              onOpenCalculator={() => setIsCalculatorOpen(true)}
              onGoToAI={() => setActiveTab('ai')}
            />
          </div>
        )}

        {activeTab === 'ai' && (
          <ForexAIView
            pair={selectedPair}
            timeframe={timeframe}
            signal={currentPairSignal}
            audioEnabled={settings.audioAlerts}
            onSelectPair={setSelectedPair}
          />
        )}

        {activeTab === 'signals' && (
          <SignalsListView
            signals={signals}
            onSelectPairAndGoToChart={handleSelectPairAndGoToChart}
            audioEnabled={settings.audioAlerts}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={setSettings}
          />
        )}
      </main>

      {/* Position Sizing & Risk Modal */}
      <RiskCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        pair={selectedPair}
        signal={currentPairSignal}
        settings={settings}
      />

      {/* Fixed Bottom Navigation */}
      <Footer
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        audioEnabled={settings.audioAlerts}
        activeSignalsCount={activeSignalsCount}
      />

    </div>
  );
}
