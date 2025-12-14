
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { AlgorithmView } from './components/AlgorithmView';
import { AlgorithmEditor } from './components/AlgorithmEditor';
import { BacktestLab } from './components/BacktestLab';
import { WorkflowStudio } from './components/WorkflowStudio';
import { ALGORITHMS } from './data/algorithms';
import { getCustomAlgorithms, createNewAlgorithm, saveCustomAlgorithm, forkAlgorithm } from './services/storageService';
import { FinancialAlgorithm } from './types';
import { Library, FlaskConical, LayoutGrid, Workflow } from 'lucide-react';

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
    <div className="flex h-screen w-screen bg-zinc-950 text-zinc-200 font-sans overflow-hidden selection:bg-blue-500/30">
      
      {/* 1. Global Side Navigation (Slim) */}
      <div className="w-16 h-full border-r border-zinc-800 flex flex-col items-center py-6 bg-zinc-950 z-20 shrink-0 gap-2">
        {/* Logo Image */}
        <div className="mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold font-mono text-base shadow-lg shadow-blue-500/20 ring-1 ring-white/10">
            QF
          </div>
        </div>

        <button 
          onClick={() => setCurrentMode('library')}
          className={`p-3 rounded-xl transition-all ${currentMode === 'library' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'}`}
          title="模型库"
        >
          <Library size={24} />
        </button>
        <button 
          onClick={() => setCurrentMode('lab')}
          className={`p-3 rounded-xl transition-all ${currentMode === 'lab' ? 'bg-orange-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'}`}
          title="量化回测实验室"
        >
          <FlaskConical size={24} />
        </button>
        <div className="w-8 h-px bg-zinc-800 my-1"></div>
        <button 
          onClick={() => setCurrentMode('workflow')}
          className={`p-3 rounded-xl transition-all ${currentMode === 'workflow' ? 'bg-purple-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'}`}
          title="工作流智能体"
        >
          <Workflow size={24} />
        </button>
      </div>

      {/* 2. Main Content Area */}
      {currentMode === 'library' && (
        <div className="flex flex-1 overflow-hidden">
          <Sidebar 
            onSelect={setSelectedId} 
            onNew={handleNewAlgorithm}
            selectedId={selectedId} 
            customAlgos={customAlgos}
          />
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
      )}
      
      {currentMode === 'lab' && (
        <div className="flex-1 overflow-hidden">
          <BacktestLab />
        </div>
      )}

      {currentMode === 'workflow' && (
        <div className="flex-1 overflow-hidden">
          <WorkflowStudio />
        </div>
      )}
      
    </div>
  );
};

export default App;
