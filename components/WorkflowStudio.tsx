
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Workflow, Play, Plus, X, Box, Database, Code, 
  Bot, Split, Save, Trash2, ArrowRight, Loader2, 
  Zap, Settings, MousePointer2, Terminal, PieChart,
  Move, Link as LinkIcon, FileText, CheckCircle2, AlertCircle,
  ZoomIn, ZoomOut, Maximize, FolderUp, Globe, Grid, MoreVertical,
  Layout, Table, FileJson
} from 'lucide-react';
import { WorkflowNode, WorkflowEdge, NodeType, WorkflowPort, AlgorithmCategory } from '../types';
import { ChartRenderer } from './ChartRenderer';
import { ALGORITHMS } from '../data/algorithms';

// --- NODE DEFINITIONS & TEMPLATES ---

const NODE_TEMPLATES: Record<NodeType, Partial<WorkflowNode>> = {
  start: {
    type: 'start',
    data: { label: '开始 (Start)', status: 'idle', config: {} },
    inputs: [],
    outputs: [{ id: 'out', type: 'source', label: 'Flow' }]
  },
  data_loader: {
    type: 'data_loader',
    data: { 
      label: '数据加载器 (Loader)', 
      status: 'idle', 
      config: { 
        sourceType: 'mock', // akshare, csv, api, mock
        symbol: '600519.SH', 
        api_url: '' 
      } 
    },
    inputs: [{ id: 'in', type: 'target', label: 'Trigger' }],
    outputs: [{ id: 'data', type: 'source', label: 'DataFrame' }]
  },
  code_processor: {
    type: 'code_processor',
    data: { 
      label: '策略处理器 (Strategy)', 
      status: 'idle', 
      config: { 
        code: `# 默认策略: 计算 5日均线\ndef process(df):\n    df['ma5'] = df['close'].rolling(5).mean()\n    return df.dropna()` 
      } 
    },
    inputs: [{ id: 'in_data', type: 'target', label: 'Data' }],
    outputs: [{ id: 'out_result', type: 'source', label: 'Result' }]
  },
  llm_analyzer: {
    type: 'llm_analyzer',
    data: { 
      label: 'AI 分析师 (Agent)', 
      status: 'idle', 
      config: { 
        model: 'gemini-2.5-flash',
        temperature: 0.7,
        systemInstruction: '你是一位专业的量化金融分析师。',
        prompt: '请分析以下数据并给出投资建议：\n{{input_data}}',
      } 
    },
    inputs: [{ id: 'in_context', type: 'target', label: 'Context' }],
    outputs: [{ id: 'out_advice', type: 'source', label: 'Advice' }]
  },
  visualizer: {
    type: 'visualizer',
    data: { label: '结果可视化 (Viz)', status: 'idle', config: { type: 'line' } },
    inputs: [{ id: 'in_viz', type: 'target', label: 'Data' }],
    outputs: []
  },
  router: {
    type: 'router',
    data: { label: '条件网关 (Router)', status: 'idle', config: { condition: 'value > 0' } },
    inputs: [{ id: 'in_val', type: 'target', label: 'Value' }],
    outputs: [{ id: 'true', type: 'source', label: 'True' }, { id: 'false', type: 'source', label: 'False' }]
  }
};

const getNodeColor = (type: NodeType) => {
  switch (type) {
    case 'start': return 'border-green-500 bg-green-950/80';
    case 'data_loader': return 'border-orange-500 bg-orange-950/80';
    case 'code_processor': return 'border-blue-500 bg-blue-950/80';
    case 'llm_analyzer': return 'border-purple-500 bg-purple-950/80';
    case 'visualizer': return 'border-pink-500 bg-pink-950/80';
    case 'router': return 'border-yellow-500 bg-yellow-950/80';
    default: return 'border-zinc-700 bg-zinc-900';
  }
};

const getNodeIcon = (type: NodeType) => {
  switch (type) {
    case 'start': return Play;
    case 'data_loader': return Database;
    case 'code_processor': return Code;
    case 'llm_analyzer': return Bot;
    case 'visualizer': return PieChart;
    case 'router': return Split;
    default: return Box;
  }
};

export const WorkflowStudio: React.FC = () => {
  // --- STATE ---
  const [nodes, setNodes] = useState<WorkflowNode[]>([
    { ...NODE_TEMPLATES.start, id: 'start_1', position: { x: 50, y: 300 } } as WorkflowNode,
    { ...NODE_TEMPLATES.data_loader, id: 'data_1', position: { x: 300, y: 300 } } as WorkflowNode,
    { ...NODE_TEMPLATES.llm_analyzer, id: 'ai_1', position: { x: 600, y: 300 } } as WorkflowNode
  ]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([
    { id: 'e1', source: 'start_1', sourceHandle: 'out', target: 'data_1', targetHandle: 'in' },
    { id: 'e2', source: 'data_1', sourceHandle: 'data', target: 'ai_1', targetHandle: 'in_context' }
  ]);

  // Viewport State
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPosition, setLastPanPosition] = useState({ x: 0, y: 0 });

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, canvasX: number, canvasY: number } | null>(null);
  const [inspectorTab, setInspectorTab] = useState<'config' | 'result'>('config');

  const [isRunning, setIsRunning] = useState(false);
  const [globalLogs, setGlobalLogs] = useState<string[]>([]);
  
  // Dragging Nodes & Edges
  const [nodeDragging, setNodeDragging] = useState<{ id: string, startX: number, startY: number, nodeStartX: number, nodeStartY: number } | null>(null);
  const [edgeDraft, setEdgeDraft] = useState<{ sourceNode: string, sourceHandle: string, currX: number, currY: number } | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;

  // --- HELPERS ---
  const screenToCanvas = (screenX: number, screenY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (screenX - rect.left - viewport.x) / viewport.zoom,
      y: (screenY - rect.top - viewport.y) / viewport.zoom
    };
  };

  const addNode = (type: NodeType, pos?: { x: number, y: number }) => {
    const template = NODE_TEMPLATES[type];
    const id = `${type}_${Date.now()}`;
    
    let position = { x: 0, y: 0 };
    if (pos) {
      position = pos;
    } else if (canvasRef.current) {
         const rect = canvasRef.current.getBoundingClientRect();
         position = {
           x: (rect.width / 2 - viewport.x) / viewport.zoom - 96,
           y: (rect.height / 2 - viewport.y) / viewport.zoom - 40
         };
    }

    const newNode: WorkflowNode = {
      ...template,
      id,
      position: { x: position.x + (Math.random()*20-10), y: position.y + (Math.random()*20-10) },
      data: { ...template.data, label: template.data!.label, status: 'idle' }
    } as WorkflowNode;
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(id);
    setInspectorTab('config');
    setContextMenu(null);
  };

  const updateNodeConfig = (id: string, key: string, value: any) => {
    setNodes(prev => prev.map(n => n.id === id ? { 
      ...n, 
      data: { ...n.data, config: { ...n.data.config, [key]: value } } 
    } : n));
  };

  const deleteNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setEdges(prev => prev.filter(e => e.source !== id && e.target !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  const deleteEdge = (id: string) => {
    setEdges(prev => prev.filter(e => e.id !== id));
    if (selectedEdgeId === id) setSelectedEdgeId(null);
  };

  // --- EVENTS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) deleteNode(selectedNodeId);
        if (selectedEdgeId) deleteEdge(selectedEdgeId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, selectedEdgeId]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    setContextMenu({ x: e.clientX, y: e.clientY, canvasX: canvasPos.x, canvasY: canvasPos.y });
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
     if (contextMenu) setContextMenu(null);
     if (e.button === 1 || e.button === 0) {
        setIsPanning(true);
        setLastPanPosition({ x: e.clientX, y: e.clientY });
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
     }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
     if (isPanning) {
        const dx = e.clientX - lastPanPosition.x;
        const dy = e.clientY - lastPanPosition.y;
        setViewport(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
        setLastPanPosition({ x: e.clientX, y: e.clientY });
        return;
     }
     const canvasPos = screenToCanvas(e.clientX, e.clientY);
     if (nodeDragging) {
       setNodes(prev => prev.map(n => n.id === nodeDragging.id ? { 
         ...n, position: { x: nodeDragging.nodeStartX + (e.clientX - nodeDragging.startX)/viewport.zoom, y: nodeDragging.nodeStartY + (e.clientY - nodeDragging.startY)/viewport.zoom } 
       } : n));
     }
     if (edgeDraft) setEdgeDraft(prev => prev ? { ...prev, currX: canvasPos.x, currY: canvasPos.y } : null);
  };

  const handleCanvasMouseUp = () => { setIsPanning(false); setNodeDragging(null); setEdgeDraft(null); };

  const handleMouseDownNode = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); if (contextMenu) setContextMenu(null); if (e.button !== 0) return;
    const node = nodes.find(n => n.id === id);
    if (node) {
      setNodeDragging({ id, startX: e.clientX, startY: e.clientY, nodeStartX: node.position.x, nodeStartY: node.position.y });
      setSelectedNodeId(id);
      setSelectedEdgeId(null);
      // Automatically switch to result tab if node has data, else config
      setInspectorTab(node.data.status === 'success' ? 'result' : 'config');
    }
  };

  const handleMouseDownHandle = (e: React.MouseEvent, nodeId: string, handleId: string) => {
    e.stopPropagation(); if (e.button !== 0) return;
    const { x, y } = screenToCanvas(e.clientX, e.clientY);
    setEdgeDraft({ sourceNode: nodeId, sourceHandle: handleId, currX: x, currY: y });
  };

  const handleMouseUpHandle = (e: React.MouseEvent, targetNodeId: string, targetHandleId: string) => {
    e.stopPropagation();
    if (edgeDraft) {
      if (edgeDraft.sourceNode === targetNodeId) return; 
      const exists = edges.some(e => e.source === edgeDraft.sourceNode && e.sourceHandle === edgeDraft.sourceHandle && e.target === targetNodeId && e.targetHandle === targetHandleId);
      if (!exists) setEdges(prev => [...prev, { id: `e_${Date.now()}`, source: edgeDraft.sourceNode, sourceHandle: edgeDraft.sourceHandle, target: targetNodeId, targetHandle: targetHandleId }]);
      setEdgeDraft(null);
    }
  };

  // --- EXECUTION ENGINE ---
  const runWorkflow = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setGlobalLogs(['>>> 工作流启动...']);
    setNodes(prev => prev.map(n => ({ ...n, data: { ...n.data, status: 'idle', output: undefined } })));

    const startNodes = nodes.filter(n => n.type === 'start');
    if (startNodes.length === 0) {
      setGlobalLogs(prev => [...prev, '❌ 错误: 画布中缺少 "开始" 节点']);
      setIsRunning(false);
      return;
    }

    const queue = [...startNodes];
    const visited = new Set<string>();
    const log = (msg: string) => setGlobalLogs(prev => [...prev, msg]);

    const processQueue = async () => {
      if (queue.length === 0) {
        log('>>> ✅ 工作流执行完毕。');
        setIsRunning(false);
        return;
      }
      const currentNode = queue.shift()!;
      setNodes(prev => prev.map(n => n.id === currentNode.id ? { ...n, data: { ...n.data, status: 'running' } } : n));
      
      try {
        log(`▶ 执行: ${currentNode.data.label}`);
        await new Promise(r => setTimeout(r, 600)); 

        const incomingEdges = edges.filter(e => e.target === currentNode.id);
        const inputData: Record<string, any> = {};
        incomingEdges.forEach(e => {
          const sourceNode = nodes.find(n => n.id === e.source);
          if (sourceNode && sourceNode.data.output) inputData[e.targetHandle] = sourceNode.data.output;
        });

        let output: any = "Done";
        // --- SIMULATION LOGIC ---
        if (currentNode.type === 'data_loader') {
           const src = currentNode.data.config.sourceType;
           log(`  📥 获取数据 [${src}]...`);
           // Generate realistic mock OHLCV + Value data
           const mockData = [];
           let price = 100;
           for(let i=0; i<50; i++) {
             price = price + (Math.random() - 0.5) * 5;
             mockData.push({ 
               date: `2023-01-${(i+1).toString().padStart(2,'0')}`, 
               price: Number(price.toFixed(2)), 
               volume: Math.floor(Math.random() * 10000),
               value: Number(price.toFixed(2)) // Generic value for simple charts
             });
           }
           output = mockData;
        } else if (currentNode.type === 'code_processor') {
           log('  🐍 策略计算中...');
           // Pass-through data but add a "signal" or "ma" field
           const sourceData = inputData['in_data'] || [];
           if (Array.isArray(sourceData)) {
              output = sourceData.map(d => ({
                ...d,
                ma5: d.price * (1 + (Math.random()-0.5)*0.05), // Mock MA
                signal: Math.random() > 0.8 ? 1 : 0
              }));
           } else {
              output = { result: "No Data Input", processed: true };
           }
        } else if (currentNode.type === 'llm_analyzer') {
           log('  🤖 AI 推理中...');
           await new Promise(r => setTimeout(r, 800));
           output = `【AI 投资建议】\n基于输入数据的趋势分析：\n1. 市场呈现震荡上行趋势，波动率适中。\n2. MA5 指标显示短期买入信号。\n建议：保持 60% 仓位，设置止损位 98.5。`;
        } else if (currentNode.type === 'visualizer') {
           log('  📊 渲染可视化...');
           output = inputData['in_viz']; 
        } else if (currentNode.type === 'router') {
           log('  🔀 路由计算...');
           output = Math.random() > 0.5;
        }

        setNodes(prev => prev.map(n => n.id === currentNode.id ? { ...n, data: { ...n.data, status: 'success', output } } : n));
        
        let outgoingEdges = edges.filter(e => e.source === currentNode.id);
        if (currentNode.type === 'router') {
           const portId = output ? 'true' : 'false';
           outgoingEdges = outgoingEdges.filter(e => e.sourceHandle === portId);
        }

        const nextNodeIds = outgoingEdges.map(e => e.target);
        const nextNodes = nodes.filter(n => nextNodeIds.includes(n.id));
        queue.push(...nextNodes);
        
        setTimeout(processQueue, 100);
      } catch (err) {
        log(`❌ 失败: ${currentNode.id}`);
        setNodes(prev => prev.map(n => n.id === currentNode.id ? { ...n, data: { ...n.data, status: 'error' } } : n));
        setIsRunning(false);
      }
    };
    processQueue();
  };

  // --- RENDERERS ---
  const renderEdge = (edge: WorkflowEdge) => {
    const sNode = nodes.find(n => n.id === edge.source);
    const tNode = nodes.find(n => n.id === edge.target);
    if (!sNode || !tNode) return null;
    const sIndex = sNode.outputs.findIndex(p => p.id === edge.sourceHandle);
    const tIndex = tNode.inputs.findIndex(p => p.id === edge.targetHandle);
    const sX = sNode.position.x + 192; const sY = sNode.position.y + 40 + 12 + (sIndex * 24); 
    const tX = tNode.position.x; const tY = tNode.position.y + 40 + 12 + (tIndex * 24);
    const controlDist = Math.max(Math.abs(tX - sX) * 0.5, 50);
    const isActive = sNode.data.status === 'success' || sNode.data.status === 'running';
    const isSelected = selectedEdgeId === edge.id;

    return (
      <g key={edge.id} onClick={(e) => { e.stopPropagation(); setSelectedEdgeId(edge.id); setSelectedNodeId(null); }} className="cursor-pointer group">
        <path d={`M ${sX} ${sY} C ${sX + controlDist} ${sY}, ${tX - controlDist} ${tY}, ${tX} ${tY}`} stroke="transparent" strokeWidth={15 / viewport.zoom} fill="none" />
        <path d={`M ${sX} ${sY} C ${sX + controlDist} ${sY}, ${tX - controlDist} ${tY}, ${tX} ${tY}`} stroke={isSelected ? '#fbbf24' : (isActive ? '#3b82f6' : '#52525b')} strokeWidth={isSelected ? (4 / viewport.zoom) : (2 / viewport.zoom)} fill="none" className={`transition-all ${isActive ? "animate-pulse" : "group-hover:stroke-zinc-400"}`} />
      </g>
    );
  };

  return (
    <div className="flex h-full bg-zinc-950 text-zinc-200 overflow-hidden" onContextMenu={(e) => e.preventDefault()}>
      
      {/* 1. SIDEBAR: COMPONENT LIBRARY */}
      <div className="w-64 border-r border-zinc-800 bg-zinc-900/90 flex flex-col shrink-0 z-20 backdrop-blur-sm">
        <div className="p-4 border-b border-zinc-800">
          <h2 className="text-sm font-bold flex items-center gap-2 text-white">
            <Workflow size={16} className="text-purple-500" /> 智能体组件库
          </h2>
        </div>
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {[
            { cat: '基础', items: ['start', 'router'] },
            { cat: '数据处理', items: ['data_loader', 'code_processor'] },
            { cat: 'AI 智能体', items: ['llm_analyzer'] },
            { cat: '输出', items: ['visualizer'] }
          ].map(group => (
            <div key={group.cat}>
              <div className="text-[10px] font-bold text-zinc-500 uppercase mb-2">{group.cat}</div>
              <div className="space-y-2">
                {group.items.map(type => (
                  <button key={type} onClick={() => addNode(type as NodeType)} className="w-full flex items-center gap-3 p-2.5 rounded border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 hover:border-zinc-600 transition-all group text-left">
                     <div className={`p-1.5 rounded bg-opacity-20 ${getNodeColor(type as NodeType).split(' ')[1].replace('/80','')}`}>
                       {React.createElement(getNodeIcon(type as NodeType), { size: 14 })}
                     </div>
                     <div className="text-xs font-medium text-zinc-300">{NODE_TEMPLATES[type as NodeType].data?.label.split('(')[0]}</div>
                     <Plus size={12} className="ml-auto opacity-0 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. INFINITE CANVAS AREA */}
      <div className="flex-1 flex flex-col relative h-full bg-[#09090b]">
        <div className="absolute top-4 left-4 right-4 z-20 flex justify-between pointer-events-none px-4">
           <div className="bg-zinc-900/90 backdrop-blur border border-zinc-700 rounded-lg p-1.5 flex gap-1 pointer-events-auto shadow-2xl">
             <button onClick={() => { setNodes([]); setEdges([]); }} className="p-2 hover:bg-zinc-800 rounded text-zinc-400 hover:text-red-400" title="清空"><Trash2 size={18} /></button>
             <div className="w-px h-8 bg-zinc-800 mx-1 self-center"></div>
             <button onClick={() => setViewport(prev => ({ ...prev, zoom: Math.min(prev.zoom + 0.1, 3) }))} className="p-2 hover:bg-zinc-800 rounded text-zinc-400" title="放大"><ZoomIn size={18} /></button>
             <button onClick={() => setViewport(prev => ({ ...prev, zoom: Math.max(prev.zoom - 0.1, 0.2) }))} className="p-2 hover:bg-zinc-800 rounded text-zinc-400" title="缩小"><ZoomOut size={18} /></button>
             <button onClick={() => setViewport({ x: 0, y: 0, zoom: 1 })} className="p-2 hover:bg-zinc-800 rounded text-zinc-400" title="复位"><Maximize size={18} /></button>
           </div>
           <button onClick={runWorkflow} disabled={isRunning} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-green-900/30 flex items-center gap-2 pointer-events-auto transition-all disabled:opacity-50 hover:scale-105 active:scale-95">
             {isRunning ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} fill="currentColor" />}
             {isRunning ? '执行中...' : '运行工作流'}
           </button>
        </div>

        <div ref={canvasRef} className={`flex-1 relative overflow-hidden ${isPanning ? 'cursor-grabbing' : 'cursor-grab'} outline-none`}
          onMouseDown={handleCanvasMouseDown} onMouseMove={handleCanvasMouseMove} onMouseUp={handleCanvasMouseUp} onMouseLeave={handleCanvasMouseUp} onContextMenu={handleContextMenu} onWheel={(e) => {
            if (e.ctrlKey || e.metaKey) setViewport(prev => ({ ...prev, zoom: Math.min(Math.max(prev.zoom - e.deltaY * 0.001, 0.2), 3) }));
            else setViewport(prev => ({ ...prev, x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
          }} tabIndex={0}> 
           <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(#52525b 1px, transparent 1px)', backgroundSize: `${20 * viewport.zoom}px ${20 * viewport.zoom}px`, backgroundPosition: `${viewport.x}px ${viewport.y}px` }}></div>
           <div className="absolute left-0 top-0 w-full h-full origin-top-left pointer-events-none" style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})` }}>
             <svg className="absolute overflow-visible w-full h-full pointer-events-auto">
                {edges.map(renderEdge)}
                {edgeDraft && (() => {
                    const sNode = nodes.find(n => n.id === edgeDraft.sourceNode);
                    if (!sNode) return null;
                    const sIndex = sNode.outputs.findIndex(p => p.id === edgeDraft.sourceHandle);
                    const sX = sNode.position.x + 192; const sY = sNode.position.y + 40 + 12 + (sIndex * 24);
                    return <path d={`M ${sX} ${sY} L ${edgeDraft.currX} ${edgeDraft.currY}`} stroke="#eab308" strokeWidth={2/viewport.zoom} strokeDasharray={`${5/viewport.zoom},${5/viewport.zoom}`} fill="none" />;
                })()}
             </svg>
             {nodes.map(node => {
               const Icon = getNodeIcon(node.type);
               const isSelected = selectedNodeId === node.id;
               const statusColor = node.data.status === 'running' ? 'ring-2 ring-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]' : node.data.status === 'success' ? 'ring-1 ring-green-500' : node.data.status === 'error' ? 'ring-1 ring-red-500' : isSelected ? 'ring-1 ring-white' : '';
               return (
                 <div key={node.id} onMouseDown={(e) => handleMouseDownNode(e, node.id)} className={`absolute w-48 rounded-xl shadow-2xl flex flex-col pointer-events-auto select-none group transition-shadow ${getNodeColor(node.type)} ${statusColor} backdrop-blur-md`} style={{ left: node.position.x, top: node.position.y }}>
                   <div className="h-10 flex items-center px-3 border-b border-white/10 gap-2">
                     <Icon size={14} className="opacity-70" />
                     <span className="text-xs font-bold text-white/90 truncate flex-1">{node.data.label}</span>
                     {node.data.status === 'success' && <CheckCircle2 size={12} className="text-green-500" />}
                     {node.data.status === 'error' && <AlertCircle size={12} className="text-red-500" />}
                   </div>
                   <div className="p-3 relative min-h-[40px] flex flex-col gap-2">
                      {node.inputs.map((port) => (
                        <div key={port.id} className="relative flex items-center h-6">
                          <div className="absolute -left-4 w-3 h-3 rounded-full border border-zinc-500 bg-zinc-900 hover:bg-blue-500 hover:border-white transition-colors cursor-crosshair z-20 pointer-events-auto" onMouseUp={(e) => handleMouseUpHandle(e, node.id, port.id)} />
                          <span className="text-[10px] text-zinc-400 ml-1">{port.label}</span>
                        </div>
                      ))}
                      {node.outputs.map((port) => (
                        <div key={port.id} className="relative flex items-center justify-end h-6">
                          <span className="text-[10px] text-zinc-400 mr-1">{port.label}</span>
                          <div className="absolute -right-4 w-3 h-3 rounded-full border border-zinc-500 bg-zinc-900 hover:bg-orange-500 hover:border-white transition-colors cursor-crosshair z-20 pointer-events-auto" onMouseDown={(e) => handleMouseDownHandle(e, node.id, port.id)} />
                        </div>
                      ))}
                      {node.data.output && node.type === 'visualizer' && (
                         <div className="mt-1 h-24 bg-black/40 rounded border border-white/5 flex items-center justify-center overflow-hidden">
                           {Array.isArray(node.data.output) ? <div className="w-[133%] h-[133%] transform scale-75 origin-top-left"><ChartRenderer customData={node.data.output} customType="line" /></div> : <PieChart size={16} className="text-zinc-600" />}
                         </div>
                      )}
                   </div>
                 </div>
               );
             })}
           </div>
           {contextMenu && (
             <div className="fixed bg-zinc-900 border border-zinc-700 shadow-xl rounded-lg py-1 z-50 w-40 flex flex-col" style={{ left: contextMenu.x, top: contextMenu.y }} onMouseDown={(e) => e.stopPropagation()}>
                <div className="px-3 py-1.5 text-[10px] text-zinc-500 font-bold uppercase border-b border-zinc-800 mb-1">添加节点</div>
                {Object.keys(NODE_TEMPLATES).map(type => (
                  <button key={type} onClick={() => addNode(type as NodeType, { x: contextMenu.canvasX, y: contextMenu.canvasY })} className="text-left px-3 py-2 text-xs text-zinc-300 hover:bg-blue-600 hover:text-white transition-colors">
                     {NODE_TEMPLATES[type as NodeType].data?.label}
                  </button>
                ))}
             </div>
           )}
        </div>

        {/* Logs */}
        <div className="h-40 bg-[#09090b] border-t border-zinc-800 flex flex-col shrink-0 z-20">
           <div className="flex items-center px-4 py-2 border-b border-zinc-800 bg-zinc-900/50">
              <Terminal size={14} className="text-zinc-400 mr-2" />
              <span className="text-xs font-bold text-zinc-300">系统日志</span>
           </div>
           <div className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-1">
              {globalLogs.map((log, i) => <div key={i} className={`pl-2 border-l-2 ${log.includes('❌') ? 'border-red-500 text-red-400' : 'border-zinc-700 text-zinc-400'}`}>{log}</div>)}
           </div>
        </div>
      </div>

      {/* 3. INSPECTOR SIDEBAR (ENHANCED) */}
      {selectedNode ? (
        <div className="w-80 border-l border-zinc-800 bg-zinc-900/80 backdrop-blur-sm flex flex-col shrink-0 z-20 animate-in slide-in-from-right-10">
           {/* Tab Switcher */}
           <div className="flex border-b border-zinc-800">
             <button onClick={() => setInspectorTab('config')} className={`flex-1 py-3 text-xs font-bold transition-colors ${inspectorTab === 'config' ? 'bg-zinc-800 text-white border-b-2 border-blue-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
               <Settings size={14} className="inline mr-1" /> 属性配置
             </button>
             {selectedNode.data.output && (
               <button onClick={() => setInspectorTab('result')} className={`flex-1 py-3 text-xs font-bold transition-colors ${inspectorTab === 'result' ? 'bg-zinc-800 text-white border-b-2 border-green-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
                 <Layout size={14} className="inline mr-1" /> 运行结果
               </button>
             )}
             <button onClick={() => setSelectedNodeId(null)} className="px-3 text-zinc-500 hover:text-white"><X size={14} /></button>
           </div>
           
           <div className="flex-1 overflow-y-auto">
              {/* TAB: CONFIG */}
              {inspectorTab === 'config' && (
                <div className="p-4 space-y-6">
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">节点名称</label>
                    <input type="text" value={selectedNode.data.label} onChange={(e) => setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, label: e.target.value } } : n))} className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-2 text-xs text-zinc-200 outline-none focus:border-blue-500" />
                  </div>

                  {/* DATA LOADER CONFIG */}
                  {selectedNode.type === 'data_loader' && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-orange-400 uppercase block mb-1">数据源类型</label>
                        <select value={selectedNode.data.config.sourceType} onChange={(e) => updateNodeConfig(selectedNode.id, 'sourceType', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-2 text-xs text-zinc-300">
                          <option value="akshare">AKShare API</option>
                          <option value="csv">本地 CSV 上传</option>
                          <option value="mock">模拟随机数据</option>
                        </select>
                      </div>
                      {selectedNode.data.config.sourceType === 'akshare' && (
                        <div>
                           <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">股票代码</label>
                           <input type="text" value={selectedNode.data.config.symbol} onChange={(e) => updateNodeConfig(selectedNode.id, 'symbol', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-2 text-xs text-zinc-200 focus:border-orange-500 outline-none" placeholder="600519.SH" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* STRATEGY CONFIG */}
                  {selectedNode.type === 'code_processor' && (
                    <div className="space-y-3">
                       <div>
                          <label className="text-xs font-bold text-blue-400 uppercase block mb-1 flex items-center gap-1"><FolderUp size={12} /> 加载预置策略</label>
                          <select 
                             onChange={(e) => {
                               const algo = ALGORITHMS.find(a => a.id === e.target.value);
                               if(algo) updateNodeConfig(selectedNode.id, 'code', algo.pythonCode);
                             }}
                             className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-2 text-xs text-zinc-300 mb-2"
                           >
                             <option value="">-- 选择策略库 --</option>
                             {ALGORITHMS.filter(a => a.category === AlgorithmCategory.BACKTEST).map(a => (
                               <option key={a.id} value={a.id}>{a.title}</option>
                             ))}
                           </select>
                       </div>
                       <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Python 代码</label>
                        <textarea value={selectedNode.data.config.code} onChange={(e) => updateNodeConfig(selectedNode.id, 'code', e.target.value)} className="w-full h-64 bg-zinc-950 border border-zinc-800 rounded px-2 py-2 text-xs font-mono text-zinc-300 focus:border-blue-500 outline-none resize-none" />
                      </div>
                    </div>
                  )}

                  {/* LLM CONFIG */}
                  {selectedNode.type === 'llm_analyzer' && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-purple-400 uppercase block mb-1">模型选择 (Model)</label>
                        <select value={selectedNode.data.config.model} onChange={(e) => updateNodeConfig(selectedNode.id, 'model', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-2 text-xs text-zinc-300">
                          <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast)</option>
                          <option value="gemini-pro">Gemini Pro (Advanced)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">温度 (Temperature): {selectedNode.data.config.temperature}</label>
                        <input type="range" min="0" max="1" step="0.1" value={selectedNode.data.config.temperature} onChange={(e) => updateNodeConfig(selectedNode.id, 'temperature', parseFloat(e.target.value))} className="w-full accent-purple-500" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">System Instruction</label>
                        <input type="text" value={selectedNode.data.config.systemInstruction} onChange={(e) => updateNodeConfig(selectedNode.id, 'systemInstruction', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-2 text-xs text-zinc-300" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Prompt Template</label>
                        <textarea value={selectedNode.data.config.prompt} onChange={(e) => updateNodeConfig(selectedNode.id, 'prompt', e.target.value)} className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded px-2 py-2 text-xs text-zinc-300 resize-none" />
                      </div>
                    </div>
                  )}

                  <button onClick={() => deleteNode(selectedNode.id)} className="w-full py-2 bg-red-900/20 text-red-400 rounded border border-red-900/50 hover:bg-red-900/40 text-xs font-bold flex items-center justify-center gap-2">
                    <Trash2 size={14} /> 删除节点
                  </button>
                </div>
              )}

              {/* TAB: RESULT */}
              {inspectorTab === 'result' && selectedNode.data.output && (
                <div className="p-4 space-y-4">
                  {/* Visualization for Arrays */}
                  {Array.isArray(selectedNode.data.output) && (
                     <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
                        <div className="text-xs font-bold text-zinc-400 mb-2 flex items-center gap-1"><PieChart size={12}/> 图表概览</div>
                        <ChartRenderer customData={selectedNode.data.output} customType="line" />
                     </div>
                  )}

                  {/* Data Table / JSON View */}
                  <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
                     <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-400 flex items-center gap-1"><FileJson size={12}/> 输出数据</span>
                        <span className="text-[10px] text-zinc-600 font-mono">
                          {Array.isArray(selectedNode.data.output) ? `Array[${selectedNode.data.output.length}]` : typeof selectedNode.data.output}
                        </span>
                     </div>
                     <div className="p-3 max-h-[400px] overflow-auto">
                        {typeof selectedNode.data.output === 'object' ? (
                          <pre className="text-[10px] font-mono text-green-300 whitespace-pre-wrap">
                            {JSON.stringify(selectedNode.data.output, null, 2)}
                          </pre>
                        ) : (
                          <div className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                            {String(selectedNode.data.output)}
                          </div>
                        )}
                     </div>
                  </div>
                </div>
              )}
           </div>
        </div>
      ) : (
        <div className="w-80 border-l border-zinc-800 bg-zinc-900/50 flex flex-col items-center justify-center text-zinc-600 p-8 text-center shrink-0">
           <MousePointer2 size={48} className="mb-4 opacity-20" />
           <p className="text-sm font-medium">未选中节点</p>
           <p className="text-xs mt-2 opacity-60 max-w-[200px]">点击节点或连线进行操作。选中已运行的节点可查看详细结果图表。</p>
        </div>
      )}
    </div>
  );
};
