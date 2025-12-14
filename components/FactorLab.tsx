
import React, { useState } from 'react';
import { Layers, BarChart, TrendingUp, Filter, Info, Play, Loader2, AlertTriangle, PenTool, Sparkles, Wand2, Hexagon, Plus, Code } from 'lucide-react';
import { ChartRenderer } from './ChartRenderer';
import { runFactorAnalysis, generateFactorExpression } from '../services/geminiService';
import { FactorAnalysisResult } from '../types';

interface FactorLabProps {
  dataContext: string | null;
}

export const FactorLab: React.FC<FactorLabProps> = ({ dataContext }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mode, setMode] = useState<'preset' | 'custom'>('preset');
  
  // Preset Mode State
  const [selectedFactor, setSelectedFactor] = useState('pe_ratio');
  
  // Custom Mode State
  const [customFormula, setCustomFormula] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const [results, setResults] = useState<FactorAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const factors = [
    // --- 1. Value (估值) ---
    { id: 'pe_ratio', name: '市盈率 (P/E Ratio)', category: 'Value', desc: '价值因子核心。股价除以每股收益，寻找低估值股票。' },
    { id: 'pb_ratio', name: '市净率 (P/B Ratio)', category: 'Value', desc: '股价除以每股净资产。适用于重资产行业估值分析。' },
    { id: 'dividend_yield', name: '股息率 (Dividend Yield)', category: 'Value', desc: '过去12个月派息总额/当前股价。红利策略核心因子。' },
    { id: 'peg_ratio', name: 'PEG 指标', category: 'Value', desc: '市盈率相对盈利增长比率。平衡估值与成长性。' },

    // --- 2. Momentum (动量) ---
    { id: 'momentum_1m', name: '短期动量 (1 Month)', category: 'Momentum', desc: '过去20个交易日的收益率。反映短期价格爆发力。' },
    { id: 'momentum_12m', name: '长期动量 (12 Month)', category: 'Momentum', desc: '过去250个交易日的收益率（剔除最近1个月）。经典学术动量因子。' },
    { id: 'rsi_14', name: 'RSI (14 Days)', category: 'Technical', desc: '相对强弱指标。衡量买卖盘力量对比，寻找超买超卖。' },
    { id: 'macd_hist', name: 'MACD Histogram', category: 'Technical', desc: 'MACD 柱状图值。反映趋势强度的变化率。' },

    // --- 3. Volatility (波动率) ---
    { id: 'volatility_30d', name: '波动率 (30D Vol)', category: 'Volatility', desc: '过去30天日收益率的标准差。低波策略(Low Vol)偏好低值。' },
    { id: 'atr_14', name: 'ATR 真实波幅', category: 'Volatility', desc: '平均真实波幅。衡量市场绝对波动幅度，常用于止损计算。' },
    { id: 'beta_60d', name: 'Beta 系数', category: 'Volatility', desc: '相对于大盘指数的敏感度。高Beta在牛市进攻性强，低Beta抗跌。' },

    // --- 4. Liquidity (流动性) ---
    { id: 'turnover_rate', name: '换手率 (Turnover)', category: 'Liquidity', desc: '成交量/流通股本。反映股票的活跃程度和人气。' },
    { id: 'amihud_illiquidity', name: 'Amihud 非流动性', category: 'Liquidity', desc: '收益率绝对值/成交额。衡量价格变动单位成交额的冲击成本。' },
    { id: 'volume_ratio', name: '量比', category: 'Liquidity', desc: '当日成交量与过去5日平均成交量的比值。' },

    // --- 5. Quality (质量) ---
    { id: 'roe', name: 'ROE (净资产收益率)', category: 'Quality', desc: '巴菲特最看重的指标。衡量公司运用自有资本的效率。' },
    { id: 'gross_margin', name: '毛利率', category: 'Quality', desc: '销售收入扣除成本后的利润率。反映产品护城河和定价权。' },
    { id: 'debt_to_equity', name: '产权比率', category: 'Quality', desc: '负债总额/所有者权益。衡量财务杠杆风险。' },

    // --- 6. Growth (成长) ---
    { id: 'eps_growth', name: 'EPS 增长率', category: 'Growth', desc: '每股收益的同比增长率。成长股核心筛选指标。' },
    { id: 'revenue_growth', name: '营收增长率', category: 'Growth', desc: '主营业务收入的同比增长率。' },

    // --- 7. Multi-Factor (多因子) ---
    { id: 'mf_value_mom', name: '价值+动量 (Value+Mom)', category: 'Multi-Factor', desc: '双引擎策略：低估值(PE倒数) + 高动量(6M收益) 的标准化合成。' },
    { id: 'mf_quality_lowvol', name: '质量+低波 (Qual+LowVol)', category: 'Multi-Factor', desc: '防御性策略：高ROE + 低波动率。适合震荡下跌市。' },
    { id: 'mf_magic_formula', name: '神奇公式 (Magic Formula)', category: 'Multi-Factor', desc: '格林布拉特策略：高资本回报率(ROC) + 高盈利率(EBIT/EV)。' },
  ];

  const quickSnippets = [
    { label: "Close", code: "df['close']" },
    { label: "Open", code: "df['open']" },
    { label: "Volume", code: "df['volume']" },
    { label: "PE Ratio", code: "df['pe_ratio']" },
    { label: "Rank()", code: ".rank(pct=True)" },
    { label: "ZScore()", code: "(x - x.mean()) / x.std()" },
    { label: "MA(20)", code: "df['close'].rolling(20).mean()" },
    { label: "PctChange", code: "df['close'].pct_change()" },
  ];

  const handleInsertSnippet = (code: string) => {
    setCustomFormula(prev => prev + code);
  };

  const handleRunAnalysis = async () => {
    if (!dataContext) {
      setErrorMsg("请先在左侧数据中心加载股票数据。");
      return;
    }
    
    const factorDef = mode === 'preset' ? selectedFactor : customFormula;
    if (mode === 'custom' && !factorDef.trim()) {
       setErrorMsg("请输入因子计算公式。");
       return;
    }

    setErrorMsg(null);
    setIsAnalyzing(true);
    setResults(null);
    
    try {
      const res = await runFactorAnalysis(dataContext, factorDef);
      setResults(res);
    } catch (e) {
      setErrorMsg("因子分析失败，请检查公式或数据源。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAiBuild = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiGenerating(true);
    try {
      const expression = await generateFactorExpression(aiPrompt);
      setCustomFormula(expression);
    } catch (e) {
      setErrorMsg("AI 生成失败，请重试");
    } finally {
      setIsAiGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-zinc-950">
      {/* Configuration Panel */}
      <div className="w-80 border-r border-zinc-800 bg-zinc-900/30 flex flex-col overflow-hidden shrink-0">
         <div className="p-6 pb-2">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Layers className="text-orange-500" /> 因子实验室
            </h2>
            <p className="text-xs text-zinc-500 mb-4">
              构建并检验因子的有效性 (Alphalens Framework)。支持单因子及多因子合成分析。
            </p>
            
            <div className="flex bg-zinc-900 rounded p-1 border border-zinc-800 mb-2">
               <button 
                 onClick={() => setMode('preset')}
                 className={`flex-1 text-xs py-1.5 rounded transition-all font-medium ${mode === 'preset' ? 'bg-orange-600 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
               >
                 预置因子库
               </button>
               <button 
                 onClick={() => setMode('custom')}
                 className={`flex-1 text-xs py-1.5 rounded transition-all font-medium ${mode === 'custom' ? 'bg-orange-600 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
               >
                 因子构建
               </button>
            </div>
         </div>

         <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
            {mode === 'preset' ? (
              <div>
                 <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block">选择因子</label>
                 <div className="space-y-2">
                   {factors.map(f => (
                     <div 
                       key={f.id}
                       onClick={() => setSelectedFactor(f.id)}
                       className={`p-3 rounded border cursor-pointer transition-all ${selectedFactor === f.id ? 'bg-orange-600/20 border-orange-500 text-orange-200' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}
                     >
                       <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-sm">{f.name}</span>
                          <span className={`text-[10px] px-1.5 rounded ${f.category === 'Multi-Factor' ? 'bg-purple-500/20 text-purple-300' : 'bg-zinc-800 text-zinc-500'}`}>{f.category}</span>
                       </div>
                       <div className="text-[10px] opacity-70">{f.desc}</div>
                     </div>
                   ))}
                 </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                 <div>
                    <label className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Sparkles size={12} /> AI 辅助构建 (多因子)
                    </label>
                    <div className="bg-zinc-900 border border-zinc-800 rounded p-3 space-y-2">
                       <textarea 
                         value={aiPrompt}
                         onChange={(e) => setAiPrompt(e.target.value)}
                         placeholder="描述逻辑，例如：'合成 0.7*动量 和 0.3*低波因子' 或 '计算(收盘价-开盘价)/开盘价'..."
                         className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 min-h-[60px] resize-none"
                       />
                       <button 
                         onClick={handleAiBuild}
                         disabled={isAiGenerating || !aiPrompt}
                         className="w-full bg-blue-600 hover:bg-blue-500 text-white py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-50"
                       >
                         {isAiGenerating ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                         生成公式
                       </button>
                    </div>
                 </div>

                 <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block flex items-center gap-1">
                      <PenTool size={12} /> 因子公式 (Python/Pandas)
                    </label>
                    
                    {/* Quick Insert Snippets */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {quickSnippets.map(s => (
                        <button
                          key={s.label}
                          onClick={() => handleInsertSnippet(s.code)}
                          className="text-[10px] bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 px-2 py-1 rounded transition-colors flex items-center gap-1"
                          title={`插入: ${s.code}`}
                        >
                          <Plus size={8} /> {s.label}
                        </button>
                      ))}
                    </div>

                    <textarea 
                      value={customFormula}
                      onChange={(e) => setCustomFormula(e.target.value)}
                      placeholder="e.g. 0.5 * df['pe_ratio'].rank(pct=True) + 0.5 * df['momentum'].rank(pct=True)"
                      className="w-full bg-[#1e1e1e] border border-zinc-700 rounded p-3 text-sm font-mono text-zinc-300 focus:outline-none focus:border-orange-500 min-h-[120px] leading-relaxed"
                      spellCheck={false}
                    />
                    <div className="text-[10px] text-zinc-500 mt-2 p-2 bg-zinc-900/50 rounded border border-zinc-800/50">
                      <div className="flex items-start gap-1.5">
                         <Info size={12} className="shrink-0 mt-0.5" />
                         <div className="space-y-1">
                           <p>派生因子构建说明：</p>
                           <ul className="list-disc pl-3 space-y-0.5">
                             <li>变量 <code className="text-orange-400">df</code> 代表当前加载的数据框</li>
                             <li>支持 NumPy (np) 和 Pandas 数学运算</li>
                             <li>多因子合成建议使用 <code className="text-blue-400">rank(pct=True)</code> 标准化</li>
                           </ul>
                         </div>
                      </div>
                    </div>
                 </div>
              </div>
            )}

            <div>
               <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block">分析设置</label>
               <div className="bg-zinc-900 border border-zinc-800 rounded p-3 space-y-3">
                  <div className="flex justify-between items-center text-sm text-zinc-300">
                     <span>分层数量 (Quantiles)</span>
                     <span className="font-mono">5</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-zinc-300">
                     <span>调仓周期</span>
                     <span className="font-mono">20 Days</span>
                  </div>
               </div>
            </div>

            <button
               onClick={handleRunAnalysis}
               disabled={isAnalyzing}
               className="w-full bg-orange-600 hover:bg-orange-500 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-900/20 transition-all disabled:opacity-50"
            >
               {isAnalyzing ? <Loader2 className="animate-spin" /> : <Play size={18} />}
               {isAnalyzing ? '运行因子分析' : '开始分析'}
            </button>
            
            {errorMsg && (
              <div className="bg-red-900/20 border border-red-800 p-3 rounded text-xs text-red-300 flex items-start gap-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                {errorMsg}
              </div>
            )}
         </div>
      </div>

      {/* Results View */}
      <div className="flex-1 bg-zinc-950 p-8 overflow-y-auto">
         {!results ? (
           <div className="h-full flex flex-col items-center justify-center text-zinc-600">
              <Filter size={64} className="mb-6 opacity-20" />
              <h3 className="text-xl font-medium text-zinc-400">准备进行因子检验</h3>
              <p className="max-w-md text-center mt-2 text-zinc-500">
                {mode === 'custom' 
                  ? '请在左侧构建您的自定义因子公式，支持算术运算和函数组合。点击“开始分析”以评估其有效性。' 
                  : '请在左侧选择一个标准因子或多因子组合，点击“开始分析”。系统将利用 AI 模拟计算因子的 IC 值及分层收益。'}
              </p>
           </div>
         ) : (
           <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Header for custom factor result */}
              {mode === 'custom' && (
                <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-lg flex items-start gap-3">
                  <div className="p-2 bg-blue-600/20 text-blue-400 rounded">
                    <PenTool size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-200">自定义因子分析报告</h4>
                    <p className="text-xs text-zinc-500 font-mono mt-1">{customFormula}</p>
                  </div>
                </div>
              )}
              
               {/* Header for multi-factor result (Preset) */}
               {mode === 'preset' && selectedFactor.startsWith('mf_') && (
                <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-lg flex items-start gap-3">
                  <div className="p-2 bg-purple-600/20 text-purple-400 rounded">
                    <Hexagon size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-200">多因子组合分析报告 (Multi-Factor)</h4>
                    <p className="text-xs text-zinc-500 mt-1">
                      {factors.find(f => f.id === selectedFactor)?.desc}
                    </p>
                  </div>
                </div>
              )}

              {/* Key Metrics */}
              <div className="grid grid-cols-4 gap-4">
                 <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                    <div className="text-zinc-500 text-xs uppercase font-bold mb-1">IC Mean (IC均值)</div>
                    <div className={`text-2xl font-mono ${Number(results.icMean) > 0.05 ? 'text-green-400' : 'text-white'}`}>{results.icMean}</div>
                 </div>
                 <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                    <div className="text-zinc-500 text-xs uppercase font-bold mb-1">IC Std (波动率)</div>
                    <div className="text-2xl font-mono text-zinc-300">{results.icStd}</div>
                 </div>
                 <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                    <div className="text-zinc-500 text-xs uppercase font-bold mb-1">IR (信息比率)</div>
                    <div className="text-2xl font-mono text-blue-400">{results.ir}</div>
                 </div>
                 <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                    <div className="text-zinc-500 text-xs uppercase font-bold mb-1">Turnover (换手率)</div>
                    <div className="text-2xl font-mono text-zinc-300">{results.turnover}</div>
                 </div>
              </div>

              {/* Quantile Returns Chart */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                 <div className="flex justify-between items-center mb-6">
                    <div>
                       <h3 className="text-lg font-bold text-white flex items-center gap-2">
                         <BarChart size={20} className="text-orange-500" /> 分层收益率 (Quantile Returns)
                       </h3>
                       <p className="text-xs text-zinc-500 mt-1">检验因子单调性：理想情况下，Group 5 (High) 收益应显著高于 Group 1 (Low)。</p>
                    </div>
                 </div>
                 <ChartRenderer customData={results.quantiles} customType="bar" />
              </div>

              {/* Cumulative IC Chart */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                 <div className="flex justify-between items-center mb-6">
                    <div>
                       <h3 className="text-lg font-bold text-white flex items-center gap-2">
                         <TrendingUp size={20} className="text-blue-500" /> 累计 IC 序列 (Cumulative IC)
                       </h3>
                       <p className="text-xs text-zinc-500 mt-1">反映因子预测能力的稳定性。曲线稳步上升为佳。</p>
                    </div>
                 </div>
                 <ChartRenderer customData={results.icSeries} customType="line" />
              </div>
           </div>
         )}
      </div>
    </div>
  );
};
