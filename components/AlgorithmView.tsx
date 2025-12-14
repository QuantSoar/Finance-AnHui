import React, { useState } from 'react';
import { FinancialAlgorithm } from '../types';
import { CodeBlock } from './CodeBlock';
import { ChartRenderer } from './ChartRenderer';
import { getGeminiExplanation } from '../services/geminiService';
import { Bot, PlayCircle, BookOpen, Terminal, GitFork, Lightbulb, CheckCircle2, ListFilter, GraduationCap } from 'lucide-react';

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
    <div className="flex-1 h-screen overflow-y-auto bg-zinc-950 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
               <span className="text-xs font-mono text-blue-400 bg-blue-400/10 px-2 py-1 rounded uppercase tracking-widest border border-blue-400/20">
                 {algorithm.category}
               </span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">{algorithm.title}</h1>
            <p className="text-zinc-400 max-w-3xl text-lg leading-relaxed">{algorithm.description}</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${activeTab === 'overview' ? 'bg-zinc-100 text-zinc-900 font-medium' : 'text-zinc-400 hover:bg-zinc-900'}`}
            >
              <PlayCircle size={18} /> 演示 & 代码
            </button>
            <button 
              onClick={() => setActiveTab('guide')}
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${activeTab === 'guide' ? 'bg-zinc-100 text-zinc-900 font-medium' : 'text-zinc-400 hover:bg-zinc-900'}`}
            >
              <GraduationCap size={18} /> 知识指南
            </button>
            {onFork && (
              <button 
                onClick={() => onFork(algorithm)}
                className="px-4 py-2 rounded-md flex items-center gap-2 transition-all text-zinc-400 hover:text-white hover:bg-zinc-800"
                title="复用此模型到我的工作台"
              >
                <GitFork size={18} /> 复用
              </button>
            )}
            <button 
              onClick={() => setActiveTab('ai')}
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${activeTab === 'ai' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-zinc-400 hover:text-indigo-400'}`}
            >
              <Bot size={18} /> AI 助手
            </button>
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            {/* Visualization Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-zinc-200 flex items-center gap-2">
                  <PlayCircle className="text-green-500" size={20} />
                  运行结果可视化
                </h2>
                <span className="text-xs text-zinc-500 font-mono">React Recharts Rendering</span>
              </div>
              <ChartRenderer algorithm={algorithm} />
              <div className="text-xs text-zinc-500 italic">* 上图为基于模拟数据的实时渲染，实际数据请在下方 Python 代码中加载。</div>
            </section>

            {/* Code Section */}
            <section className="space-y-4">
               <h2 className="text-xl font-semibold text-zinc-200 flex items-center gap-2">
                <Terminal className="text-yellow-500" size={20} />
                Python 实现源码
              </h2>
              <CodeBlock code={algorithm.pythonCode} />
            </section>
          </div>
        )}

        {activeTab === 'guide' && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 grid grid-cols-1 md:grid-cols-3 gap-8">
             {algorithm.info ? (
               <>
                 {/* Main Content */}
                 <div className="md:col-span-2 space-y-8">
                   <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
                     <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                       <BookOpen className="text-blue-500" size={20} /> 原理与定义
                     </h3>
                     <p className="text-zinc-300 leading-relaxed whitespace-pre-line">
                       {algorithm.info.whatIsIt}
                     </p>
                   </div>

                   <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
                     <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                       <Lightbulb className="text-yellow-500" size={20} /> 结果解读
                     </h3>
                     <p className="text-zinc-300 leading-relaxed whitespace-pre-line border-l-4 border-yellow-500/50 pl-4">
                       {algorithm.info.interpretation}
                     </p>
                   </div>

                    <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
                     <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                       <Terminal className="text-green-500" size={20} /> 如何使用
                     </h3>
                     <p className="text-zinc-300 leading-relaxed whitespace-pre-line">
                       {algorithm.info.howToUse}
                     </p>
                   </div>
                 </div>

                 {/* Sidebar Content */}
                 <div className="space-y-6">
                    <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                      <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <ListFilter size={16} /> 适用场景
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

                    <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                      <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <ListFilter size={16} /> 关键参数
                      </h3>
                      <div className="space-y-4">
                        {algorithm.info.parameters.map((p, i) => (
                          <div key={i} className="text-sm">
                            <div className="font-mono text-blue-400 mb-1">{p.name}</div>
                            <div className="text-zinc-400 leading-snug">{p.desc}</div>
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
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-zinc-900 rounded-lg p-6 border border-zinc-800 space-y-4 min-h-[400px]">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Bot className="text-blue-500" />
              询问 Gemini 关于 {algorithm.title}
            </h2>
            <div className="space-y-2">
              <textarea
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="例如：如何优化该模型的参数？或者解释其背后的数学原理。"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md p-3 text-zinc-300 focus:outline-none focus:border-blue-500 min-h-[100px]"
              />
              <div className="flex justify-end">
                <button 
                  onClick={handleAskAi}
                  disabled={loadingAi || !aiQuery}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                >
                  {loadingAi ? '分析中...' : '生成回答'}
                </button>
              </div>
            </div>
            {aiResponse && (
              <div className="mt-6 p-4 bg-zinc-950 rounded-md border border-zinc-800">
                <h3 className="text-sm font-semibold text-zinc-400 mb-2 uppercase">Gemini 回答</h3>
                <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">
                  {aiResponse}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};