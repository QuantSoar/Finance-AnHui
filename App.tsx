
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { AlgorithmView } from './components/AlgorithmView';
import { AlgorithmEditor } from './components/AlgorithmEditor';
import { BacktestLab } from './components/BacktestLab';
import { WorkflowStudio } from './components/WorkflowStudio';
import { ALGORITHMS } from './data/algorithms';
import { getCustomAlgorithms, createNewAlgorithm, saveCustomAlgorithm, forkAlgorithm } from './services/storageService';
import { FinancialAlgorithm } from './types';
import { Library, FlaskConical, Workflow, Command } from 'lucide-react';

const App = () => {
  const [currentMode, setCurrentMode] = useState<'library' | 'lab' | 'workflow'>('library');
  const [selectedId, setSelectedId] = useState(ALGORITHMS[0].id);
  const [customAlgos, setCustomAlgos] = useState<FinancialAlgorithm[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    setCustomAlgos(getCustomAlgorithms());
  }, [refreshTrigger]);

  const handleNewAlgorithm = () => {
    const newAlgo = createNewAlgorithm();
    saveCustomAlgorithm(newAlgo);
    setRefreshTrigger(prev => prev + 1);
    setSelectedId(newAlgo.id);
  };

  const handleForkAlgorithm = (algo: FinancialAlgorithm) => {
    const newAlgo = forkAlgorithm(algo);
    setRefreshTrigger(prev => prev + 1);
    setSelectedId(newAlgo.id);
  };

  const handleSaveSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDeleteSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    setSelectedId(ALGORITHMS[0].id);
  };

  const allAlgos = [...customAlgos, ...ALGORITHMS];
  const selectedAlgo = allAlgos.find(a => a.id === selectedId) || allAlgos[0];

  return (
    <div className="flex h-screen w-screen bg-[#09090b] text-zinc-200 font-sans overflow-hidden selection:bg-blue-500/30">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/5 rounded-full blur-[120px]" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/5 rounded-full blur-[120px]" />
      </div>

      {/* 1. Global Side Navigation (Slim) */}
      <div className="w-18 h-full border-r border-white/5 flex flex-col items-center py-6 bg-zinc-900/40 backdrop-blur-md z-30 shrink-0 gap-4">
        {/* Logo */}
        <div className="mb-4 group cursor-pointer relative">
          <div className="absolute inset-0 bg-blue-500/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 flex items-center justify-center text-white font-bold font-mono text-base shadow-xl relative z-10 group-hover:scale-105 transition-transform">
            <span className="bg-gradient-to-br from-blue-400 to-indigo-500 bg-clip-text text-transparent">QF</span>
          </div>
        </div>

        <NavButton 
          active={currentMode === 'library'} 
          onClick={() => setCurrentMode('library')} 
          icon={<Library size={22} />} 
          label="模型库" 
          colorClass="text-blue-400"
        />
        <NavButton 
          active={currentMode === 'lab'} 
          onClick={() => setCurrentMode('lab')} 
          icon={<FlaskConical size={22} />} 
          label="回测" 
          colorClass="text-orange-400"
        />
        <NavButton 
          active={currentMode === 'workflow'} 
          onClick={() => setCurrentMode('workflow')} 
          icon={<Workflow size={22} />} 
          label="工作流" 
          colorClass="text-purple-400"
        />

        <div className="mt-auto mb-4">
           <div className="w-10 h-10 rounded-full bg-zinc-800/50 flex items-center justify-center text-zinc-500 hover:text-white transition-colors cursor-pointer border border-white/5">
             <Command size={18} />
           </div>
        </div>
      </div>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {currentMode === 'library' && (
          <div className="flex flex-1 w-full animate-in fade-in zoom-in-95 duration-300">
            <Sidebar 
              onSelect={setSelectedId} 
              onNew={handleNewAlgorithm}
              selectedId={selectedId} 
              customAlgos={customAlgos}
            />
            <div className="flex-1 bg-zinc-950/50 backdrop-blur-sm">
              {selectedAlgo.isCustom ? (
                <AlgorithmEditor 
                  key={selectedAlgo.id} 
                  algorithm={selectedAlgo} 
                  onSaveSuccess={handleSaveSuccess}
                  onDeleteSuccess={handleDeleteSuccess}
                />
              ) : (
                <AlgorithmView 
                  key={selectedAlgo.id}
                  algorithm={selectedAlgo} 
                  onFork={handleForkAlgorithm}
                />
              )}
            </div>
          </div>
        )}
        
        {currentMode === 'lab' && (
          <div className="flex-1 w-full animate-in fade-in zoom-in-95 duration-300">
            <BacktestLab />
          </div>
        )}

        {currentMode === 'workflow' && (
          <div className="flex-1 w-full animate-in fade-in zoom-in-95 duration-300">
            <WorkflowStudio />
          </div>
        )}
      </div>
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label, colorClass }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, colorClass: string }) => (
  <button 
    onClick={onClick}
    className={`group relative flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 ${active ? 'bg-zinc-800/80 shadow-inner' : 'hover:bg-zinc-800/40'}`}
    title={label}
  >
    {active && <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full ${colorClass.replace('text', 'bg')}`} />}
    <div className={`transition-colors duration-300 ${active ? colorClass : 'text-zinc-500 group-hover:text-zinc-300'}`}>
      {icon}
    </div>
    <span className={`text-[9px] mt-1 font-medium transition-colors ${active ? 'text-zinc-200' : 'text-zinc-600 group-hover:text-zinc-500'}`}>{label}</span>
  </button>
);

export default App;
