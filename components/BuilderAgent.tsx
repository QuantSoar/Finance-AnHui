
import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Loader2, Sparkles } from 'lucide-react';
import { runBuilderAgent } from '../services/geminiService';
import { FinancialAlgorithm, AgentResponse } from '../types';

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
    { id: '1', role: 'agent', content: '您好！我是您的金融算法架构师。\n\n我已连接 AKShare 数据库，您可以直接要求我获取 A股、港美股、基金等数据。\n\n例如：“帮我写一个获取茅台历史行情并计算MACD的策略”' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare conversation history for API
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        content: m.content
      }));
      history.push({ role: 'user', content: userMsg.content });

      const response: AgentResponse = await runBuilderAgent(history, currentAlgo);

      const agentMsg: Message = { id: (Date.now() + 1).toString(), role: 'agent', content: response.reply };
      setMessages(prev => [...prev, agentMsg]);

      if (response.updates) {
        // Cast to unknown first because 'category' string is not directly assignable to enum in strict mode
        onUpdate(response.updates as unknown as Partial<FinancialAlgorithm>);
      }
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'agent', content: '抱歉，连接中断，请重试。' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-l border-zinc-800 shadow-2xl w-96 fixed right-0 top-0 bottom-0 z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950">
        <div className="flex items-center gap-2 text-blue-400 font-bold">
          <Sparkles size={18} />
          <span>算法架构师 Agent</span>
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg p-3 text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-zinc-800 text-zinc-200 border border-zinc-700'
            }`}>
              {msg.role === 'agent' && <Bot size={14} className="mb-1 text-blue-400 inline-block mr-2" />}
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-zinc-800 text-zinc-400 rounded-lg p-3 border border-zinc-700 flex items-center gap-2 text-sm">
               <Loader2 size={14} className="animate-spin" />
               正在思考并构建模型...
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
            placeholder="输入指令..."
            className="w-full bg-zinc-900 border border-zinc-700 rounded-full pl-4 pr-10 py-3 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 p-1.5 bg-blue-600 rounded-full text-white hover:bg-blue-500 disabled:opacity-50 disabled:bg-zinc-700 transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
        <div className="text-[10px] text-zinc-600 mt-2 text-center">
          Agent 可以直接修改左侧的模型代码和配置
        </div>
      </div>
    </div>
  );
};
