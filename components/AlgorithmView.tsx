
import React, { useState } from 'react';
import { FinancialAlgorithm } from '../types';
import { CodeBlock } from './CodeBlock';
import { ChartRenderer } from './ChartRenderer';
import { getGeminiExplanation } from '../services/geminiService';
import { Bot, PlayCircle, BookOpen, Terminal, GitFork, Lightbulb, CheckCircle2, ListFilter, Sparkles, Layout, ArrowRight } from 'lucide-react';

interface AlgorithmViewProps {
  algorithm: FinancialAlgorithm;
  onFork?: (algorithm: FinancialAlgorithm) => void;
}

export const AlgorithmView: React.FC<AlgorithmViewProps> = ({ algorithm, onFork }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'guide' | 'ai'>('overview');
  const [aiResponse, setAiResponse] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiQuery, setAiQuery] = useState('');

  const handleAskAi = async () => {
    if (!aiQuery) return;
    setLoadingAi(true);
    try {
      const response = await getGeminiExplanation(algorithm.title, aiQuery);
      setAiResponse(response || "AI 没有返回响应。");
    } catch (e) {
      setAiResponse("错误：无法获取响应。请检查您的 API 密钥。");
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-zinc-950 p-6 relative selection:bg-blue-500/30">
      {/* Subtle Background Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-blue-900/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-8 relative z-10 animate-in fade-in slide-in-from-top-4 duration-500">
        
        {/* Modern Header Section */}
        <div className="mb-8">
           {/* Meta Tags */}
           <div className="flex items-center gap-2 mb-4">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-zinc-900 text-zinc-500 border border-zinc-800 shadow-sm">
                {algorithm.category}
              </span>
              {algorithm.isCustom && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-orange-900/10 text-orange-400 border border-orange-500/20">
                  Custom Model
                </span>
              )}
           </div>

           {/* Title & Description */}
           <h1 className="text-3xl font-semibold text-zinc-100 tracking-tight leading-tight">
             {algorithm.title}
           </h1>
           <p className="mt-3 text-sm text-zinc-400 leading-relaxed max-w-3xl font-light">
             {algorithm.description}
           </p>

           {/* Glassmorphic Toolbar */}
           <div className="mt-8 flex items-center justify-between bg-zinc-900/60 backdrop-blur-md border border-zinc-800/60 p-1.5 rounded-xl shadow-lg">
              
              {/* Left: Navigation Tabs */}
              <div className="flex bg-zinc-950/50 p-1 rounded-lg border border-zinc-800/50">
                 <button
                   onClick={() => setActiveTab('overview')}
                   className={`px-4 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all duration-200 ${
                     activeTab === 'overview' 
                       ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/5' 
                       : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                   }`}
                 >
                   <Layout size={14} className={activeTab === 'overview' ? 'text-blue-400' : ''} />
                   演示 & 代码
                 </button>
                 <button
                   onClick={() => setActiveTab('guide')}
                   className={`px-4 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all duration-200 ${
                     activeTab === 'guide' 
                       ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/5' 
                       : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                   }`}
                 >
                   <BookOpen size={14} className={activeTab === 'guide' ? 'text-green-400' : ''} />
                   知识指南
                 </button>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 pr-1">
                 {/* Reuse/Fork Button */}
                 {onFork && (
                   <button 
                     onClick={() => onFork(algorithm)}
                     className="group flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors border border-transparent hover:border-zinc-700"
                     title="复用此模型到我的工作台"
                   >
                     <GitFork size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                     <span className="hidden sm:inline">复用模型</span>
                   </button>
                 )}

                 {/* Divider */}
                 <div className="w-px h-4 bg-zinc-800 mx-1" />

                 {/* Premium AI Button */}
                 <button 
                   onClick={() => setActiveTab('ai')}
                   className={`relative group flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all overflow-hidden ${
                     activeTab === 'ai' ? 'text-white' : 'text-indigo-400 hover:text-white'
                   }`}
                 >
                   {/* Gradient Background (Visible on Active/Hover) */}
                   <div className={`absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[length:200%_100%] animate-shimmer ${activeTab === 'ai' ? 'opacity-100' : ''}`} />
                   
                   {/* Border Glow for Inactive State */}
                   {activeTab !== 'ai' && <div className="absolute inset-0 border border-indigo-500/30 rounded-lg group-hover:border-transparent transition-colors" />}

                   <div className="relative flex items-center gap-2">
                     <Sparkles size={14} className={activeTab === 'ai' ? 'text-indigo-100' : 'text-indigo-500 group-hover:text-indigo-100'} />
                     AI 助手
                   </div>
                 </button>
              </div>
           </div>
        </div>

        {/* Main Content Area */}
        <div className="min-h-[500px]">
          {activeTab === 'overview' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
              {/* Visualization Section */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-zinc-300 flex items-center gap-2 uppercase tracking-wider">
                    <PlayCircle size={16} className="text-blue-500" />
                    运行结果 (Visualization)
                  </h2>
                </div>
                <ChartRenderer algorithm={algorithm} />
              </section>

              {/* Code Section */}
              <section className="space-y-4">
                 <h2 className="text-sm font-bold text-zinc-300 flex items-center gap-2 uppercase tracking-wider">
                    <Terminal size={16} className="text-yellow-500" />
                    Python 源码 (Jupyter Kernel)
                 </h2>
                <CodeBlock code={algorithm.pythonCode} />
              </section>
            </div>
          )}

          {activeTab === 'guide' && (
             <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 grid grid-cols-1 md:grid-cols-3 gap-8">
               {algorithm.info ? (
                 <>
                   {/* Main Content */}
                   <div className="md:col-span-2 space-y-6">
                     <div className="group bg-zinc-900/30 rounded-2xl p-6 border border-zinc-800/50 hover:border-blue-500/30 transition-colors backdrop-blur-sm">
                       <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                         <div className="p-1.5 bg-blue-500/10 rounded-md text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                            <BookOpen size={16} />
                         </div>
                         原理与定义
                       </h3>
                       <p className="text-zinc-400 leading-relaxed text-sm">
                         {algorithm.info.whatIsIt}
                       </p>
                     </div>

                     <div className="group bg-zinc-900/30 rounded-2xl p-6 border border-zinc-800/50 hover:border-yellow-500/30 transition-colors backdrop-blur-sm">
                       <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                         <div className="p-1.5 bg-yellow-500/10 rounded-md text-yellow-400 group-hover:bg-yellow-500 group-hover:text-white transition-colors">
                            <Lightbulb size={16} />
                         </div>
                         结果解读
                       </h3>
                       <p className="text-zinc-400 leading-relaxed text-sm border-l-2 border-yellow-500/20 pl-4">
                         {algorithm.info.interpretation}
                       </p>
                     </div>

                      <div className="group bg-zinc-900/30 rounded-2xl p-6 border border-zinc-800/50 hover:border-green-500/30 transition-colors backdrop-blur-sm">
                       <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                         <div className="p-1.5 bg-green-500/10 rounded-md text-green-400 group-hover:bg-green-500 group-hover:text-white transition-colors">
                            <Terminal size={16} />
                         </div>
                         如何使用
                       </h3>
                       <p className="text-zinc-400 leading-relaxed text-sm">
                         {algorithm.info.howToUse}
                       </p>
                     </div>
                   </div>

                   {/* Sidebar Content */}
                   <div className="space-y-6">
                      <div className="bg-zinc-900/30 rounded-2xl p-6 border border-zinc-800/50 backdrop-blur-sm">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <ListFilter size={14} /> 适用场景
                        </h3>
                        <ul className="space-y-3">
                          {algorithm.info.scenarios.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                              <CheckCircle2 className="text-blue-500 shrink-0 mt-0.5" size={14} />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-zinc-900/30 rounded-2xl p-6 border border-zinc-800/50 backdrop-blur-sm">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <ListFilter size={14} /> 关键参数
                        </h3>
                        <div className="space-y-4">
                          {algorithm.info.parameters.map((p, i) => (
                            <div key={i} className="text-sm">
                              <div className="font-mono text-blue-400 mb-1 text-xs bg-blue-500/10 inline-block px-1.5 rounded">{p.name}</div>
                              <div className="text-zinc-400 leading-snug text-xs">{p.desc}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                   </div>
                 </>
               ) : (
                 <div className="col-span-3 text-center py-20 text-zinc-500">
                   <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
                   <p>该模型暂无详细指南数据。</p>
                 </div>
               )}
             </div>
          )}

          {activeTab === 'ai' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 bg-zinc-900/40 rounded-2xl p-8 border border-zinc-800/80 backdrop-blur-md space-y-6 min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden">
              {/* Background Decoration */}
              <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent animate-pulse pointer-events-none" />
              
              <div className="relative z-10 w-full max-w-2xl mx-auto space-y-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/30 ring-1 ring-white/10">
                   <Bot className="text-white" size={32} />
                </div>
                
                <h2 className="text-2xl font-bold text-white">
                  关于 <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">{algorithm.title}</span> 的任何问题
                </h2>
                <p className="text-zinc-400 text-sm">
                  由 Gemini Pro 提供支持。您可以询问参数含义、优化建议、数学原理，或者要求生成相关代码。
                </p>

                <div className="w-full relative group text-left">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-zinc-950 rounded-xl p-3 border border-zinc-800 flex flex-col gap-2 shadow-2xl">
                    <textarea
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                      placeholder="在这里输入您的问题..."
                      className="w-full bg-transparent border-none text-zinc-200 focus:ring-0 p-2 min-h-[80px] resize-none text-sm placeholder:text-zinc-600"
                    />
                    <div className="flex justify-between items-center px-2 pb-1">
                      <div className="flex gap-2">
                        <button onClick={() => setAiQuery("如何优化这个策略的参数？")} className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-400 px-2 py-1 rounded transition-colors border border-zinc-700">参数优化</button>
                        <button onClick={() => setAiQuery("解释代码中的数学原理")} className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-400 px-2 py-1 rounded transition-colors border border-zinc-700">数学原理</button>
                      </div>
                      <button 
                        onClick={handleAskAi}
                        disabled={loadingAi || !aiQuery}
                        className="bg-zinc-100 hover:bg-white text-black px-4 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50 transition-colors flex items-center gap-2"
                      >
                        {loadingAi ? <Layout className="animate-spin" size={14} /> : <Sparkles size={14} />}
                        发送
                      </button>
                    </div>
                  </div>
                </div>

                {aiResponse && (
                  <div className="mt-8 p-6 bg-zinc-950/80 rounded-xl border border-zinc-800 text-left animate-in fade-in slide-in-from-bottom-2 shadow-xl">
                    <div className="flex items-center gap-2 mb-4 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                      <Bot size={14} /> Gemini Analysis
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap leading-relaxed text-zinc-300">
                      {aiResponse}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
