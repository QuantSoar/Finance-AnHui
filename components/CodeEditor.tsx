
import React, { useState, useEffect } from 'react';
import { Sparkles, Play, Save, RotateCcw, Terminal, BarChart2, Zap, Bug, FileText, Wand2 } from 'lucide-react';
import { generateCodeFromPrompt, simulateCodeExecution, CodeTaskType } from '../services/geminiService';
import { DEFAULT_PYTHON_TEMPLATE } from '../services/storageService';
import { ChartRenderer } from './ChartRenderer';

interface CodeEditorProps {
  code: string;
  onChange: (newCode: string) => void;
  onSave: () => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange, onSave }) => {
  const [vibePrompt, setVibePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  
  // Execution State
  const [output, setOutput] = useState<string>('');
  const [chartData, setChartData] = useState<any[] | null>(null);
  const [chartType, setChartType] = useState<string>('none');
  const [activeResultTab, setActiveResultTab] = useState<'console' | 'chart'>('console');

  // Automatically fill template if code is empty on mount or when cleared
  useEffect(() => {
    if (!code || code.trim() === '') {
      onChange(DEFAULT_PYTHON_TEMPLATE);
    }
  }, [code, onChange]);

  const handleTask = async (task: CodeTaskType, customPrompt?: string) => {
    setIsGenerating(true);
    const promptToUse = customPrompt || (task === 'generation' ? vibePrompt : '');
    
    // Fallback if trying to generate without prompt
    if (task === 'generation' && !promptToUse) {
      setIsGenerating(false);
      return;
    }

    try {
      const newCode = await generateCodeFromPrompt(promptToUse, code, task);
      onChange(newCode);
      if (task === 'generation') setVibePrompt('');
    } catch (e) {
      alert("AI 处理失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    setOutput("正在初始化内核并运行代码...\n(AI 模拟环境正在解析您的逻辑...)");
    setChartData(null); // Reset chart
    setActiveResultTab('console');

    try {
      const result = await simulateCodeExecution(code);
      setOutput(result.output);
      
      if (result.chartData && result.chartType !== 'none') {
        setChartData(result.chartData);
        setChartType(result.chartType);
        // Auto switch to chart tab if visualization exists
        setActiveResultTab('chart');
      }
    } catch (e) {
      setOutput("执行错误: 无法连接至模拟环境。");
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("确定要重置代码为默认模板吗？当前更改将丢失。")) {
      onChange(DEFAULT_PYTHON_TEMPLATE);
      setChartData(null);
      setOutput('');
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Vibe Coding Command Center */}
      <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 flex flex-col gap-3 shadow-sm">
        <label className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-2">
          <Sparkles size={14} /> AI 智能编程助手
        </label>
        
        {/* Input Row */}
        <div className="flex gap-2">
          <input
            type="text"
            value={vibePrompt}
            onChange={(e) => setVibePrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTask('generation')}
            placeholder="描述您的需求，例如：'修改参数 pfast=20 并添加 RSI 过滤'..."
            className="flex-1 bg-zinc-950 border border-zinc-700 rounded-md px-4 py-2.5 text-sm text-zinc-200 focus:border-blue-500 focus:outline-none placeholder:text-zinc-600 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
          />
          <button
            onClick={() => handleTask('generation')}
            disabled={isGenerating || !vibePrompt}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md text-sm font-medium disabled:opacity-50 whitespace-nowrap transition-colors shadow-lg shadow-blue-900/20 flex items-center gap-2"
          >
            {isGenerating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Wand2 size={16} />}
            生成
          </button>
        </div>

        {/* Quick Actions Toolbar */}
        <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/50">
           <span className="text-[10px] text-zinc-500 font-medium mr-1">快捷指令:</span>
           
           <button 
             onClick={() => handleTask('optimization')}
             disabled={isGenerating}
             className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs border border-zinc-700 transition-colors disabled:opacity-50"
             title="优化代码性能与结构"
           >
             <Zap size={12} className="text-yellow-500" /> 性能优化
           </button>
           
           <button 
             onClick={() => handleTask('debugging')}
             disabled={isGenerating}
             className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs border border-zinc-700 transition-colors disabled:opacity-50"
             title="自动查找并修复错误"
           >
             <Bug size={12} className="text-red-500" /> 修复 Bug
           </button>
           
           <button 
             onClick={() => handleTask('documentation')}
             disabled={isGenerating}
             className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs border border-zinc-700 transition-colors disabled:opacity-50"
             title="添加详细的文档注释"
           >
             <FileText size={12} className="text-green-500" /> 智能注释
           </button>
        </div>
      </div>

      {/* Code Editor Area */}
      <div className="flex-1 flex flex-col border border-zinc-800 rounded-lg overflow-hidden bg-[#1e1e1e] shadow-xl">
        <div className="flex items-center justify-between bg-[#252526] px-4 py-2 border-b border-zinc-800">
          <span className="text-zinc-400 text-xs font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
            Python 3.10 Kernel (Simulated)
          </span>
          <div className="flex gap-2">
            <button 
              onClick={handleReset}
              className="flex items-center gap-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 px-2 py-1.5 rounded transition-colors text-xs"
              title="重置为默认模板"
            >
              <RotateCcw size={14} /> 重置
            </button>
            <button 
              onClick={onSave}
              className="flex items-center gap-1.5 text-zinc-300 hover:text-white hover:bg-zinc-700 px-2 py-1.5 rounded transition-colors text-xs"
            >
              <Save size={14} /> 保存
            </button>
            <button 
              onClick={handleRun}
              disabled={isRunning}
              className="flex items-center gap-1.5 text-white bg-green-600 hover:bg-green-500 px-3 py-1.5 rounded transition-colors text-xs font-bold shadow-lg shadow-green-900/20"
            >
              <Play size={14} fill="currentColor" /> {isRunning ? '运行中...' : '运行代码'}
            </button>
          </div>
        </div>
        <textarea
          value={code}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 w-full bg-[#1e1e1e] text-zinc-300 font-mono text-sm p-4 focus:outline-none resize-none leading-relaxed"
          spellCheck={false}
        />
      </div>

      {/* Execution Results Area */}
      {(output || isRunning || chartData) && (
        <div className="mt-2 border border-zinc-800 rounded-lg bg-zinc-950 overflow-hidden shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex border-b border-zinc-800 bg-[#252526]">
            <button
              onClick={() => setActiveResultTab('console')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-medium transition-colors border-r border-zinc-800 ${
                activeResultTab === 'console' ? 'bg-[#1e1e1e] text-white border-t-2 border-t-blue-500' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Terminal size={14} /> 控制台输出
            </button>
            <button
              onClick={() => setActiveResultTab('chart')}
              disabled={!chartData}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-medium transition-colors border-r border-zinc-800 ${
                activeResultTab === 'chart' 
                  ? 'bg-[#1e1e1e] text-white border-t-2 border-t-blue-500' 
                  : 'text-zinc-500 hover:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              <BarChart2 size={14} /> 可视化图表
              {chartData && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>}
            </button>
          </div>

          <div className="p-0 bg-[#1e1e1e]">
             {activeResultTab === 'console' ? (
                <div className="p-4 text-sm font-mono text-zinc-300 whitespace-pre-wrap max-h-60 overflow-y-auto min-h-[150px]">
                  {output}
                </div>
             ) : (
               <div className="p-4 bg-[#1e1e1e] min-h-[300px] flex flex-col">
                  {chartData ? (
                     <ChartRenderer customData={chartData} customType={chartType} />
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">暂无图表数据</div>
                  )}
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};
