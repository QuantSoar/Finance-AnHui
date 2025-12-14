
export enum AlgorithmCategory {
  BACKTEST = "策略回测",
  TECHNICAL = "技术分析",
  QUANT = "量化建模",
  RISK = "风险与定价",
  PORTFOLIO = "投资组合管理",
  ML = "人工智能金融",
  ECONOMICS = "经济与财税",
  UTILITY = "实用工具",
  CUSTOM = "我的模型"
}

export interface AlgorithmInfo {
  whatIsIt: string;
  howToUse: string;
  scenarios: string[];
  parameters: { name: string; desc: string }[];
  interpretation: string;
}

export interface FinancialAlgorithm {
  id: string;
  title: string;
  category: AlgorithmCategory;
  description: string;
  pythonCode: string;
  formula?: string;
  visualizationType: 'line' | 'bar' | 'scatter' | 'area' | 'none';
  parameters?: Record<string, number>;
  info?: AlgorithmInfo;
  isCustom?: boolean;
  createdAt?: number;
  lastModified?: number;
}

export interface ChartDataPoint {
  date: string;
  price: number;
  [key: string]: number | string;
}

// New Types for Backtesting
export interface TradeSignal {
  id?: string;
  date: string;
  type: 'buy' | 'sell';
  price: number;
  size?: number;
  pnl?: number;      // Profit/Loss amount
  pnlPct?: string;   // Profit/Loss percentage
  reason?: string;   // Entry/Exit reason
}

export interface BacktestResult {
  outputLog: string;
  metrics: {
    totalReturn: string;
    annualizedReturn: string; // New
    sharpeRatio: string;
    sortinoRatio: string;     // New
    volatility: string;       // New
    maxDrawdown: string;
    winRate: string;
    tradeCount: number;       // New
    alpha?: string;           // New
    beta?: string;            // New
  };
  equityCurve: { name: string; value: number }[];
  drawdownCurve: { name: string; value: number }[]; // New: For underwater plot
  dailyReturns: { name: string; value: number }[];  // New: For volatility analysis
  tradeSignals: TradeSignal[];
}

export interface FactorAnalysisResult {
  icMean: string;
  icStd: string;
  ir: string;
  turnover: string;
  icSeries: { date: string; value: number; cumulative: number }[];
  quantiles: { name: string; value: number; fill: string }[];
}

export interface AgentResponse {
  reply: string;
  updates?: Partial<FinancialAlgorithm>;
}

// Dify Configuration Types
export interface DifyConfig {
  apiKey: string;
  baseUrl: string; // e.g., https://api.dify.ai/v1
}

export type AgentMode = 'gemini_direct' | 'dify_agent';

// --- WORKFLOW STUDIO TYPES ---
export type NodeType = 'start' | 'data_loader' | 'code_processor' | 'llm_analyzer' | 'visualizer' | 'router';

export interface WorkflowPort {
  id: string;
  type: 'source' | 'target';
  label?: string;
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: {
    label: string;
    status: 'idle' | 'running' | 'success' | 'error';
    // Configuration Inputs
    config: Record<string, any>;
    // Execution Results
    output?: any;
    logs?: string[];
  };
  inputs: WorkflowPort[];
  outputs: WorkflowPort[];
}

export interface WorkflowEdge {
  id: string;
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
  animated?: boolean;
}
