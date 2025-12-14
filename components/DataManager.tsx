import React, { useState, useRef, useEffect } from 'react';
import { Upload, PlusCircle, Database, Search, Loader2, ArrowRight, Code, Eye } from 'lucide-react';
import { SAMPLE_DATASETS } from '../data/sampleDatasets';
import { fetchAKShareData } from '../services/geminiService';

interface DataManagerProps {
  onInsertCode?: (code: string) => void;
  onDataLoaded?: (csvData: string, sourceName: string) => void;
  mode?: 'insert' | 'select';
}

// Extended AKShare Functions with Categories
const AKSHARE_FUNCTIONS = [
  // A股
  { 
    id: 'stock_zh_a_hist', 
    category: '股票',
    name: 'A股个股历史行情', 
    desc: '获取沪深京A股的日/周/月线数据', 
    params: [
      { name: 'symbol', label: '股票代码', default: '000001', hint: '6位数字代码' }, 
      { name: 'period', label: '周期', default: 'daily', options: ['daily', 'weekly', 'monthly'] }, 
      { name: 'start_date', label: '开始日期', default: '20230101' }, 
      { name: 'end_date', label: '结束日期', default: '20231231' }, 
      { name: 'adjust', label: '复权方式', default: 'qfq', options: ['qfq', 'hfq', ''] }
    ] 
  },
  {
    id: 'stock_zh_index_daily',
    category: '指数',
    name: 'A股指数历史行情',
    desc: '获取上证指数、深证成指等指数数据',
    params: [
      { name: 'symbol', label: '指数代码', default: 'sh000001', hint: 'sh000001 (上证), sz399001 (深证)' }
    ]
  },
  // 美股/港股
  { 
    id: 'stock_us_hist', 
    category: '外盘',
    name: '美股历史行情', 
    desc: '获取美股日线数据', 
    params: [
      { name: 'symbol', label: '股票代码', default: '105.AAPL', hint: '格式: 105.代码 (纳斯达克), 106.代码 (纽交所)' }, 
      { name: 'start_date', label: '开始日期', default: '20230101' },
      { name: 'end_date', label: '结束日期', default: '20231231' }
    ] 
  },
  { 
    id: 'stock_hk_hist', 
    category: '外盘',
    name: '港股历史行情', 
    desc: '获取港股日线数据', 
    params: [
      { name: 'symbol', label: '股票代码', default: '00700', hint: '5位数字代码' }, 
      { name: 'start_date', label: '开始日期', default: '20230101' }, 
      { name: 'adjust', label: '复权', default: 'qfq', options: ['qfq', 'hfq', ''] }
    ] 
  },
  // 期货
  {
    id: 'futures_zh_daily_sina',
    category: '期货',
    name: '国内期货日线 (新浪)',
    desc: '获取国内期货合约历史数据',
    params: [
      { name: 'symbol', label: '合约代码', default: 'rb2405', hint: '如 rb2405 (螺纹钢), m2405 (豆粕)' }
    ]
  },
  // 宏观
  {
    id: 'macro_china_gdp_yearly',
    category: '宏观',
    name: '中国GDP年率',
    desc: '获取中国年度GDP数据',
    params: []
  }
];

export const DataManager: React.FC<DataManagerProps> = ({ onInsertCode, onDataLoaded, mode = 'insert' }) => {
  const [activeTab, setActiveTab] = useState<'sample' | 'upload' | 'akshare'>('akshare');
  const [akSearch, setAkSearch] = useState('');
  const [selectedAkFunc, setSelectedAkFunc] = useState<typeof AKSHARE_FUNCTIONS[0] | null>(null);
  const [akParams, setAkParams] = useState<Record<string, string>>({});
  const [isFetchingAk, setIsFetchingAk] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to generate the preview code
  const getPreviewCode = () => {
    if (!selectedAkFunc) return '';
    const paramStr = selectedAkFunc.params.map(p => {
        const val = akParams[p.name] || '';
        return `${p.name}='${val}'`;
    }).join(', ');
    return `import akshare as ak\n\n# ${selectedAkFunc.desc}\ndf = ak.${selectedAkFunc.id}(${paramStr})\nprint(df.head())`;
  };

  const convertCsvToPython = (csvContent: string, varName: string = 'df') => {
    const lines = csvContent.trim().split('\n');
    if (lines.length === 0) return '';
    const headers = lines[0].split(',').map(h => h.trim());
    const dataDict: Record<string, any[]> = {};
    headers.forEach(h => dataDict[h] = []);
    const maxRows = 50;
    const dataLines = lines.slice(1, maxRows + 1);
    dataLines.forEach(line => {
      const values = line.split(',');
      headers.forEach((header, index) => {
        let val: any = values[index]?.trim();
        if (val && !isNaN(Number(val))) { val = Number(val); } else { val = `'${val}'`; }
        if (dataDict[header]) { dataDict[header].push(val); }
      });
    });
    let pyCode = `# 导入数据: ${varName}\n# 来源: ${selectedAkFunc?.name || 'CSV Upload'}\ndata = {\n`;
    headers.forEach(h => {
      const vals = dataDict[h]?.join(', ');
      const cleanVals = vals ? vals.replace(/''/g, "'") : "";
      pyCode += `    '${h}': [${cleanVals}],\n`;
    });
    pyCode += `}\n${varName} = pd.DataFrame(data)\n`;
    // Add date parsing if 'date' column exists
    if (headers.some(h => h.toLowerCase().includes('date'))) {
        const dateCol = headers.find(h => h.toLowerCase().includes('date'));
        pyCode += `${varName}['${dateCol}'] = pd.to_datetime(${varName}['${dateCol}'])\n`;
        pyCode += `${varName}.set_index('${dateCol}', inplace=True)\n`;
    }
    return pyCode;
  };

  const handleDataAction = (csvContent: string, sourceName: string) => {
    if (mode === 'insert' && onInsertCode) {
      const pyCode = convertCsvToPython(csvContent, 'df');
      onInsertCode(pyCode);
    } else if (mode === 'select' && onDataLoaded) {
      onDataLoaded(csvContent, sourceName);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) handleDataAction(text, file.name);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSampleInsert = (dataset: typeof SAMPLE_DATASETS[0]) => {
    handleDataAction(dataset.content, dataset.name);
  };

  const handleAkFetch = async () => {
    if (!selectedAkFunc) return;
    setIsFetchingAk(true);
    try {
      const paramStr = selectedAkFunc.params.map(p => {
          const val = akParams[p.name] || '';
          return `${p.name}='${val}'`;
      }).join(', ');
      
      const csvData = await fetchAKShareData(selectedAkFunc.id, paramStr);
      
      if (mode === 'insert' && onInsertCode) {
         const varName = `${selectedAkFunc.id}_df`;
         let pyCode = `# AKShare 接口调用: ak.${selectedAkFunc.id}(${paramStr})\n`;
         pyCode += convertCsvToPython(csvData, varName);
         onInsertCode(pyCode);
      } else if (mode === 'select' && onDataLoaded) {
         onDataLoaded(csvData, `AKShare: ${selectedAkFunc.name} (${akParams.symbol || ''})`);
      }
    } catch (e) {
      alert("获取 AKShare 数据失败，请检查网络或参数。");
    } finally {
      setIsFetchingAk(false);
    }
  };

  const filteredAkFunctions = AKSHARE_FUNCTIONS.filter(f => 
    f.name.toLowerCase().includes(akSearch.toLowerCase()) || 
    f.id.toLowerCase().includes(akSearch.toLowerCase()) ||
    f.category.includes(akSearch)
  );

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex flex-col h-full shadow-xl">
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-950 border-b border-zinc-800">
        <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
          <Database size={16} className={mode === 'select' ? 'text-green-500' : 'text-blue-500'} />
          {mode === 'select' ? '选择回测数据' : '数据中心'}
        </h3>
        <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
           <button onClick={() => setActiveTab('akshare')} className={`px-2 py-1 text-[10px] rounded transition-all ${activeTab === 'akshare' ? 'bg-orange-900/30 text-orange-200 border border-orange-800/50' : 'text-zinc-500'}`}>AKShare</button>
           <button onClick={() => setActiveTab('sample')} className={`px-2 py-1 text-[10px] rounded transition-all ${activeTab === 'sample' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>预制</button>
           <button onClick={() => setActiveTab('upload')} className={`px-2 py-1 text-[10px] rounded transition-all ${activeTab === 'upload' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>上传</button>
        </div>
      </div>

      <div className="p-4 overflow-y-auto max-h-[500px]">
        {activeTab === 'akshare' && (
          <div className="flex flex-col h-full">
            {!selectedAkFunc ? (
              <>
                <div className="relative mb-2">
                    <Search size={12} className="absolute left-2.5 top-2 text-zinc-500" />
                    <input 
                    type="text" placeholder="搜索股票、期货、指数..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded pl-8 pr-2 py-1.5 text-xs text-zinc-300 focus:border-orange-500 outline-none"
                    value={akSearch} onChange={(e) => setAkSearch(e.target.value)}
                    />
                </div>
                <div className="space-y-1">
                  {filteredAkFunctions.map(func => (
                    <div key={func.id} onClick={() => { setSelectedAkFunc(func); const p:any={}; func.params.forEach(x=>p[x.name]=x.default); setAkParams(p); }}
                      className="p-2 rounded border border-zinc-800 bg-zinc-950/30 hover:bg-zinc-900 cursor-pointer flex justify-between items-center group transition-colors">
                      <div className="flex flex-col">
                        <div className="text-xs font-bold text-zinc-200 group-hover:text-orange-300 flex items-center gap-2">
                            <span className="text-[10px] px-1 rounded bg-zinc-800 text-zinc-400">{func.category}</span>
                            {func.name}
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">{func.desc}</div>
                      </div>
                      <ArrowRight size={12} className="text-zinc-600 group-hover:text-orange-500" />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col h-full">
                <button onClick={() => setSelectedAkFunc(null)} className="mb-2 text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1">
                    <ArrowRight size={12} className="rotate-180" /> 返回列表
                </button>
                
                {/* Visual Builder Header */}
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-800">
                    <div className="p-1.5 bg-orange-900/20 rounded text-orange-500">
                        <Code size={16} />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-zinc-100">{selectedAkFunc.name}</h4>
                        <div className="text-[10px] text-zinc-500">可视化配置参数</div>
                    </div>
                </div>

                <div className="bg-zinc-950/50 p-3 rounded border border-zinc-800 mb-3 space-y-3">
                     {selectedAkFunc.params.length === 0 && <div className="text-xs text-zinc-500 italic">该接口无需参数</div>}
                     {selectedAkFunc.params.map(p => (
                       <div key={p.name}>
                         <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] font-bold text-zinc-400">{p.label}</label>
                            {p.hint && <span className="text-[10px] text-zinc-600">{p.hint}</span>}
                         </div>
                         {p.options ? (
                             <select 
                                value={akParams[p.name]} 
                                onChange={(e) => setAkParams(prev => ({ ...prev, [p.name]: e.target.value }))}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-orange-500"
                             >
                                 {p.options.map(opt => <option key={opt} value={opt}>{opt || '无'}</option>)}
                             </select>
                         ) : (
                             <input type="text" value={akParams[p.name] || ''} onChange={(e) => setAkParams(prev => ({ ...prev, [p.name]: e.target.value }))}
                               className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-orange-500 font-mono" />
                         )}
                       </div>
                     ))}
                </div>

                {/* Code Preview */}
                <div className="mb-3">
                    <div className="text-[10px] text-zinc-500 mb-1 flex items-center gap-1">
                        <Eye size={10} /> 预览生成的调用代码
                    </div>
                    <div className="bg-[#1e1e1e] border border-zinc-800 p-2 rounded text-[10px] font-mono text-zinc-400 whitespace-pre-wrap">
                        {getPreviewCode()}
                    </div>
                </div>

                <div className="mt-auto">
                    <button onClick={handleAkFetch} disabled={isFetchingAk}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded text-xs font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-900/20">
                    {isFetchingAk ? <Loader2 size={14} className="animate-spin" /> : (mode === 'select' ? '获取数据并加载' : '生成 Python 代码')}
                    </button>
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === 'sample' && (
             <div className="space-y-2">
            {SAMPLE_DATASETS.map(ds => (
              <div key={ds.id} onClick={() => handleSampleInsert(ds)} className="p-2 border border-zinc-800 rounded bg-zinc-950 hover:bg-zinc-900 cursor-pointer text-xs text-zinc-300 flex justify-between items-center group">
                <div>
                    <div className="font-bold">{ds.name}</div>
                    <div className="text-[10px] text-zinc-500 mt-1">{ds.description.substring(0, 30)}...</div>
                </div>
                <PlusCircle size={14} className="text-zinc-600 group-hover:text-white" />
              </div>
            ))}
          </div>
        )}
        {activeTab === 'upload' && (
           <div className="border border-dashed border-zinc-700 rounded p-8 text-center cursor-pointer hover:bg-zinc-900 transition-colors" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mx-auto text-zinc-500 mb-3" size={24} />
              <span className="text-xs text-zinc-400 block">点击上传 CSV 文件</span>
              <span className="text-[10px] text-zinc-600 block mt-1">支持 OHLCV 标准格式</span>
              <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
           </div>
        )}
      </div>
    </div>
  );
};