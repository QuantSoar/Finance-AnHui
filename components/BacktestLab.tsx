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
  Sparkles, Bot, FolderOpen, Loader2, CheckCircle2, FlaskConical, Layers 
} from 'lucide-react';

export const BacktestLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'strategy' | 'factor'>('strategy');
  const [dataContext, setDataContext] = useState<string | null>(null);
  const [dataName, setDataName] = useState<string>('未选择数据');
  
  // Strategy Code State
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
# 数据已自动注入 context
cerebro.run()
`);

  // UI States
  const [results, setResults] = useState<BacktestResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showAgent, setShowAgent] = useState(false);
  const [vibePrompt, setVibePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadMsg, setLoadMsg] = useState<string | null>(null);

  const handleDataLoaded = (csv: string, name: string) => {
    setDataContext(csv);
    setDataName(name);
  };

  const handleRunBacktest = async () => {
    if (!dataContext) {
      alert("请先从左侧选择并加载数据源！");
      return;
    }
    setIsRunning(true);
    setResults(null);
    try {
      const res = await runBacktestSimulation(strategyCode, dataContext);
      setResults(res);
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
      alert("AI 生成代码失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadLibraryAlgo = (algoId: string) => {
    const algo = ALGORITHMS.find(a => a.id === algoId);
    if (algo) {
      if (algo.category !== AlgorithmCategory.BACKTEST) {
        if (!window.confirm(`警告：模型 "${algo.title}" 似乎不是专为 Backtrader 回测设计的。\n\n是否仍要加载？`)) {
          return;
        }
      }
      setStrategyCode(algo.pythonCode);
      setLoadMsg(`已加载: ${algo.title}`);
      setTimeout(() => setLoadMsg(null), 3000);
    }
  };

  // Agent Interaction Wrapper
  const tempAlgoContext: FinancialAlgorithm = {
    id: 'backtest_lab_session',
    title: '当前回测策略',
    category: AlgorithmCategory.BACKTEST,
    description: 'Backtest Lab Session',
    pythonCode: strategyCode,
    visualizationType: 'area'
  };

  const handleAgentUpdate = (updates: Partial<FinancialAlgorithm>) => {
    if (updates.pythonCode) {
      setStrategyCode(updates.pythonCode);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden relative w-full">
      
      {/* Sidebar: Data Selection */}
      <div className="w-72 border-r border-zinc-800 flex flex-col bg-zinc-900/50 shrink-0">
        <div className="p-4 border-b border-zinc-800">
           <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">步骤 1：数据准备</div>
           <div className={`p-3 rounded border text-sm flex items-center gap-2 transition-all ${dataContext ? 'border-green-500/50 bg-green-900/20 text-green-200' : 'border-zinc-700 bg-zinc-900 text-zinc-400'}`}>
              <Database size={16} className={dataContext ? "text-green-500" : "text-zinc-500"} />
              <span className="truncate">{dataName}</span>
              {dataContext && <CheckCircle2 size={14} className="ml-auto text-green-500" />}
           </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <DataManager mode="select" onDataLoaded={handleDataLoaded} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
         
         {/* Top Navigation Bar */}
         <div className="h-14 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-4 shrink-0">
            <div className="flex gap-4">
               <button 
                 onClick={() => setActiveTab('strategy')}
                 className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-all ${activeTab === 'strategy' ? 'border-blue-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
               >
                 <FlaskConical size={16} /> 策略回测
               </button>
               <button 
                 onClick={() => setActiveTab('factor')}
                 className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-all ${activeTab === 'factor' ? 'border-orange-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
               >
                 <Layers size={16} /> 因子分析 (Factor Lab)
                 <span className="bg-orange-600 text-[10px] px-1.5 py-0.5 rounded text-white ml-1">NEW</span>
               </button>
            </div>

            <div className="flex items-center gap-2">
               <button
                  onClick={() => setShowAgent(!showAgent)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-all border ${
                    showAgent 
                      ? 'bg-indigo-600 text-white border-indigo-500' 
                      : 'bg-zinc-900 text-indigo-400 border-zinc-800 hover:border-indigo-500/50'
                  }`}
               >
                 <Bot size={14} />
                 {showAgent ? '关闭助手' : 'AI 助手'}
               </button>
            </div>
         </div>

         {/* Content View Switcher */}
         {activeTab === 'strategy' ? (
           <div className="flex-1 flex overflow-hidden">
              {/* Strategy Editor Column */}
              <div className="flex-1 flex flex-col border-r border-zinc-800 min-w-0">
                 {/* Toolbar */}
                 <div className="h-12 flex items-center justify-between px-4 bg-zinc-900/30 border-b border-zinc-800 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="relative group">
                        <button className="flex items-center gap-1.5 text-xs text-zinc-300 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded transition-colors border border-zinc-700">
                          <FolderOpen size={14} /> 加载策略库
                        </button>
                        <div className="absolute top-full left-0 mt-1 w-80 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl hidden group-hover:block z-50 max-h-96 overflow-y-auto">
                          <div className="p-2 text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Backtrader 经典策略</div>
                          {ALGORITHMS.filter(a => a.category === AlgorithmCategory.BACKTEST).map(algo => (
                            <button 
                              key={algo.id}
                              onClick={() => handleLoadLibraryAlgo(algo.id)}
                              className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-blue-600/20 hover:text-blue-400 truncate border-l-2 border-transparent hover:border-blue-500 transition-colors"
                            >
                              {algo.title}
                            </button>
                          ))}
                        </div>
                      </div>
                      {loadMsg && <span className="text-xs text-green-500 animate-in fade-in">{loadMsg}</span>}
                    </div>

                    <button 
                       onClick={handleRunBacktest}
                       disabled={isRunning || !dataContext}
                       className="bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded text-xs font-bold flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-green-900/20 transition-all"
                     >
                       {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                       {isRunning ? '回测计算中...' : '运行回测'}
                     </button>
                 </div>
                 
                 {/* Vibe Coding */}
                 <div className="px-4 py-2 bg-zinc-900/20 border-b border-zinc-800 flex gap-2 shrink-0">
                    <div className="relative flex-1">
                      <Sparkles className="absolute left-3 top-2 text-blue-500" size={14} />
                      <input
                        type="text"
                        value={vibePrompt}
                        onChange={(e) => setVibePrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleVibeCoding()}
                        placeholder="输入指令自动优化代码，例如：'加入20%的止损逻辑'..."
                        className="w-full bg-zinc-950 border border-zinc-700 rounded pl-9 pr-4 py-1.5 text-xs text-zinc-200 focus:border-blue-500 outline-none"
                      />
                    </div>
                 </div>

                 <textarea 
                   value={strategyCode}
                   onChange={(e) => setStrategyCode(e.target.value)}
                   className="flex-1 w-full bg-[#1e1e1e] text-zinc-300 font-mono text-sm p-4 resize-none focus:outline-none"
                   spellCheck={false}
                 />
              </div>

              {/* Results Column */}
              <div className="w-96 flex flex-col bg-zinc-900/50 border-l border-zinc-800 shrink-0">
                <div className="p-3 border-b border-zinc-800 font-bold text-zinc-200 text-sm flex items-center gap-2 bg-zinc-950">
                   <Activity size={16} className="text-orange-500" /> 回测结果面板
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                   {!results ? (
                     <div className="text-center text-zinc-600 mt-20">
                        <BarChart2 size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-sm">请点击“运行回测”查看分析报告</p>
                     </div>
                   ) : (
                     <>
                       <div className="grid grid-cols-2 gap-3">
                          <div className="bg-zinc-800/50 p-3 rounded border border-zinc-700">
                             <div className="text-[10px] text-zinc-500 uppercase">总回报</div>
                             <div className={`text-lg font-mono font-bold ${results.metrics.totalReturn.includes('-') ? 'text-red-400' : 'text-green-400'}`}>{results.metrics.totalReturn}</div>
                          </div>
                          <div className="bg-zinc-800/50 p-3 rounded border border-zinc-700">
                             <div className="text-[10px] text-zinc-500 uppercase">夏普比率</div>
                             <div className="text-lg font-mono font-bold text-blue-400">{results.metrics.sharpeRatio}</div>
                          </div>
                          <div className="bg-zinc-800/50 p-3 rounded border border-zinc-700">
                             <div className="text-[10px] text-zinc-500 uppercase">最大回撤</div>
                             <div className="text-lg font-mono font-bold text-red-400">{results.metrics.maxDrawdown}</div>
                          </div>
                          <div className="bg-zinc-800/50 p-3 rounded border border-zinc-700">
                             <div className="text-[10px] text-zinc-500 uppercase">胜率</div>
                             <div className="text-lg font-mono font-bold text-yellow-400">{results.metrics.winRate}</div>
                          </div>
                       </div>
                       <div>
                          <div className="text-xs font-bold text-zinc-400 mb-2 flex items-center gap-1"><TrendingUp size={14} /> 资金曲线</div>
                          <ChartRenderer customData={results.equityCurve} customType="area" />
                       </div>
                       <div>
                          <div className="text-xs font-bold text-zinc-400 mb-2 flex items-center gap-1"><Terminal size={14} /> 交易明细</div>
                          <div className="bg-[#1e1e1e] rounded border border-zinc-800 p-3 text-[10px] font-mono text-zinc-400 max-h-48 overflow-y-auto whitespace-pre-wrap">
                             {results.outputLog}
                          </div>
                       </div>
                     </>
                   )}
                </div>
              </div>
           </div>
         ) : (
           <FactorLab dataContext={dataContext} />
         )}

      </div>

      {/* Builder Agent Sidebar (Overlay) */}
      {showAgent && (
        <div className="absolute right-0 top-0 bottom-0 z-50 shadow-2xl animate-in slide-in-from-right-10 duration-300">
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