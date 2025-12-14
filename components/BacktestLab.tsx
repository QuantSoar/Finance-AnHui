
import React, { useState } from 'react';
import { DataManager } from './DataManager';
import { runBacktestSimulation, generateCodeFromPrompt } from '../services/geminiService';
import { BacktestResult, FinancialAlgorithm, AlgorithmCategory } from '../types';
import { ChartRenderer } from './ChartRenderer';
import { ALGORITHMS } from '../data/algorithms';
import { BuilderAgent } from './BuilderAgent';
import { FactorLab } from './FactorLab';
import { 
  Play, TrendingUp, BarChart2, Activity, Terminal, Database, 
  Sparkles, Bot, FolderOpen, Loader2, CheckCircle2, FlaskConical, Layers,
  List, TrendingDown, LayoutDashboard, Settings2, ArrowRight, X, ChevronRight, Gauge
} from 'lucide-react';

export const BacktestLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'strategy' | 'factor'>('strategy');
  const [dataContext, setDataContext] = useState<string | null>(null);
  const [dataName, setDataName] = useState<string>('选择数据源');
  
  // Configuration
  const [initialCash, setInitialCash] = useState<number>(100000);
  const [commission, setCommission] = useState<number>(0.0005);
  const [timeframe, setTimeframe] = useState<string>('daily');
  const [showDataPanel, setShowDataPanel] = useState(false);

  // Strategy Code
  const [strategyCode, setStrategyCode] = useState<string>(`import backtrader as bt

class MyStrategy(bt.Strategy):
    params = (('maperiod', 15),)

    def __init__(self):
        self.dataclose = self.datas[0].close
        self.sma = bt.ind.SMA(period=self.params.maperiod)

    def next(self):
        if not self.position:
            if self.dataclose[0] > self.sma[0]:
                self.buy()
        elif self.dataclose[0] < self.sma[0]:
            self.close()

cerebro = bt.Cerebro()
cerebro.addstrategy(MyStrategy)
cerebro.run()
`);

  const [results, setResults] = useState<BacktestResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showAgent, setShowAgent] = useState(false);
  const [vibePrompt, setVibePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultTab, setResultTab] = useState<'overview' | 'risk' | 'trades' | 'logs'>('overview');

  const handleDataLoaded = (csv: string, name: string) => {
    setDataContext(csv);
    setDataName(name);
    setShowDataPanel(false);
  };

  const handleRunBacktest = async () => {
    if (!dataContext) {
      setShowDataPanel(true);
      return;
    }
    setIsRunning(true);
    setResults(null);
    try {
      const config = { initialCash, commission, timeframe };
      const res = await runBacktestSimulation(strategyCode, dataContext, config);
      setResults(res);
      setResultTab('overview');
    } catch (e) {
      alert("回测运行失败");
    } finally {
      setIsRunning(false);
    }
  };

  const handleVibeCoding = async () => {
    if (!vibePrompt.trim()) return;
    setIsGenerating(true);
    try {
      const newCode = await generateCodeFromPrompt(vibePrompt, strategyCode);
      setStrategyCode(newCode);
      setVibePrompt('');
    } catch (e) {
      alert("AI 生成代码失败");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAgentUpdate = (updates: Partial<FinancialAlgorithm>) => {
    if (updates.pythonCode) setStrategyCode(updates.pythonCode);
  };

  // Temp Context for Agent
  const tempAlgoContext: FinancialAlgorithm = {
    id: 'backtest_lab', title: '回测策略', category: AlgorithmCategory.BACKTEST,
    description: 'Lab Session', pythonCode: strategyCode, visualizationType: 'area'
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 relative w-full overflow-hidden">
      
      {/* 1. TOP HEADER */}
      <div className="h-16 border-b border-white/5 bg-zinc-900/50 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-20">
         <div className="flex items-center gap-6">
            <div className="flex p-1 bg-zinc-800/50 rounded-lg border border-white/5">
               <button 
                 onClick={() => setActiveTab('strategy')}
                 className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'strategy' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
               >
                 <FlaskConical size={14} className={activeTab === 'strategy' ? 'text-blue-400' : ''} /> 策略回测
               </button>
               <button 
                 onClick={() => setActiveTab('factor')}
                 className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'factor' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
               >
                 <Layers size={14} className={activeTab === 'factor' ? 'text-orange-400' : ''} /> 因子分析
               </button>
            </div>

            {/* Config Quick View */}
            {activeTab === 'strategy' && (
              <div className="flex items-center gap-3 text-xs text-zinc-400">
                 <div className="h-4 w-px bg-zinc-800" />
                 <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-white/5 hover:border-zinc-700 transition-colors cursor-pointer" onClick={() => setShowDataPanel(true)}>
                    <Database size={12} className={dataContext ? "text-green-500" : ""} />
                    <span className="max-w-[150px] truncate font-medium">{dataName}</span>
                 </div>
                 <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-white/5 font-mono">
                    <span className="text-zinc-600">$</span> {initialCash.toLocaleString()}
                 </div>
              </div>
            )}
         </div>

         <div className="flex items-center gap-3">
             {activeTab === 'strategy' && (
               <>
                 <button 
                   onClick={() => setShowAgent(!showAgent)}
                   className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                     showAgent ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-zinc-200'
                   }`}
                 >
                   <Bot size={14} /> 助手
                 </button>
                 <button 
                   onClick={handleRunBacktest}
                   disabled={isRunning}
                   className="bg-green-600 hover:bg-green-500 text-white px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-green-900/20 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                 >
                   {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
                   {isRunning ? '模拟计算中...' : '运行回测'}
                 </button>
               </>
             )}
         </div>
      </div>

      {/* 2. MAIN CONTENT */}
      <div className="flex-1 flex overflow-hidden relative">
         
         {/* DATA PANEL SLIDEOUT */}
         {showDataPanel && (
           <div className="absolute left-0 top-0 bottom-0 w-80 bg-zinc-900/95 backdrop-blur-xl border-r border-white/10 z-30 shadow-2xl animate-in slide-in-from-left-10 duration-200 flex flex-col">
              <div className="p-4 border-b border-white/5 flex justify-between items-center">
                 <h3 className="font-bold text-zinc-100 flex items-center gap-2"><Database size={16} className="text-blue-500"/> 数据源选择</h3>
                 <button onClick={() => setShowDataPanel(false)}><X size={16} className="text-zinc-500 hover:text-white"/></button>
              </div>
              <div className="flex-1 overflow-hidden">
                 <DataManager mode="select" onDataLoaded={handleDataLoaded} />
              </div>
           </div>
         )}

         {activeTab === 'strategy' ? (
           <div className="flex-1 flex w-full">
              {/* LEFT: EDITOR & VIBE CODING */}
              <div className="flex-1 flex flex-col min-w-0 border-r border-white/5">
                 {/* Vibe Coding Bar */}
                 <div className="p-4 bg-zinc-900/30 border-b border-white/5 shrink-0">
                    <div className="relative rounded-xl p-[1px] bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20">
                      <div className="bg-zinc-950/80 rounded-[10px] flex items-center p-1.5 gap-2 backdrop-blur-sm">
                         <div className="p-2 bg-zinc-900 rounded-lg text-blue-400"><Sparkles size={16} /></div>
                         <input
                            type="text"
                            value={vibePrompt}
                            onChange={(e) => setVibePrompt(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleVibeCoding()}
                            placeholder="描述回测逻辑，例如：'当 RSI < 30 买入，> 70 卖出'..."
                            className="flex-1 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none px-2"
                         />
                         <button 
                           onClick={handleVibeCoding}
                           disabled={isGenerating || !vibePrompt}
                           className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:bg-zinc-800 transition-colors"
                         >
                            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                         </button>
                      </div>
                    </div>
                 </div>

                 {/* Code Editor */}
                 <textarea 
                   value={strategyCode}
                   onChange={(e) => setStrategyCode(e.target.value)}
                   className="flex-1 w-full bg-[#0d0d0f] text-zinc-300 font-mono text-sm p-6 resize-none focus:outline-none leading-relaxed selection:bg-blue-500/30"
                   spellCheck={false}
                 />
              </div>

              {/* RIGHT: RESULTS DASHBOARD */}
              <div className="w-[500px] flex flex-col bg-zinc-900/40 backdrop-blur-sm shrink-0">
                 {/* Result Tabs */}
                 <div className="flex border-b border-white/5 bg-zinc-900/60">
                    {[
                      { id: 'overview', icon: Gauge, label: '概览' },
                      { id: 'risk', icon: TrendingDown, label: '风险分析' },
                      { id: 'trades', icon: List, label: '交易明细' },
                      { id: 'logs', icon: Terminal, label: '日志' },
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setResultTab(tab.id as any)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium transition-all relative ${
                          resultTab === tab.id 
                            ? 'text-white' 
                            : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30'
                        }`}
                      >
                        <tab.icon size={14} className={resultTab === tab.id ? 'text-blue-400' : ''} />
                        {tab.label}
                        {resultTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_-2px_6px_rgba(59,130,246,0.5)]" />}
                      </button>
                    ))}
                 </div>

                 <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {!results ? (
                      <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-4">
                         <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                            <BarChart2 size={32} className="opacity-20" />
                         </div>
                         <p className="text-sm">配置策略并点击运行以生成报告</p>
                      </div>
                    ) : (
                      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                         
                         {resultTab === 'overview' && (
                           <>
                             {/* Metric Cards */}
                             <div className="grid grid-cols-2 gap-3">
                                <MetricCard label="总收益率" value={results.metrics.totalReturn} trend={!results.metrics.totalReturn.includes('-')} highlight />
                                <MetricCard label="年化收益" value={results.metrics.annualizedReturn} />
                                <MetricCard label="夏普比率" value={results.metrics.sharpeRatio} />
                                <MetricCard label="最大回撤" value={results.metrics.maxDrawdown} trend={false} />
                             </div>
                             
                             {/* Main Chart */}
                             <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 shadow-sm">
                                <div className="text-xs font-bold text-zinc-400 mb-4 flex items-center gap-2">
                                  <TrendingUp size={14} className="text-green-500" /> 账户净值曲线
                                </div>
                                <div className="h-48">
                                  <ChartRenderer customData={results.equityCurve} customType="area" />
                                </div>
                             </div>

                             <div className="grid grid-cols-3 gap-3">
                                <MiniMetric label="胜率" value={results.metrics.winRate} color="text-yellow-400" />
                                <MiniMetric label="交易次数" value={results.metrics.tradeCount} />
                                <MiniMetric label="Alpha" value={results.metrics.alpha} />
                             </div>
                           </>
                         )}

                         {resultTab === 'risk' && (
                            <>
                              <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4">
                                <div className="text-xs font-bold text-zinc-400 mb-4 flex items-center gap-2">
                                  <TrendingDown size={14} className="text-red-500" /> 动态回撤分析
                                </div>
                                <div className="h-40">
                                  <ChartRenderer customData={results.drawdownCurve} customType="area" color="#ef4444" />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <MetricCard label="波动率" value={results.metrics.volatility} />
                                <MetricCard label="索提诺比率" value={results.metrics.sortinoRatio} />
                              </div>
                            </>
                         )}
                         
                         {resultTab === 'trades' && (
                           <div className="bg-zinc-900/30 border border-white/5 rounded-xl overflow-hidden">
                              <div className="grid grid-cols-4 px-4 py-3 bg-zinc-900/50 border-b border-white/5 text-[10px] font-bold text-zinc-500 uppercase">
                                 <span>日期</span>
                                 <span className="text-center">方向</span>
                                 <span className="text-right">成交价</span>
                                 <span className="text-right">盈亏</span>
                              </div>
                              <div className="divide-y divide-white/5">
                                 {results.tradeSignals.map((t, i) => (
                                   <div key={i} className="grid grid-cols-4 px-4 py-2.5 text-xs hover:bg-white/5 transition-colors">
                                      <span className="text-zinc-400 font-mono">{t.date}</span>
                                      <div className="text-center">
                                         <span className={`px-1.5 py-0.5 rounded-[3px] text-[10px] font-bold ${t.type === 'buy' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                                            {t.type === 'buy' ? 'BUY' : 'SELL'}
                                         </span>
                                      </div>
                                      <span className="text-right text-zinc-300 font-mono">{t.price.toFixed(2)}</span>
                                      <span className={`text-right font-mono font-medium ${t.pnl && t.pnl > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                         {t.pnlPct || '-'}
                                      </span>
                                   </div>
                                 ))}
                              </div>
                           </div>
                         )}

                         {resultTab === 'logs' && (
                           <div className="bg-[#0d0d0f] border border-white/10 rounded-xl p-4 font-mono text-[10px] text-zinc-400 h-[500px] overflow-y-auto whitespace-pre-wrap leading-relaxed selection:bg-white/20">
                             {results.outputLog}
                           </div>
                         )}
                      </div>
                    )}
                 </div>
              </div>
           </div>
         ) : (
           <div className="flex-1 w-full overflow-hidden">
             <FactorLab dataContext={dataContext} />
           </div>
         )}
      </div>

      {/* Builder Agent Overlay */}
      {showAgent && (
        <div className="absolute right-0 top-16 bottom-0 z-40 animate-in slide-in-from-right-10 duration-300 shadow-2xl">
          <BuilderAgent 
            currentAlgo={tempAlgoContext} 
            onUpdate={handleAgentUpdate} 
            onClose={() => setShowAgent(false)}
          />
        </div>
      )}
    </div>
  );
};

// --- Sub Components ---

const MetricCard = ({ label, value, trend, highlight }: { label: string, value: any, trend?: boolean, highlight?: boolean }) => (
  <div className={`p-4 rounded-xl border flex flex-col justify-between h-24 transition-all ${highlight ? 'bg-zinc-800/80 border-white/10 shadow-lg' : 'bg-zinc-900/40 border-white/5 hover:bg-zinc-900/60'}`}>
     <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{label}</span>
     <div className="flex items-end justify-between">
        <span className={`text-2xl font-mono font-bold tracking-tight ${trend === true ? 'text-red-400' : (trend === false ? 'text-green-400' : 'text-zinc-200')}`}>
           {value || '--'}
        </span>
        {trend !== undefined && (
          <div className={`mb-1 p-0.5 rounded-full ${trend ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
             {trend ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          </div>
        )}
     </div>
  </div>
);

const MiniMetric = ({ label, value, color = "text-zinc-200" }: { label: string, value: any, color?: string }) => (
  <div className="bg-zinc-900/40 border border-white/5 p-3 rounded-lg text-center">
    <div className="text-[9px] text-zinc-500 uppercase mb-1">{label}</div>
    <div className={`text-sm font-bold font-mono ${color}`}>{value || '--'}</div>
  </div>
);
