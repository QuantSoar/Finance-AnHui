
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
  List, TrendingDown, LayoutDashboard, Settings2, ArrowRight
} from 'lucide-react';

export const BacktestLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'strategy' | 'factor'>('strategy');
  const [dataContext, setDataContext] = useState<string | null>(null);
  const [dataName, setDataName] = useState<string>('未选择数据');
  
  // Backtest Configuration State
  const [initialCash, setInitialCash] = useState<number>(100000);
  const [commission, setCommission] = useState<number>(0.0005);
  const [timeframe, setTimeframe] = useState<string>('daily');
  const [showConfig, setShowConfig] = useState(true);

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

  // Result Tab State
  const [resultTab, setResultTab] = useState<'overview' | 'risk' | 'trades' | 'logs'>('overview');

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
        
        {/* Step 1: Data */}
        <div className="p-4 border-b border-zinc-800">
           <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">步骤 1：数据准备</div>
           <div className={`p-3 rounded border text-sm flex items-center gap-2 transition-all ${dataContext ? 'border-green-500/50 bg-green-900/20 text-green-200' : 'border-zinc-700 bg-zinc-900 text-zinc-400'}`}>
              <Database size={16} className={dataContext ? "text-green-500" : "text-zinc-500"} />
              <span className="truncate">{dataName}</span>
              {dataContext && <CheckCircle2 size={14} className="ml-auto text-green-500" />}
           </div>
        </div>

        {/* Step 2: Configuration Panel */}
        {activeTab === 'strategy' && (
           <div className="p-4 border-b border-zinc-800">
             <div 
               className="flex items-center justify-between cursor-pointer mb-2"
               onClick={() => setShowConfig(!showConfig)}
             >
                <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                   步骤 2：回测配置
                </div>
                <Settings2 size={14} className="text-zinc-500" />
             </div>
             
             {showConfig && (
               <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                 <div>
                   <label className="text-[10px] text-zinc-400 block mb-1">初始资金 (Initial Cash)</label>
                   <input 
                     type="number" 
                     value={initialCash} 
                     onChange={(e) => setInitialCash(Number(e.target.value))}
                     className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-200 focus:border-blue-500 outline-none"
                   />
                 </div>
                 <div>
                   <label className="text-[10px] text-zinc-400 block mb-1">佣金费率 (Commission)</label>
                   <input 
                     type="number" 
                     step="0.0001"
                     value={commission} 
                     onChange={(e) => setCommission(Number(e.target.value))}
                     className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-200 focus:border-blue-500 outline-none"
                   />
                   <div className="text-[9px] text-zinc-600 mt-0.5">例如 0.0005 代表 万分之五</div>
                 </div>
                 <div>
                   <label className="text-[10px] text-zinc-400 block mb-1">数据频率 (Frequency)</label>
                   <select 
                     value={timeframe} 
                     onChange={(e) => setTimeframe(e.target.value)}
                     className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-200 focus:border-blue-500 outline-none"
                   >
                     <option value="daily">Daily (日线)</option>
                     <option value="minute">Minute (分钟)</option>
                   </select>
                 </div>
               </div>
             )}
           </div>
        )}

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
                 
                 {/* Vibe Coding Area (Modern Glow Design) */}
                 <div className="p-4 border-b border-zinc-800 shrink-0 bg-[#1e1e1e] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />
                    
                    <div className="relative rounded-xl p-[1px] bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30">
                      <div className="bg-zinc-900 rounded-[10px] p-2.5">
                        <div className="flex items-center gap-3 mb-2">
                           <div className="p-1.5 bg-blue-500/10 rounded-md text-blue-400">
                              <Sparkles size={16} />
                           </div>
                           <input
                              type="text"
                              value={vibePrompt}
                              onChange={(e) => setVibePrompt(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleVibeCoding()}
                              placeholder="AI 辅助编程：描述您的需求（例如：添加 5% 的跟踪止损逻辑）..."
                              className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-600 focus:outline-none"
                           />
                           <button 
                             onClick={handleVibeCoding}
                             disabled={isGenerating || !vibePrompt}
                             className="bg-blue-600 hover:bg-blue-500 text-white p-1.5 rounded-lg transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:shadow-none"
                           >
                              {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                           </button>
                        </div>
                        
                        {/* Suggestion Chips */}
                        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 pl-10">
                           {[
                             { label: '添加止损止盈', prompt: '添加 5% 的止损和 10% 的止盈逻辑' },
                             { label: '优化均线参数', prompt: '将均线周期参数改为可优化的范围 (10-60)' },
                             { label: '增加RSI过滤', prompt: '增加 RSI < 30 的买入过滤条件' },
                             { label: '仓位管理', prompt: '修改为凯利公式仓位管理' }
                           ].map(chip => (
                             <button
                               key={chip.label}
                               onClick={() => setVibePrompt(chip.prompt)}
                               className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors border border-zinc-700/50 hover:border-zinc-600"
                             >
                               {chip.label}
                             </button>
                           ))}
                        </div>
                      </div>
                    </div>
                 </div>

                 <textarea 
                   value={strategyCode}
                   onChange={(e) => setStrategyCode(e.target.value)}
                   className="flex-1 w-full bg-[#1e1e1e] text-zinc-300 font-mono text-sm p-4 resize-none focus:outline-none leading-relaxed"
                   spellCheck={false}
                 />
              </div>

              {/* Enhanced Results Column */}
              <div className="w-[480px] flex flex-col bg-zinc-900/50 border-l border-zinc-800 shrink-0">
                
                {/* Result Tabs */}
                <div className="flex border-b border-zinc-800 bg-zinc-950">
                  {[
                    { id: 'overview', icon: LayoutDashboard, label: '概览' },
                    { id: 'risk', icon: TrendingDown, label: '风险' },
                    { id: 'trades', icon: List, label: '交易' },
                    { id: 'logs', icon: Terminal, label: '日志' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setResultTab(tab.id as any)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium transition-colors border-b-2 ${
                        resultTab === tab.id 
                          ? 'border-blue-500 text-white bg-zinc-900' 
                          : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
                      }`}
                    >
                      <tab.icon size={14} />
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                   {!results ? (
                     <div className="text-center text-zinc-600 mt-20">
                        <BarChart2 size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-sm">请点击“运行回测”查看分析报告</p>
                     </div>
                   ) : (
                     <div className="animate-in fade-in duration-300">
                        
                        {/* TAB: OVERVIEW */}
                        {resultTab === 'overview' && (
                          <div className="space-y-6">
                            {/* Primary Metrics */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-zinc-800/50 p-3 rounded border border-zinc-700">
                                   <div className="text-[10px] text-zinc-500 uppercase">累计收益 (Total Return)</div>
                                   <div className={`text-xl font-mono font-bold ${results.metrics.totalReturn.includes('-') ? 'text-red-400' : 'text-green-400'}`}>
                                     {results.metrics.totalReturn}
                                   </div>
                                </div>
                                <div className="bg-zinc-800/50 p-3 rounded border border-zinc-700">
                                   <div className="text-[10px] text-zinc-500 uppercase">年化收益 (Annualized)</div>
                                   <div className="text-xl font-mono font-bold text-green-300">
                                     {results.metrics.annualizedReturn}
                                   </div>
                                </div>
                                <div className="bg-zinc-800/50 p-3 rounded border border-zinc-700">
                                   <div className="text-[10px] text-zinc-500 uppercase">夏普比率 (Sharpe)</div>
                                   <div className="text-lg font-mono font-bold text-blue-400">{results.metrics.sharpeRatio}</div>
                                </div>
                                <div className="bg-zinc-800/50 p-3 rounded border border-zinc-700">
                                   <div className="text-[10px] text-zinc-500 uppercase">最大回撤 (MaxDD)</div>
                                   <div className="text-lg font-mono font-bold text-red-400">{results.metrics.maxDrawdown}</div>
                                </div>
                            </div>
                            
                            {/* Equity Chart */}
                            <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800">
                               <div className="text-xs font-bold text-zinc-400 mb-2 flex items-center gap-1">
                                 <TrendingUp size={14} className="text-green-500" /> 资金曲线 (Equity Curve)
                               </div>
                               <ChartRenderer customData={results.equityCurve} customType="area" />
                            </div>

                            {/* Secondary Metrics */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-zinc-900 border border-zinc-800 p-2 rounded text-center">
                                  <div className="text-[10px] text-zinc-500">胜率</div>
                                  <div className="text-sm font-bold text-yellow-400">{results.metrics.winRate}</div>
                                </div>
                                <div className="bg-zinc-900 border border-zinc-800 p-2 rounded text-center">
                                  <div className="text-[10px] text-zinc-500">交易次数</div>
                                  <div className="text-sm font-bold text-zinc-300">{results.metrics.tradeCount}</div>
                                </div>
                                <div className="bg-zinc-900 border border-zinc-800 p-2 rounded text-center">
                                  <div className="text-[10px] text-zinc-500">波动率</div>
                                  <div className="text-sm font-bold text-zinc-300">{results.metrics.volatility}</div>
                                </div>
                            </div>
                          </div>
                        )}

                        {/* TAB: RISK */}
                        {resultTab === 'risk' && (
                          <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-zinc-800/50 p-3 rounded border border-zinc-700">
                                   <div className="text-[10px] text-zinc-500 uppercase">索提诺比率 (Sortino)</div>
                                   <div className="text-lg font-mono font-bold text-blue-300">{results.metrics.sortinoRatio}</div>
                                   <div className="text-[9px] text-zinc-600 mt-1">仅考虑下行波动风险</div>
                                </div>
                                <div className="bg-zinc-800/50 p-3 rounded border border-zinc-700">
                                   <div className="text-[10px] text-zinc-500 uppercase">Beta 系数</div>
                                   <div className="text-lg font-mono font-bold text-zinc-300">{results.metrics.beta || 'N/A'}</div>
                                   <div className="text-[9px] text-zinc-600 mt-1">相对于基准的波动敏感度</div>
                                </div>
                                <div className="bg-zinc-800/50 p-3 rounded border border-zinc-700">
                                   <div className="text-[10px] text-zinc-500 uppercase">Alpha (超额收益)</div>
                                   <div className="text-lg font-mono font-bold text-green-400">{results.metrics.alpha || 'N/A'}</div>
                                </div>
                            </div>

                            {/* Drawdown Chart */}
                            <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800">
                               <div className="text-xs font-bold text-zinc-400 mb-2 flex items-center gap-1">
                                 <TrendingDown size={14} className="text-red-500" /> 回撤曲线 (Drawdown)
                               </div>
                               <ChartRenderer customData={results.drawdownCurve} customType="area" color="#ef4444" />
                            </div>
                          </div>
                        )}

                        {/* TAB: TRADES */}
                        {resultTab === 'trades' && (
                          <div className="space-y-2">
                             <div className="flex justify-between items-center text-xs text-zinc-400 px-2 pb-2 border-b border-zinc-800">
                               <span className="w-20">日期</span>
                               <span className="w-12 text-center">方向</span>
                               <span className="w-16 text-right">价格</span>
                               <span className="w-16 text-right">盈亏</span>
                             </div>
                             <div className="space-y-1">
                               {results.tradeSignals.map((trade, idx) => (
                                 <div key={idx} className="flex justify-between items-center text-xs p-2 bg-zinc-900/50 rounded border border-zinc-800/50 hover:bg-zinc-800 transition-colors">
                                   <span className="w-20 text-zinc-500 font-mono">{trade.date}</span>
                                   <span className={`w-12 text-center font-bold px-1 rounded ${trade.type === 'buy' ? 'bg-red-900/20 text-red-400' : 'bg-green-900/20 text-green-400'}`}>
                                     {trade.type === 'buy' ? '买入' : '卖出'}
                                   </span>
                                   <span className="w-16 text-right text-zinc-300 font-mono">{trade.price.toFixed(2)}</span>
                                   <span className={`w-16 text-right font-mono ${trade.pnl && trade.pnl > 0 ? 'text-green-400' : (trade.pnl && trade.pnl < 0 ? 'text-red-400' : 'text-zinc-600')}`}>
                                     {trade.pnlPct || '-'}
                                   </span>
                                 </div>
                               ))}
                               {results.tradeSignals.length === 0 && (
                                 <div className="text-center text-zinc-600 py-8 italic">无交易记录</div>
                               )}
                             </div>
                          </div>
                        )}

                        {/* TAB: LOGS */}
                        {resultTab === 'logs' && (
                          <div className="bg-[#1e1e1e] rounded border border-zinc-800 p-3 text-[10px] font-mono text-zinc-400 max-h-[500px] overflow-y-auto whitespace-pre-wrap">
                             {results.outputLog}
                          </div>
                        )}

                     </div>
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
