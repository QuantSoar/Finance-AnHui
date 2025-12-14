import React, { useState, useEffect } from 'react';
import { FinancialAlgorithm } from '../types';
import { CodeEditor } from './CodeEditor';
import { saveCustomAlgorithm, deleteCustomAlgorithm } from '../services/storageService';
import { Trash2, Sparkles, Database, Save, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { BuilderAgent } from './BuilderAgent';
import { DataManager } from './DataManager';

interface AlgorithmEditorProps {
  algorithm: FinancialAlgorithm;
  onSaveSuccess: () => void;
  onDeleteSuccess: () => void;
}

export const AlgorithmEditor: React.FC<AlgorithmEditorProps> = ({ algorithm, onSaveSuccess, onDeleteSuccess }) => {
  const [localAlgo, setLocalAlgo] = useState<FinancialAlgorithm>(algorithm);
  const [isDirty, setIsDirty] = useState(false);
  const [showAgent, setShowAgent] = useState(false);
  const [showDataPanel, setShowDataPanel] = useState(false);

  // Sync when prop changes
  useEffect(() => {
    setLocalAlgo(algorithm);
    setIsDirty(false);
  }, [algorithm.id]);

  const handleChange = (field: keyof FinancialAlgorithm, value: any) => {
    setLocalAlgo(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleAgentUpdate = (updates: Partial<FinancialAlgorithm>) => {
    setLocalAlgo(prev => ({ ...prev, ...updates }));
    setIsDirty(true);
  };

  const handleInsertDataCode = (codeToInsert: string) => {
    const currentCode = localAlgo.pythonCode || "";
    let newCode = "";
    if (currentCode.includes("plt.style.use")) {
       newCode = currentCode.replace("plt.style.use('dark_background')", "plt.style.use('dark_background')\n\n" + codeToInsert);
    } else {
       newCode = codeToInsert + "\n" + currentCode;
    }
    handleChange('pythonCode', newCode);
  };

  const handleSave = () => {
    saveCustomAlgorithm(localAlgo);
    setIsDirty(false);
    onSaveSuccess();
  };

  const handleDelete = () => {
    if (window.confirm("确定要删除这个模型吗？此操作无法撤销。")) {
      deleteCustomAlgorithm(localAlgo.id);
      onDeleteSuccess();
    }
  };

  return (
    <div className="flex flex-1 relative overflow-hidden bg-zinc-950 h-screen w-full">
      
      {/* Main Content Wrapper - No margin shifting to prevent layout bugs */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        
        {/* Top Toolbar */}
        <div className="h-14 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-4 shrink-0 z-20">
           <div className="flex items-center gap-4 overflow-hidden">
             <div className="flex flex-col">
               <input
                 type="text"
                 value={localAlgo.title}
                 onChange={(e) => handleChange('title', e.target.value)}
                 className="bg-transparent text-base font-bold text-white focus:outline-none focus:border-b border-blue-500 placeholder:text-zinc-600 w-64 truncate"
                 placeholder="模型名称"
               />
               <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                 {localAlgo.category} {isDirty && <span className="text-yellow-500">• 未保存</span>}
               </span>
             </div>
           </div>

           <div className="flex items-center gap-2">
             <button
                onClick={() => setShowDataPanel(!showDataPanel)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${
                  showDataPanel 
                    ? 'bg-zinc-800 text-white border-zinc-600 shadow-inner' 
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
                }`}
             >
               <Database size={14} />
               数据
             </button>

             <button
                onClick={() => setShowAgent(!showAgent)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${
                  showAgent 
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-900/30' 
                    : 'bg-zinc-900 text-indigo-400 border-zinc-800 hover:border-indigo-500/50'
                }`}
             >
               <Sparkles size={14} />
               AI 助手
               {showAgent ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
             </button>

             <div className="h-5 w-px bg-zinc-800 mx-1"></div>

             <button 
               onClick={handleSave}
               disabled={!isDirty}
               className={`p-1.5 rounded-md transition-colors ${isDirty ? 'text-green-400 hover:bg-green-900/20' : 'text-zinc-600'}`}
               title="保存"
             >
               <Save size={16} />
             </button>
             <button 
               onClick={handleDelete}
               className="p-1.5 rounded-md text-zinc-600 hover:text-red-400 hover:bg-red-900/10 transition-colors"
               title="删除"
             >
               <Trash2 size={16} />
             </button>
           </div>
        </div>

        {/* Workspace Area */}
        <div className="flex-1 overflow-hidden flex relative">
            {/* Data Panel Sidebar (Left) - Slide in */}
            {showDataPanel && (
              <div className="w-80 border-r border-zinc-800 bg-zinc-900/95 absolute left-0 top-0 bottom-0 z-30 shadow-2xl backdrop-blur-sm animate-in slide-in-from-left-10 duration-200">
                <DataManager onInsertCode={handleInsertDataCode} />
              </div>
            )}

            {/* Editor (Center) */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-zinc-700">
               <div className="max-w-6xl mx-auto space-y-4 h-full flex flex-col">
                 <div className="mb-1">
                   <textarea
                    value={localAlgo.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={1}
                    placeholder="添加模型描述..."
                    className="w-full bg-transparent text-xs text-zinc-500 focus:text-zinc-300 focus:outline-none resize-none transition-colors"
                   />
                 </div>

                 <CodeEditor 
                   code={localAlgo.pythonCode} 
                   onChange={(code) => handleChange('pythonCode', code)}
                   onSave={handleSave}
                 />
               </div>
            </div>
            
            {/* Right spacer for Agent Overlay if needed, but we use overlay now so content spans full width */}
        </div>
      </div>

      {/* Agent Sidebar (Right Overlay) - Fixed Z-Index to prevent layout shifting */}
      {showAgent && (
        <div className="absolute right-0 top-0 bottom-0 width-96 z-40 shadow-2xl animate-in slide-in-from-right-10 duration-300">
          <BuilderAgent 
            currentAlgo={localAlgo} 
            onUpdate={handleAgentUpdate} 
            onClose={() => setShowAgent(false)}
          />
        </div>
      )}
    </div>
  );
};