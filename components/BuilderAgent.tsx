
import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Loader2, Sparkles, Settings, Globe, Key, MonitorPlay } from 'lucide-react';
import { runBuilderAgent } from '../services/geminiService';
import { sendMessageToDify } from '../services/difyService';
import { FinancialAlgorithm, AgentResponse, DifyConfig, AgentMode } from '../types';

interface BuilderAgentProps {
  currentAlgo: FinancialAlgorithm;
  onUpdate: (updates: Partial<FinancialAlgorithm>) => void;
  onClose: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
}

export const BuilderAgent: React.FC<BuilderAgentProps> = ({ currentAlgo, onUpdate, onClose }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'agent', content: '您好！我是您的金融算法架构师。\n\n我可以协助您进行策略开发、Debug及回测配置。' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Configuration State
  const [showConfig, setShowConfig] = useState(false);
  const [agentMode, setAgentMode] = useState<AgentMode>('gemini_direct');
  const [difyConfig, setDifyConfig] = useState<DifyConfig>({
    apiKey: '',
    baseUrl: 'https://api.dify.ai/v1'
  });
  const [difyConversationId, setDifyConversationId] = useState<string | undefined>(undefined);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save/Load Config from LocalStorage
  useEffect(() => {
    const stored = localStorage.getItem('qf_dify_config');
    if (stored) {
      setDifyConfig(JSON.parse(stored));
    }
  }, []);

  const saveConfig = () => {
    localStorage.setItem('qf_dify_config', JSON.stringify(difyConfig));
    setShowConfig(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      let response: AgentResponse;

      if (agentMode === 'dify_agent') {
        // --- DIFY MODE ---
        if (!difyConfig.apiKey) {
           throw new Error("请先在设置中配置 Dify API Key");
        }
        
        // Append context about current code for Dify if it's the first message or explicit request
        // Note: Dify usually manages its own context, but we can pass current code as query context if needed.
        // For simplicity, we send the user query directly, assuming Dify agent is configured with coding capabilities.
        const res = await sendMessageToDify(
            userMsg.content, 
            difyConfig, 
            difyConversationId
        );
        response = res.response;
        setDifyConversationId(res.conversationId);

      } else {
        // --- GEMINI DIRECT MODE ---
        // Prepare conversation history for API
        const history = messages.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          content: m.content
        }));
        history.push({ role: 'user', content: userMsg.content });
        response = await runBuilderAgent(history, currentAlgo);
      }

      const agentMsg: Message = { id: (Date.now() + 1).toString(), role: 'agent', content: response.reply };
      setMessages(prev => [...prev, agentMsg]);

      if (response.updates) {
        // If updates detected (parsed from Dify markdown or JSON from Gemini), apply them
        onUpdate(response.updates as unknown as Partial<FinancialAlgorithm>);
        
        // Notify user if code was updated via Dify logic (Gemini usually says it in JSON)
        if (agentMode === 'dify_agent' && response.updates.pythonCode) {
           setMessages(prev => [...prev, { 
             id: (Date.now() + 2).toString(), 
             role: 'agent', 
             content: '✅ 已根据您的要求更新了编辑器中的代码。' 
           }]);
        }
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'agent', content: `错误: ${e.message || '连接中断，请重试。'}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (showConfig) {
    return (
      <div className="flex flex-col h-full bg-zinc-900 border-l border-zinc-800 shadow-2xl w-96 fixed right-0 top-0 bottom-0 z-50">
         <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950">
            <h3 className="text-white font-bold flex items-center gap-2"><Settings size={18} /> 智能体配置</h3>
            <button onClick={() => setShowConfig(false)} className="text-zinc-500 hover:text-white"><X size={18} /></button>
         </div>
         <div className="p-6 space-y-6">
            <div>
              <label className="text-xs text-zinc-500 font-bold uppercase mb-2 block">Agent 模式</label>
              <div className="flex bg-zinc-950 rounded p-1 border border-zinc-800">
                <button 
                  onClick={() => setAgentMode('gemini_direct')}
                  className={`flex-1 py-2 rounded text-xs font-medium transition-colors ${agentMode === 'gemini_direct' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  原生 Gemini
                </button>
                <button 
                  onClick={() => setAgentMode('dify_agent')}
                  className={`flex-1 py-2 rounded text-xs font-medium transition-colors ${agentMode === 'dify_agent' ? 'bg-blue-600 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Dify 平台
                </button>
              </div>
            </div>

            {agentMode === 'dify_agent' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                 <div className="p-3 bg-blue-900/20 border border-blue-800/50 rounded-lg text-xs text-blue-300">
                   通过接入 Dify，您可以利用自定义的知识库、工作流和工具来增强开发体验。
                 </div>
                 <div>
                   <label className="text-xs text-zinc-400 mb-1 block flex items-center gap-1"><Globe size={12} /> API Base URL</label>
                   <input 
                     type="text" 
                     value={difyConfig.baseUrl}
                     onChange={(e) => setDifyConfig(prev => ({...prev, baseUrl: e.target.value}))}
                     placeholder="https://api.dify.ai/v1"
                     className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 focus:border-blue-500 outline-none"
                   />
                 </div>
                 <div>
                   <label className="text-xs text-zinc-400 mb-1 block flex items-center gap-1"><Key size={12} /> API Key</label>
                   <input 
                     type="password" 
                     value={difyConfig.apiKey}
                     onChange={(e) => setDifyConfig(prev => ({...prev, apiKey: e.target.value}))}
                     placeholder="app-..."
                     className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 focus:border-blue-500 outline-none"
                   />
                 </div>
              </div>
            )}
            
            <button onClick={saveConfig} className="w-full bg-zinc-100 hover:bg-white text-black font-bold py-2 rounded mt-4">
              保存配置
            </button>
         </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-l border-zinc-800 shadow-2xl w-96 fixed right-0 top-0 bottom-0 z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950">
        <div className="flex items-center gap-2 font-bold">
          {agentMode === 'dify_agent' ? (
            <div className="flex items-center gap-2 text-blue-400">
               <MonitorPlay size={18} />
               <span>Dify 智能开发</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-indigo-400">
               <Sparkles size={18} />
               <span>Gemini 架构师</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowConfig(true)} className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded transition-colors" title="配置 Agent">
            <Settings size={16} />
          </button>
          <button onClick={onClose} className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg p-3 text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                : 'bg-zinc-800 text-zinc-200 border border-zinc-700 shadow-sm'
            }`}>
              {msg.role === 'agent' && <Bot size={14} className={`mb-1 inline-block mr-2 ${agentMode === 'dify_agent' ? 'text-blue-400' : 'text-indigo-400'}`} />}
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-zinc-800 text-zinc-400 rounded-lg p-3 border border-zinc-700 flex items-center gap-2 text-sm">
               <Loader2 size={14} className="animate-spin" />
               {agentMode === 'dify_agent' ? 'Dify 正在思考...' : '构建模型中...'}
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-zinc-950 border-t border-zinc-800">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={agentMode === 'dify_agent' ? "向 Dify 发送指令 (支持RAG)..." : "输入指令..."}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-full pl-4 pr-10 py-3 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-zinc-600"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`absolute right-2 top-2 p-1.5 rounded-full text-white transition-colors disabled:opacity-50 disabled:bg-zinc-700 ${agentMode === 'dify_agent' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}
          >
            <Send size={14} />
          </button>
        </div>
        <div className="text-[10px] text-zinc-600 mt-2 text-center flex items-center justify-center gap-1.5">
          {agentMode === 'dify_agent' && <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>}
          {agentMode === 'dify_agent' ? '已连接 Dify 平台 · 支持代码自动应用' : 'Gemini 直连模式 · 快速构建'}
        </div>
      </div>
    </div>
  );
};
