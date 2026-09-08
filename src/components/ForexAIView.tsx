import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Send, ShieldCheck, TrendingUp, TrendingDown, Target, BrainCircuit, Activity, BookOpen } from 'lucide-react';
import { ForexPair, ForexSignal, AIAnalysisData } from '../types';
import { playTradeSound } from '../data/forexData';

interface Props {
  pair: ForexPair;
  timeframe: string;
  signal?: ForexSignal | null;
  audioEnabled: boolean;
  onSelectPair: (pair: ForexPair) => void;
}

export default function ForexAIView({ pair, timeframe, signal, audioEnabled }: Props) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisData | null>(null);
  const [question, setQuestion] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: `Bonjour ! Je suis votre Copilote IA Forex. Je surveille en continu la structure de marché (SMC), les flux institutionnels et les indicateurs techniques pour ${pair.name}. Comment puis-je vous aider dans votre stratégie aujourd'hui ?`
    }
  ]);

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analyze-forex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pair: pair.name,
          timeframe,
          currentPrice: pair.basePrice,
          signalType: signal ? signal.type : 'BUY',
        }),
      });
      const data = await res.json();
      if (data.analysis) {
        setAnalysis(data.analysis);
        if (audioEnabled) playTradeSound('success');
      }
    } catch (err) {
      console.error('Error fetching analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [pair.id, timeframe]);

  const handleAskQuestion = async (qText?: string) => {
    const textToSend = qText || question;
    if (!textToSend.trim() || chatLoading) return;

    const userMsg = textToSend.trim();
    setChatHistory((prev) => [...prev, { sender: 'user', text: userMsg }]);
    if (!qText) setQuestion('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/ask-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMsg,
          pair: pair.name,
          currentPrice: pair.basePrice,
        }),
      });
      const data = await res.json();
      setChatHistory((prev) => [
        ...prev,
        { sender: 'ai', text: data.answer || "Désolé, une erreur est survenue lors de l'analyse." }
      ]);
      if (audioEnabled) playTradeSound('beep');
    } catch {
      setChatHistory((prev) => [
        ...prev,
        { sender: 'ai', text: "Erreur de connexion au serveur d'analyse IA." }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const isBullish = analysis?.sentiment.toLowerCase().includes('haussier');

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 pb-24">
      
      {/* Header Banner */}
      <div className="bg-gray-900 text-white p-5 sm:p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
            <BrainCircuit className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                Analyse Intelligente IA • {pair.name}
              </h2>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">
                {timeframe}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-1">
              Smart Money Concepts (SMC), Order Flow institutionnel & confirmations algorithmiques.
            </p>
          </div>
        </div>

        <button
          onClick={fetchAnalysis}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-95 ml-auto md:ml-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Analyse en cours...' : 'Actualiser l\'Analyse'}</span>
        </button>
      </div>

      {/* Main Analysis Cards */}
      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Sentiment & Score */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Biais Algorithmique</span>
                <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md ${
                  isBullish ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {isBullish ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {analysis.sentiment}
                </span>
              </div>

              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-black font-mono text-gray-900">
                  {analysis.confidenceScore}%
                </span>
                <span className="text-xs text-gray-500 font-semibold">de probabilité historique</span>
              </div>

              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-4">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                  style={{ width: `${analysis.confidenceScore}%` }}
                />
              </div>

              <p className="text-sm text-gray-600 leading-relaxed">
                {analysis.trendSummary}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>Prix actuel: <strong className="font-mono text-gray-800">{pair.basePrice}</strong></span>
              <span>Spread: <strong className="font-mono text-gray-800">{pair.spreadPips} p</strong></span>
            </div>
          </div>

          {/* Smart Money Concepts (SMC) */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-3 text-emerald-700 font-bold text-sm">
              <Activity className="w-4 h-4" />
              <span>Smart Money Concepts (SMC)</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <span className="font-bold text-gray-700 block mb-0.5">Structure de Marché</span>
                <p className="text-gray-600">{analysis.smc.structure}</p>
              </div>

              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <span className="font-bold text-gray-700 block mb-0.5">Order Block (OB)</span>
                <p className="text-gray-600">{analysis.smc.orderBlock}</p>
              </div>

              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <span className="font-bold text-gray-700 block mb-0.5">Liquidité (Liquidity Pool)</span>
                <p className="text-gray-600">{analysis.smc.liquidity}</p>
              </div>

              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <span className="font-bold text-gray-700 block mb-0.5">Fair Value Gap (FVG)</span>
                <p className="text-gray-600">{analysis.smc.fvg}</p>
              </div>
            </div>
          </div>

          {/* Indicators & Key Levels */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-3 text-emerald-700 font-bold text-sm">
              <Target className="w-4 h-4" />
              <span>Indicateurs & Niveaux Clés</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">RSI (14):</span>
                <span className="font-bold text-gray-800">{analysis.technicalIndicators.rsi}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">MACD:</span>
                <span className="font-bold text-gray-800">{analysis.technicalIndicators.macd}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Moyennes Mobiles:</span>
                <span className="font-bold text-gray-800">{analysis.technicalIndicators.ema}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Zone de Support:</span>
                <span className="font-bold font-mono text-emerald-600">{analysis.technicalIndicators.support}</span>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="text-gray-500">Zone de Résistance:</span>
                <span className="font-bold font-mono text-rose-600">{analysis.technicalIndicators.resistance}</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900">
              <span className="font-bold block mb-1">⚠️ Catalyseur Macro & Économique:</span>
              <p>{analysis.catalysts}</p>
            </div>
          </div>

        </div>
      )}

      {/* Action Plan & Risk Advice */}
      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-gray-900 font-bold text-sm">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>Plan Stratégique d'Exécution</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {analysis.strategyPlan}
            </p>
          </div>

          <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-emerald-900 font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Règle de Gestion du Risque (Capital Protection)</span>
            </div>
            <p className="text-sm text-emerald-800 leading-relaxed font-medium">
              {analysis.keyAdvice}
            </p>
          </div>
        </div>
      )}

      {/* Interactive Copilot Chat Box */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-gray-900 text-sm sm:text-base">
              Assistant IA Forex en Direct
            </h3>
          </div>
          <span className="text-xs text-gray-500">Posez vos questions de trading</span>
        </div>

        {/* Suggested Prompts */}
        <div className="p-3 bg-gray-50/50 border-b border-gray-100 flex flex-wrap gap-2 text-xs">
          {[
            `Où placer mon Stop Loss optimal sur ${pair.name} ?`,
            `Quelle est la tendance globale en H1/H4 ?`,
            `Comment calculer mon risque sur cette paire ?`,
            `Explique-moi le Smart Money Concept.`
          ].map((promptText, i) => (
            <button
              key={i}
              onClick={() => handleAskQuestion(promptText)}
              className="px-2.5 py-1 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-gray-200 rounded-lg text-gray-600 transition-colors"
            >
              {promptText}
            </button>
          ))}
        </div>

        {/* Chat Messages */}
        <div className="p-4 max-h-80 overflow-y-auto space-y-3 text-sm">
          {chatHistory.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-emerald-600 text-white font-medium rounded-br-xs'
                    : 'bg-gray-100 text-gray-800 rounded-bl-xs'
                }`}
              >
                <div className="text-2xs font-bold opacity-70 mb-1">
                  {msg.sender === 'user' ? 'Vous' : 'Copilote IA Forex'}
                </div>
                <div className="whitespace-pre-wrap">{msg.text}</div>
              </div>
            </div>
          ))}

          {chatLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-500 rounded-2xl p-3 text-xs flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span>Le Copilote IA analyse votre demande...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAskQuestion();
            }}
            placeholder={`Posez une question technique sur ${pair.name}...`}
            className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
          <button
            onClick={() => handleAskQuestion()}
            disabled={!question.trim() || chatLoading}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl transition-colors flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
}
