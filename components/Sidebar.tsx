
import React, { useState } from 'react';
import { ALGORITHMS } from '../data/algorithms';
import { AlgorithmCategory, FinancialAlgorithm } from '../types';
import { ChevronRight, Search, BarChart3, Activity, ShieldAlert, PieChart, Cpu, Plus, FolderGit2, Calculator, History, ChevronDown } from 'lucide-react';

interface SidebarProps {
  onSelect: (id: string) => void;
  onNew: () => void;
  selectedId: string;
  customAlgos: FinancialAlgorithm[];
}

const CategoryIcon = ({ category }: { category: AlgorithmCategory }) => {
  switch (category) {
    case AlgorithmCategory.BACKTEST: return <History size={14} className="text-orange-400" />;
    case AlgorithmCategory.TECHNICAL: return <Activity size={14} className="text-blue-400" />;
    case AlgorithmCategory.QUANT: return <BarChart3 size={14} className="text-green-400" />;
    case AlgorithmCategory.RISK: return <ShieldAlert size={14} className="text-red-400" />;
    case AlgorithmCategory.PORTFOLIO: return <PieChart size={14} className="text-purple-400" />;
    case AlgorithmCategory.ML: return <Cpu size={14} className="text-yellow-400" />;
    case AlgorithmCategory.UTILITY: return <Calculator size={14} className="text-cyan-400" />;
    case AlgorithmCategory.CUSTOM: return <FolderGit2 size={14} className="text-white" />;
    default: return <Activity size={14} />;
  }
};

export const Sidebar: React.FC<SidebarProps> = ({ onSelect, onNew, selectedId, customAlgos }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedCats, setCollapsedCats] = useState<string[]>([]);

  // Combine standard and custom algos
  const allAlgos = [...customAlgos, ...ALGORITHMS];

  const filteredAlgos = allAlgos.filter(algo => 
    algo.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categoryOrder = [
    AlgorithmCategory.BACKTEST,
    AlgorithmCategory.QUANT,
    AlgorithmCategory.ML,
    AlgorithmCategory.RISK,
    AlgorithmCategory.PORTFOLIO,
    AlgorithmCategory.ECONOMICS,
    AlgorithmCategory.UTILITY,
    AlgorithmCategory.CUSTOM
  ];

  const availableCategories = Array.from(new Set(filteredAlgos.map(a => a.category)));
  const categories = categoryOrder.filter(c => availableCategories.includes(c));
  availableCategories.forEach(c => { if (!categories.includes(c)) categories.push(c); });

  const toggleCategory = (cat: string) => {
    setCollapsedCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  return (
    <div className="w-72 h-full bg-zinc-900/60 backdrop-blur-md border-r border-white/5 flex flex-col text-sm shadow-xl z-20">
      {/* Header Area */}
      <div className="p-4 border-b border-white/5 space-y-3">
        <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
          模型策略库
          <span className="px-1.5 py-0.5 rounded-md bg-zinc-800 text-[10px] text-zinc-500 font-mono">{filteredAlgos.length}</span>
        </h2>
        
        <div className="relative group">
          <Search className="absolute left-2.5 top-2.5 text-zinc-500 group-focus-within:text-blue-500 transition-colors" size={14} />
          <input 
            type="text"
            placeholder="搜索模型..."
            className="w-full bg-zinc-950/50 text-zinc-300 pl-9 pr-4 py-2 rounded-lg border border-white/5 focus:border-blue-500/50 focus:bg-zinc-900 focus:outline-none transition-all text-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button 
          onClick={onNew}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-all font-medium text-xs shadow-lg shadow-blue-900/20 active:scale-95"
        >
          <Plus size={14} /> 新建策略
        </button>
      </div>
      
      {/* List Area */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        {categories.map(category => (
          <div key={category} className="space-y-1">
            <button 
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider hover:text-zinc-300 transition-colors group"
            >
              <div className="flex items-center gap-2">
                 <CategoryIcon category={category} />
                 <span>{category}</span>
              </div>
              <ChevronDown size={12} className={`transition-transform duration-200 ${collapsedCats.includes(category) ? '-rotate-90' : 'rotate-0'}`} />
            </button>
            
            {!collapsedCats.includes(category) && (
              <div className="space-y-0.5 animate-in slide-in-from-top-1 duration-200">
                {filteredAlgos.filter(a => a.category === category).map(algo => (
                  <button
                    key={algo.id}
                    onClick={() => onSelect(algo.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between group transition-all border border-transparent ${
                      selectedId === algo.id 
                        ? 'bg-zinc-800 text-zinc-100 border-white/5 shadow-sm' 
                        : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                    }`}
                  >
                    <span className="truncate text-xs font-medium">{algo.title}</span>
                    {selectedId === algo.id && (
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        
        {filteredAlgos.length === 0 && (
          <div className="text-center text-zinc-600 py-10">
            <Search size={24} className="mx-auto mb-2 opacity-20" />
            <p className="text-xs">未找到匹配项</p>
          </div>
        )}
      </div>
    </div>
  );
};
