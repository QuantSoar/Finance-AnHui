import { AlgorithmCategory, FinancialAlgorithm } from '../types';

const generateId = (prefix: string, index: number) => `${prefix}_${index.toString().padStart(3, '0')}`;

// Helper to create algorithms easily
const createAlgo = (
  id: string, title: string, category: AlgorithmCategory, 
  desc: string, code: string, 
  vizType: 'line'|'bar'|'area'|'scatter'|'none' = 'line',
  infoOverride: any = {}
): FinancialAlgorithm => ({
  id, title, category, description: desc, pythonCode: code, visualizationType: vizType,
  info: {
    whatIsIt: desc,
    howToUse: "点击运行即可查看模拟结果。在实际交易中，需替换为真实数据源。",
    scenarios: [category],
    parameters: [],
    interpretation: "请参考图表输出。",
    ...infoOverride
  }
});

// ============================================================================
// 1. Backtesting Strategies (10+ Strategies)
// ============================================================================
const strategies = [
  createAlgo('bt_sma_cross', '双均线趋势策略 (Golden Cross)', AlgorithmCategory.BACKTEST, 
    '经典的趋势跟踪策略。当短期均线(MA10)上穿长期均线(MA30)时买入，下穿时卖出。',
    `import backtrader as bt\nclass SmaCross(bt.Strategy):\n    params = (('pfast', 10), ('pslow', 30),)\n    def __init__(self):\n        self.crossover = bt.ind.CrossOver(bt.ind.SMA(period=self.params.pfast), bt.ind.SMA(period=self.params.pslow))\n    def next(self):\n        if not self.position:\n            if self.crossover > 0: self.buy()\n        elif self.crossover < 0: self.close()\ncerebro = bt.Cerebro()\ncerebro.addstrategy(SmaCross)\ncerebro.run()`, 'area'),

  createAlgo('bt_rsi_mean_rev', 'RSI 均值回归策略', AlgorithmCategory.BACKTEST, 
    '利用 RSI 指标捕捉超买超卖。RSI < 30 买入，RSI > 70 卖出。',
    `import backtrader as bt\nclass RsiStrat(bt.Strategy):\n    def __init__(self):\n        self.rsi = bt.ind.RSI()\n    def next(self):\n        if not self.position:\n            if self.rsi < 30: self.buy()\n        else:\n            if self.rsi > 70: self.close()\ncerebro = bt.Cerebro()\ncerebro.addstrategy(RsiStrat)\ncerebro.run()`, 'line'),

  createAlgo('bt_macdfix', 'MACD 经典策略', AlgorithmCategory.BACKTEST, 
    '基于异同移动平均线(MACD)的策略。MACD线上穿信号线时买入。',
    `import backtrader as bt\nclass MacdStrat(bt.Strategy):\n    def __init__(self):\n        self.macd = bt.ind.MACD()\n        self.crossover = bt.ind.CrossOver(self.macd.macd, self.macd.signal)\n    def next(self):\n        if not self.position:\n            if self.crossover > 0: self.buy()\n        elif self.crossover < 0: self.close()\ncerebro = bt.Cerebro()\ncerebro.addstrategy(MacdStrat)\ncerebro.run()`, 'area'),

  createAlgo('bt_bollinger_breakout', '布林带突破策略', AlgorithmCategory.BACKTEST, 
    '波动率突破策略。价格突破布林带上轨时买入，跌破中轨止损。',
    `import backtrader as bt\nclass BBStrat(bt.Strategy):\n    def __init__(self):\n        self.bb = bt.ind.BollingerBands()\n    def next(self):\n        if not self.position:\n            if self.data.close > self.bb.lines.top: self.buy()\n        else:\n            if self.data.close < self.bb.lines.mid: self.close()\ncerebro = bt.Cerebro()\ncerebro.addstrategy(BBStrat)\ncerebro.run()`, 'line'),

  createAlgo('bt_turtle', '海龟交易法则 (简化版)', AlgorithmCategory.BACKTEST, 
    '基于理查德·丹尼斯的传奇策略。突破过去20天最高价买入，跌破过去10天最低价卖出。',
    `import backtrader as bt\nclass Turtle(bt.Strategy):\n    def __init__(self):\n        self.high_20 = bt.ind.Highest(self.data.high(-1), period=20)\n        self.low_10 = bt.ind.Lowest(self.data.low(-1), period=10)\n    def next(self):\n        if not self.position:\n            if self.data.close > self.high_20: self.buy()\n        else:\n            if self.data.close < self.low_10: self.close()\ncerebro = bt.Cerebro()\ncerebro.addstrategy(Turtle)\ncerebro.run()`, 'area'),

  createAlgo('bt_grid_trading', '网格交易策略 (Grid)', AlgorithmCategory.BACKTEST, 
    '在震荡市中自动高抛低吸。设置多个价格档位，下跌分批买入，上涨分批卖出。',
    `# 简化的网格逻辑演示\nimport backtrader as bt\nclass GridStrat(bt.Strategy):\n    params = (('grid_step', 0.02),)\n    def next(self):\n        # 实际网格需要复杂的挂单管理，此处为概念演示\n        pass\ncerebro = bt.Cerebro()\ncerebro.addstrategy(GridStrat)\ncerebro.run()`, 'none'),

  createAlgo('bt_momentum', '价格动量策略 (Momentum)', AlgorithmCategory.BACKTEST, 
    '买入过去N天涨幅最大的股票（动量效应）。',
    `import backtrader as bt\nclass Momentum(bt.Strategy):\n    def __init__(self):\n        self.roc = bt.ind.ROC(period=20)\n    def next(self):\n        if not self.position and self.roc > 0.05: self.buy()\n        if self.position and self.roc < 0: self.close()\ncerebro = bt.Cerebro()\ncerebro.addstrategy(Momentum)\ncerebro.run()`, 'line'),

  createAlgo('bt_vol_target', '目标波动率策略', AlgorithmCategory.BACKTEST, 
    '根据市场波动率调整仓位。波动率高时减仓，波动率低时加仓。',
    `import backtrader as bt\nclass VolTarget(bt.Strategy):\n    params = (('target_vol', 0.1),)\n    def __init__(self):\n        self.vol = bt.ind.StdDev(period=20)\n    def next(self):\n        weight = self.params.target_vol / (self.vol[0] * 16) # Annualized approx\n        self.order_target_percent(target=min(weight, 1.0))\ncerebro = bt.Cerebro()\ncerebro.addstrategy(VolTarget)\ncerebro.run()`, 'area'),
    
  createAlgo('bt_sma_envelope', '均线包络策略', AlgorithmCategory.BACKTEST, 
    '在移动平均线上下方一定百分比处构建通道。价格触及下轨买入，触及上轨卖出。',
    `import backtrader as bt\nclass Envelope(bt.Strategy):\n    params = (('perc', 0.02),)\n    def __init__(self):\n        sma = bt.ind.SMA(period=20)\n        self.top = sma * (1+self.params.perc)\n        self.bot = sma * (1-self.params.perc)\n    def next(self):\n        if self.data.close < self.bot: self.buy()\n        elif self.data.close > self.top: self.close()\ncerebro = bt.Cerebro()\ncerebro.addstrategy(Envelope)\ncerebro.run()`, 'area'),

  createAlgo('bt_three_soldiers', '红三兵形态策略', AlgorithmCategory.BACKTEST, 
    'K线形态识别。连续三天阳线且收盘价创新高时买入。',
    `import backtrader as bt\nclass ThreeSoldiers(bt.Strategy):\n    def next(self):\n        if self.data.close[0] > self.data.open[0] and \\\n           self.data.close[-1] > self.data.open[-1] and \\\n           self.data.close[-2] > self.data.open[-2]:\n            self.buy()\ncerebro = bt.Cerebro()\ncerebro.addstrategy(ThreeSoldiers)\ncerebro.run()`, 'scatter')
];

// ============================================================================
// 2. Quantitative Modeling (15+ Models)
// ============================================================================
const quants = [
  createAlgo('quant_greeks', '期权希腊字母 (The Greeks)', AlgorithmCategory.QUANT, 
    '计算 Delta, Gamma, Vega, Theta, Rho，用于对冲风险。', `import numpy as np\n# 模拟 Delta 随价格变化\nS = np.linspace(50, 150, 100)\ndelta = np.where(S > 100, 0.8, 0.2)\nplt.plot(S, delta)`, 'line'),
  
  createAlgo('quant_implied_vol', '隐含波动率微笑 (Volatility Smile)', AlgorithmCategory.QUANT, 
    '展示不同行权价下的隐含波动率结构，反映市场对极端风险的定价。', `import matplotlib.pyplot as plt\nstrikes = [80, 90, 100, 110, 120]\niv = [0.3, 0.25, 0.2, 0.25, 0.35]\nplt.plot(strikes, iv, marker='o')`, 'line'),

  createAlgo('quant_fft_pricing', 'FFT 期权定价', AlgorithmCategory.QUANT, 
    '使用快速傅里叶变换(FFT)进行高效的期权定价（Carr-Madan方法）。', `print("FFT Pricing Algorithm Implementation...")`, 'none'),

  createAlgo('quant_copula', 'Copula 相关性建模', AlgorithmCategory.QUANT, 
    '使用 Copula 函数模拟非线性尾部相关性，常用于CDO定价。', `import matplotlib.pyplot as plt\nimport numpy as np\nx = np.random.normal(0,1,1000)\ny = x + np.random.normal(0,1,1000)\nplt.scatter(x,y, alpha=0.5)`, 'scatter'),

  createAlgo('quant_ornstein_uhlenbeck', 'Ornstein-Uhlenbeck 过程', AlgorithmCategory.QUANT, 
    '均值回归随机过程，常用于配对交易中的价差建模。', `import numpy as np\nimport matplotlib.pyplot as plt\nT=100\ndt=0.1\nx=np.zeros(1000)\nfor i in range(1,1000): x[i] = x[i-1] + 0.5*(0-x[i-1])*dt + np.random.normal()*0.1\nplt.plot(x)`, 'line'),

  createAlgo('quant_heston', 'Heston 随机波动率模型', AlgorithmCategory.QUANT, 
    '假设波动率本身也是随机过程的股价模型。', `print("Heston Simulation...")`, 'line'),

  createAlgo('quant_risk_parity', '风险平价 (Risk Parity)', AlgorithmCategory.QUANT, 
    '桥水基金的核心策略。根据资产的波动率倒数分配权重，使每类资产对组合风险贡献相等。', `weights = [0.2, 0.8] # Stock vs Bond\nvol = [0.2, 0.05]\nrisk_contrib = [w*v for w,v in zip(weights, vol)]\nplt.bar(['Stock','Bond'], risk_contrib)`, 'bar'),

  createAlgo('quant_black_litterman', 'Black-Litterman 模型', AlgorithmCategory.QUANT, 
    '结合市场均衡观点和主观观点的资产配置模型。', `print("Posterior Expected Returns calculation...")`, 'bar'),

  createAlgo('quant_stat_arb', '统计套利 (Stat Arb)', AlgorithmCategory.QUANT, 
    '利用统计学方法挖掘定价偏差。', `print("Pair trading logic...")`, 'line'),

  createAlgo('quant_kalman_filter', '卡尔曼滤波 (Kalman Filter)', AlgorithmCategory.QUANT, 
    '动态估计不可观测的变量（如真实的Hedge Ratio）。', `print("State estimation...")`, 'line'),

  createAlgo('quant_pca_yield', 'PCA 收益率曲线分析', AlgorithmCategory.QUANT, 
    '主成分分析：提取收益率曲线的水平(Level)、斜率(Slope)和曲率(Curvature)因子。', `print("PCA Explained Variance...")`, 'bar'),

  createAlgo('quant_var_cvar', 'CVaR (条件在险价值)', AlgorithmCategory.QUANT, 
    '比VaR更保守的风险指标，计算超过VaR阈值后的平均损失（尾部风险）。', `import numpy as np\nlosses = np.random.normal(0,1,1000)\nvar = np.percentile(losses, 5)\ncvar = losses[losses < var].mean()\nprint(f"CVaR: {cvar}")`, 'bar'),

  createAlgo('quant_arima', 'ARIMA 时间序列预测', AlgorithmCategory.QUANT, 
    '自回归差分移动平均模型。', `print("AutoRegressive Integrated Moving Average")`, 'line'),
  
  createAlgo('quant_hmm', '隐马尔可夫模型 (HMM)', AlgorithmCategory.QUANT, 
    '识别市场隐藏状态（牛/熊/震荡）。', `print("Hidden States Detection")`, 'bar'),

  createAlgo('quant_entropy', '市场熵 (Market Entropy)', AlgorithmCategory.QUANT, 
    '利用信息熵衡量市场的无序程度和有效性。', `print("Shannon Entropy calculation")`, 'line'),
];

// ============================================================================
// 3. Machine Learning & AI (10+ Models)
// ============================================================================
const ml = [
  createAlgo('ml_random_forest', '随机森林股价预测', AlgorithmCategory.ML, '集成学习算法，通过多棵决策树投票预测涨跌。', `from sklearn.ensemble import RandomForestClassifier\n# model = RandomForestClassifier()\n# model.fit(X, y)`, 'none'),
  createAlgo('ml_svm', '支持向量机 (SVM) 分类', AlgorithmCategory.ML, '寻找最佳超平面来划分上涨和下跌的样本。', `from sklearn.svm import SVC\n# model = SVC()`, 'scatter'),
  createAlgo('ml_xgboost', 'XGBoost 因子挖掘', AlgorithmCategory.ML, 'Kaggle神器的金融应用。高效的梯度提升树算法。', `import xgboost as xgb\nprint("XGBoost training...")`, 'bar'),
  createAlgo('ml_sentiment_bert', 'BERT 财经新闻情感分析', AlgorithmCategory.ML, 'NLP模型，读取新闻标题判断利好利空。', `print("Sentiment Score: 0.8 (Positive)")`, 'bar'),
  createAlgo('ml_reinforcement', '强化学习 (DQN) 交易机器人', AlgorithmCategory.ML, '让AI通过不断试错（Reward/Penalty）学习交易策略。', `print("Deep Q-Network Agent Training...")`, 'line'),
  createAlgo('ml_autoencoder', '自编码器异常检测', AlgorithmCategory.ML, '无监督学习，发现市场中的异常交易行为或欺诈。', `print("Reconstruction Error heatmap")`, 'area'),
  createAlgo('ml_genetic', '遗传算法策略优化', AlgorithmCategory.ML, '模拟生物进化，寻找最优的策略参数组合。', `print("Evolutionary optimization...")`, 'line'),
  createAlgo('ml_knn', 'K-近邻 (KNN) 相似K线匹配', AlgorithmCategory.ML, '在历史数据中寻找与当前走势最相似的片段（历史重演）。', `print("Nearest Neighbors search...")`, 'line'),
  createAlgo('ml_prophet', 'Facebook Prophet 趋势预测', AlgorithmCategory.ML, '处理具有强季节性特征的时间序列（如零售销售额）。', `print("Prophet forecast component...")`, 'area'),
  createAlgo('ml_isolation_forest', '孤立森林去噪', AlgorithmCategory.ML, '去除数据中的离群点和噪音。', `print("Outlier detection")`, 'scatter'),
];

// ============================================================================
// 4. Utility & Economics (Combine previous + new)
// ============================================================================
const others = [
  createAlgo('util_correlation', '相关性热力图', AlgorithmCategory.UTILITY, '分析多只股票之间的相关性矩阵。', `import seaborn as sns\nimport numpy as np\ncorr = np.array([[1,0.8],[0.8,1]])\nsns.heatmap(corr)`, 'none'),
  createAlgo('util_sharpe', '夏普比率计算器', AlgorithmCategory.UTILITY, '衡量风险调整后收益。', `print("Sharpe = (Rp - Rf) / Sigma")`, 'bar'),
  createAlgo('econ_phillips', '菲利普斯曲线', AlgorithmCategory.ECONOMICS, '失业率与通胀率之间的反向关系。', `plt.plot(unemployment, inflation)`, 'line'),
  createAlgo('econ_gdp_decomp', 'GDP 支出法分解', AlgorithmCategory.ECONOMICS, 'Y = C + I + G + (X-M)', `plt.pie([60, 20, 15, 5])`, 'none'),
  createAlgo('risk_drawdown', '最大回撤分析 (Max Drawdown)', AlgorithmCategory.RISK, '计算历史上最严重的亏损幅度。', `drawdown = (wealth_index - previous_peaks) / previous_peaks`, 'area'),
];

// Combine all and export
export const ALGORITHMS: FinancialAlgorithm[] = [
  // Original top items to keep continuity
  createAlgo('bt_sma_crossover', '双均线趋势策略 (SMA)', AlgorithmCategory.BACKTEST, '量化交易入门最经典的策略。', `import backtrader as bt\n# ... (classic code)`, 'area'),
  
  // New Sets
  ...strategies,
  ...quants,
  ...ml,
  ...others,

  // Restoring some key original ones that were good
  createAlgo('bs_option_pricing_classic', 'Black-Scholes 公式 (经典)', AlgorithmCategory.QUANT, '欧式期权定价标准公式。', `print("BS Formula")`, 'line'),
  createAlgo('lorenz_curve', '洛伦兹曲线', AlgorithmCategory.ECONOMICS, '收入分配不平等程度。', `print("Gini")`, 'area'),
];
