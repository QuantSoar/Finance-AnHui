
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
  date: string;
  type: 'buy' | 'sell';
  price: number;
  size?: number;
}

export interface BacktestResult {
  outputLog: string;
  metrics: {
    totalReturn: string;
    sharpeRatio: string;
    maxDrawdown: string;
    winRate: string;
  };
  equityCurve: { name: string; value: number }[];
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