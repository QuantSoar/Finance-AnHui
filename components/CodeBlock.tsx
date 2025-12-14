import React from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'python' }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-lg overflow-hidden border border-zinc-800 bg-[#1e1e1e] font-mono text-sm shadow-xl">
      <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-zinc-800">
        <span className="text-zinc-400 text-xs">Jupyter Notebook 单元格 ({language})</span>
        <button 
          onClick={handleCopy}
          className="text-zinc-400 hover:text-white transition-colors"
          title="复制全部代码"
        >
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre>
          <code className="text-zinc-300">
            {code}
          </code>
        </pre>
      </div>
    </div>
  );
};