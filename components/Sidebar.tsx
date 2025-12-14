import React, { useState } from 'react';
import { ALGORITHMS } from '../data/algorithms';
import { AlgorithmCategory, FinancialAlgorithm } from '../types';
import { ChevronRight, Search, BarChart3, Activity, ShieldAlert, PieChart, Cpu, Plus, FolderGit2, Calculator, History } from 'lucide-react';

interface SidebarProps {
  onSelect: (id: string) => void;
  onNew: () => void;
  selectedId: string;
  customAlgos: FinancialAlgorithm[];
}

const CategoryIcon = ({ category }: { category: AlgorithmCategory }) => {
  switch (category) {
    case AlgorithmCategory.BACKTEST: return <History size={16} className="text-orange-500" />;
    case AlgorithmCategory.TECHNICAL: return <Activity size={16} className="text-blue-400" />;
    case AlgorithmCategory.QUANT: return <BarChart3 size={16} className="text-green-400" />;
    case AlgorithmCategory.RISK: return <ShieldAlert size={16} className="text-red-400" />;
    case AlgorithmCategory.PORTFOLIO: return <PieChart size={16} className="text-purple-400" />;
    case AlgorithmCategory.ML: return <Cpu size={16} className="text-yellow-400" />;
    case AlgorithmCategory.UTILITY: return <Calculator size={16} className="text-cyan-400" />;
    case AlgorithmCategory.CUSTOM: return <FolderGit2 size={16} className="text-zinc-300" />;
    default: return <Activity size={16} />;
  }
};

export const Sidebar: React.FC<SidebarProps> = ({ onSelect, onNew, selectedId, customAlgos }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Combine standard and custom algos
  const allAlgos = [...customAlgos, ...ALGORITHMS];

  const filteredAlgos = allAlgos.filter(algo => 
    algo.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Define category order, prioritizing Backtest and Custom
  const categoryOrder = [
    AlgorithmCategory.BACKTEST,
    AlgorithmCategory.TECHNICAL,
    AlgorithmCategory.QUANT,
    AlgorithmCategory.RISK,
    AlgorithmCategory.PORTFOLIO,
    AlgorithmCategory.ML,
    AlgorithmCategory.ECONOMICS,
    AlgorithmCategory.UTILITY,
    AlgorithmCategory.CUSTOM
  ];

  // Get available categories from data
  const availableCategories = Array.from(new Set(filteredAlgos.map(a => a.category)));
  
  // Sort based on predefined order
  const categories = categoryOrder.filter(c => availableCategories.includes(c));
  // Add any remaining categories not in the explicit list
  availableCategories.forEach(c => {
    if (!categories.includes(c)) categories.push(c);
  });

  return (
    <div className="w-80 h-screen bg-zinc-950 border-r border-zinc-800 flex flex-col text-sm shadow-xl z-10">
      <div className="p-4 border-b border-zinc-800 bg-zinc-950">
        <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold font-mono text-xs shadow-md ring-1 ring-white/10">
            QF
          </div>
          量化金融工坊
        </h1>
        <p className="text-[10px] text-zinc-500 mt-1 pl-11">Quant Finance & Algo Trading</p>
        
        {/* New Algorithm Button */}
        <button 
          onClick={onNew}
          className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md flex items-center justify-center gap-2 transition-colors font-medium text-sm"
        >
          <Plus size={16} /> 新建策略/模型
        </button>

        <div className="mt-4 relative">
          <Search className="absolute left-2 top-2.5 text-zinc-500" size={16} />
          <input 
            type="text"
            placeholder="搜索模型或策略..."
            className="w-full bg-zinc-900 text-zinc-300 pl-8 pr-4 py-2 rounded-md border border-zinc-700 focus:outline-none focus:border-blue-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-800">
        {categories.map(category => (
          <div key={category} className="mb-6">
            <h3 className="px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <CategoryIcon category={category} />
              {category}
            </h3>
            <div className="space-y-0.5">
              {filteredAlgos.filter(a => a.category === category).map(algo => (
                <button
                  key={algo.id}
                  onClick={() => onSelect(algo.id)}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between group transition-colors border border-transparent ${
                    selectedId === algo.id 
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                  }`}
                >
                  <span className="truncate">{algo.title}</span>
                  {selectedId === algo.id && <ChevronRight size={14} />}
                </button>
              ))}
            </div>
          </div>
        ))}
        {filteredAlgos.length === 0 && (
          <div className="text-center text-zinc-600 mt-10">
            未找到结果
          </div>
        )}
      </div>
    </div>
  );
};