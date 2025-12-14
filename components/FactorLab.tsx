
import React, { useState } from 'react';
import { Layers, BarChart, TrendingUp, Filter, Info, Play, Loader2, AlertTriangle, PenTool, Sparkles, Wand2, Hexagon, Plus, Code, ArrowUpRight, Zap } from 'lucide-react';
import { ChartRenderer } from './ChartRenderer';
import { runFactorAnalysis, generateFactorExpression } from '../services/geminiService';
import { FactorAnalysisResult } from '../types';

interface FactorLabProps {
  dataContext: string | null;
}

export const FactorLab: React.FC<FactorLabProps> = ({ dataContext }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mode, setMode] = useState<'preset' | 'custom'>('preset');
  const [selectedFactor, setSelectedFactor] = useState('pe_ratio');
  const [customFormula, setCustomFormula] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [results, setResults] = useState<FactorAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const factors = [
    { id: 'pe_ratio', name: '市盈率 (P/E)', category: 'Value', desc: '价值因子核心，寻找低估值。' },
    { id: 'pb_ratio', name: '市净率 (P/B)', category: 'Value', desc: '股价/每股净资产。' },
    { id: 'momentum_1m', name: '1月动量', category: 'Momentum', desc: '短期价格爆发力。' },
    { id: 'momentum_12m', name: '1年动量', category: 'Momentum', desc: '长期趋势跟踪。' },
    { id: 'rsi_14', name: 'RSI (14)', category: 'Technical', desc: '相对强弱指标。' },
    { id: 'volatility_30d', name: '30日波动率', category: 'Volatility', desc: '低波策略核心。' },
    { id: 'turnover_rate', name: '换手率', category: 'Liquidity', desc: '股票活跃度。' },
    { id: 'roe', name: 'ROE', category: 'Quality', desc: '净资产收益率。' },
    { id: 'mf_value_mom', name: '价值+动量', category: 'Multi-Factor', desc: 'Value + Momentum 合成。' },
    { id: 'mf_magic_formula', name: '神奇公式', category: 'Multi-Factor', desc: 'ROC + Earnings Yield。' },
  ];

  const handleRunAnalysis = async () => {
    if (!dataContext) { setErrorMsg("请先在回测界面加载数据。"); return; }
    const factorDef = mode === 'preset' ? selectedFactor : customFormula;
    if (mode === 'custom' && !factorDef.trim()) { setErrorMsg("请输入公式。"); return; }
    setErrorMsg(null); setIsAnalyzing(true); setResults(null);
    try {
      const res = await runFactorAnalysis(dataContext, factorDef);
      setResults(res);
    } catch (e) { setErrorMsg("分析失败，请检查公式。"); } finally { setIsAnalyzing(false); }
  };

  const handleAiBuild = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiGenerating(true);
    try {
      const expression = await generateFactorExpression(aiPrompt);
      setCustomFormula(expression);
    } catch (e) { setErrorMsg("AI 生成失败"); } finally { setIsAiGenerating(false); }
  };

  return (
    <div className="flex h-full bg-zinc-950">
      {/* LEFT: Configuration */}
      <div className="w-[400px] border-r border-white/5 flex flex-col bg-zinc-900/30">
         <div className="p-6 border-b border-white/5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
              <Layers className="text-orange-400" size={20} /> 因子实验室
            </h2>
            <p className="text-xs text-zinc-500 mb-6 leading-relaxed">基于 Alphalens 框架的单因子及多因子有效性检验平台。</p>
            
            <div className="grid grid-cols-2 gap-1 bg-zinc-900 p-1 rounded-lg border border-white/5">
               <button onClick={() => setMode('preset')} className={`text-xs py-2 rounded-md font-medium transition-all ${mode === 'preset' ? 'bg-orange-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>
                 预置库
               </button>
               <button onClick={() => setMode('custom')} className={`text-xs py-2 rounded-md font-medium transition-all ${mode === 'custom' ? 'bg-orange-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>
                 自定义构建
               </button>
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {mode === 'preset' ? (
              <div className="grid grid-cols-2 gap-3">
                 {factors.map(f => (
                   <button 
                     key={f.id}
                     onClick={() => setSelectedFactor(f.id)}
                     className={`text-left p-3 rounded-xl border transition-all hover:scale-[1.02] ${selectedFactor === f.id ? 'bg-gradient-to-br from-orange-600/20 to-orange-900/10 border-orange-500/50 shadow-inner' : 'bg-zinc-900/50 border-white/5 hover:border-white/10'}`}
                   >
                      <div className="flex justify-between items-start mb-2">
                         <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${f.category === 'Multi-Factor' ? 'bg-purple-500/10 text-purple-400' : 'bg-zinc-800 text-zinc-500'}`}>{f.category}</span>
                         {selectedFactor === f.id && <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"/>}
                      </div>
                      <div className="font-bold text-xs text-zinc-200 mb-1">{f.name}</div>
                      <div className="text-[10px] text-zinc-500 leading-tight">{f.desc}</div>
                   </button>
                 ))}
              </div>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-left-4">
                 <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                      <Sparkles size={12} /> AI 辅助公式生成
                    </div>
                    <div className="relative group">
                       <textarea 
                         value={aiPrompt}
                         onChange={(e) => setAiPrompt(e.target.value)}
                         placeholder="描述因子逻辑..."
                         className="w-full bg-zinc-900/50 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500/50 focus:bg-zinc-900 transition-all resize-none h-20"
                       />
                       <button onClick={handleAiBuild} disabled={isAiGenerating || !aiPrompt} className="absolute bottom-2 right-2 p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50">
                         {isAiGenerating ? <Loader2 size={12} className="animate-spin"/> : <ArrowUpRight size={12}/>}
                       </button>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
                      <PenTool size={12} /> Python 表达式
                    </div>
                    <textarea 
                      value={customFormula}
                      onChange={(e) => setCustomFormula(e.target.value)}
                      className="w-full bg-[#0d0d0f] border border-white/10 rounded-xl p-3 font-mono text-xs text-orange-200 focus:outline-none focus:border-orange-500/50 h-32 leading-relaxed"
                    />
                 </div>
              </div>
            )}
            
            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle size={14} /> {errorMsg}
              </div>
            )}

            <button
               onClick={handleRunAnalysis}
               disabled={isAnalyzing}
               className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-900/20 transition-all active:scale-95 disabled:opacity-50"
            >
               {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
               {isAnalyzing ? '因子检验中...' : '开始分析'}
            </button>
         </div>
      </div>

      {/* RIGHT: Results */}
      <div className="flex-1 bg-zinc-950/50 flex flex-col overflow-hidden">
         {!results ? (
           <div className="flex-1 flex flex-col items-center justify-center text-zinc-600">
              <div className="w-20 h-20 rounded-full bg-zinc-900/50 flex items-center justify-center mb-6 border border-white/5">
                <Filter size={32} className="opacity-30" />
              </div>
              <p className="text-sm">配置因子参数并运行检验</p>
           </div>
         ) : (
           <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="grid grid-cols-4 gap-4">
                 <MetricBox label="IC Mean" value={results.icMean} color="text-orange-400" />
                 <MetricBox label="IC Std" value={results.icStd} />
                 <MetricBox label="IR" value={results.ir} color="text-blue-400" />
                 <MetricBox label="Turnover" value={results.turnover} />
              </div>

              <div className="grid grid-cols-2 gap-6 h-80">
                 <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5 flex flex-col">
                    <h3 className="text-xs font-bold text-zinc-400 mb-4 flex items-center gap-2 uppercase tracking-wider">
                      <BarChart size={14} /> 分层收益 (Quantiles)
                    </h3>
                    <div className="flex-1">
                      <ChartRenderer customData={results.quantiles} customType="bar" />
                    </div>
                 </div>
                 <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5 flex flex-col">
                    <h3 className="text-xs font-bold text-zinc-400 mb-4 flex items-center gap-2 uppercase tracking-wider">
                      <TrendingUp size={14} /> 累计 IC 序列
                    </h3>
                    <div className="flex-1">
                      <ChartRenderer customData={results.icSeries} customType="line" />
                    </div>
                 </div>
              </div>
           </div>
         )}
      </div>
    </div>
  );
};

const MetricBox = ({ label, value, color = "text-zinc-200" }: { label: string, value: string, color?: string }) => (
  <div className="bg-zinc-900/50 border border-white/5 p-5 rounded-2xl">
     <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">{label}</div>
     <div className={`text-2xl font-mono font-bold tracking-tight ${color}`}>{value}</div>
  </div>
);
