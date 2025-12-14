
import { GoogleGenAI } from "@google/genai";
import { BacktestResult, AgentResponse, FactorAnalysisResult } from "../types";

const getAIClient = () => {
   const apiKey = process.env.API_KEY;
   if (!apiKey) throw new Error("API Key is missing");
   return new GoogleGenAI({ apiKey });
}

export const getGeminiExplanation = async (algoTitle: string, userQuery: string) => {
  try {
    const ai = getAIClient();
    const model = "gemini-2.5-flash";
    
    const prompt = `
      你是一位量化金融专家。
      用户正在询问关于算法：“${algoTitle}”的问题。
      用户问题：“${userQuery}”
      
      请提供简明、专业的解释或回答。
      如果用户要求代码，请提供与 Jupyter Notebook 兼容的 Python 代码。
      请使用中文回答，保持学术但易懂的语调。
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI 服务暂时不可用，请检查 API Key。";
  }
};

export type CodeTaskType = 'generation' | 'optimization' | 'debugging' | 'documentation';

export const generateCodeFromPrompt = async (promptText: string, currentCode: string, taskType: CodeTaskType = 'generation') => {
  try {
    const ai = getAIClient();
    const model = "gemini-2.5-flash";

    let taskInstruction = "";
    switch (taskType) {
      case 'optimization':
        taskInstruction = "Focus on performance optimization (vectorization with pandas/numpy), code readability (PEP8), and removing redundant logic. Do not change the core financial logic unless it is incorrect.";
        break;
      case 'debugging':
        taskInstruction = "Analyze the code for syntax errors, logical flaws, or potential runtime exceptions. Fix them and ensure the code runs smoothly.";
        break;
      case 'documentation':
        taskInstruction = "Add detailed Python docstrings (NumPy style) and inline comments explaining the financial formulas and logic used.";
        break;
      case 'generation':
      default:
        taskInstruction = "Generate or modify code based on the user's specific request.";
        break;
    }

    const prompt = `
      You are a Senior Python Quant Developer Assistant.
      
      【Environment Context】
      - Libraries available: pandas, numpy, matplotlib.pyplot, seaborn, scipy, akshare (ak), backtrader (bt).
      - The code runs in a simulated Jupyter-like environment.
      
      【Current Task: ${taskType.toUpperCase()}】
      ${taskInstruction}
      
      【User Request】
      "${promptText}"
      
      【Current Code Context】
      \`\`\`python
      ${currentCode}
      \`\`\`
      
      【Output Rules】
      1. Return ONLY the valid Python code. No Markdown code blocks (\`\`\`), no explanations before/after.
      2. Keep existing imports if they are needed.
      3. If using AKShare, ensure correct parameters.
      4. If plotting, use 'plt.style.use("dark_background")' for aesthetics.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    let code = response.text || "";
    // Clean up potential markdown formatting from LLM
    code = code.replace(/^```python\s*/, "").replace(/^```\s*/, "").replace(/```$/, "").trim();
    return code;

  } catch (error) {
    console.error("Vibe Coding Error:", error);
    throw error;
  }
};

export const simulateCodeExecution = async (code: string) => {
  try {
    const ai = getAIClient();
    const model = "gemini-2.5-flash";

    const prompt = `
      You are a Python code interpreter simulator for a Quant Finance application.
      The user provides Python code. You must simulate its execution.

      Code:
      \`\`\`python
      ${code}
      \`\`\`

      Tasks:
      1. Predict the console output (print statements).
      2. Generate visualization data ('chartData').

      【Special Handling for Backtrader】
      If the code uses 'backtrader' (bt.Cerebro, strategy, etc.):
      - SIMULATE the backtest process logs. Generate realistic trade logs.
      - For 'chartData', generate the **Equity Curve** (Portfolio Value over time).
        - Keys: "name" (Date string), "value" (Portfolio Value).
      - Set 'chartType' to 'area'.

      Response Format (JSON):
      {
        "output": "Console output string...",
        "chartData": [...],
        "chartType": "line" | "bar" | "area" | "scatter" | "none"
      }
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      output: result.output || "执行完成，无输出。",
      chartData: result.chartData || null,
      chartType: result.chartType || "none"
    };

  } catch (error) {
    console.error("Simulation Error", error);
    return {
      output: "无法模拟运行。请检查 API 连接或代码语法。",
      chartData: null,
      chartType: "none"
    };
  }
};

interface BacktestConfig {
  initialCash: number;
  commission: number;
  timeframe: string;
}

// NEW: Specialized function for Backtest Lab with Data Context
export const runBacktestSimulation = async (
  code: string, 
  dataContext: string,
  config: BacktestConfig = { initialCash: 100000, commission: 0.0005, timeframe: 'daily' }
): Promise<BacktestResult> => {
  try {
    const ai = getAIClient();
    const model = "gemini-2.5-flash";

    const prompt = `
      You are a specialized Backtest Simulation Engine (similar to Backtrader/Zipline).
      
      CONTEXT:
      1. User provided CSV Data.
      2. User provided Python Strategy Code.
      3. **CONFIG**: 
         - Initial Cash: ${config.initialCash}
         - Commission Rate: ${config.commission}
         - Data Frequency: ${config.timeframe}
      
      TASK:
      Simulate the execution day-by-day (or minute-by-minute if selected) on the provided data.
      Calculate fees for every trade based on commission rate.

      DATA CONTEXT (First 50 rows):
      \`\`\`csv
      ${dataContext}
      \`\`\`

      STRATEGY CODE:
      \`\`\`python
      ${code}
      \`\`\`
      
      OUTPUT JSON FORMAT:
      {
        "outputLog": "Detailed transaction logs... (Include date, order type, price, cost, commission)",
        "metrics": {
          "totalReturn": "e.g. +25.4%",
          "annualizedReturn": "e.g. +15.2%",
          "sharpeRatio": "e.g. 1.8",
          "sortinoRatio": "e.g. 2.1",
          "maxDrawdown": "e.g. -12.5%",
          "volatility": "e.g. 18.5%",
          "winRate": "e.g. 65%",
          "tradeCount": 24,
          "alpha": "0.05",
          "beta": "0.9"
        },
        "equityCurve": [
           {"name": "2023-01-01", "value": 100000},
           ... (Daily portfolio value)
        ],
        "drawdownCurve": [
           {"name": "2023-01-01", "value": 0},
           {"name": "2023-01-02", "value": -0.02},
           ... (Daily drawdown percentage, e.g. -0.05 for -5%)
        ],
        "tradeSignals": [
           {"id": "1", "date": "2023-01-05", "type": "buy", "price": 50.00, "size": 100, "reason": "SMA Cross"},
           {"id": "2", "date": "2023-02-10", "type": "sell", "price": 55.00, "size": 100, "pnl": 500, "pnlPct": "+10.0%"}
           ... (List all executed trades)
        ]
      }
      
      RULES:
      - Be realistic. If the strategy buys, cash goes down, stock goes up.
      - Calculate Drawdown correctly (current value / peak value - 1).
      - If no trades occur, state that in the log.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      outputLog: result.outputLog || "回测完成，无交易记录。",
      metrics: result.metrics || { 
        totalReturn: "0%", annualizedReturn: "0%", sharpeRatio: "0", sortinoRatio: "0",
        maxDrawdown: "0%", volatility: "0%", winRate: "0%", tradeCount: 0, alpha: "0", beta: "0"
      },
      equityCurve: result.equityCurve || [],
      drawdownCurve: result.drawdownCurve || [],
      dailyReturns: result.dailyReturns || [],
      tradeSignals: result.tradeSignals || []
    };

  } catch (error) {
    console.error("Backtest Simulation Error", error);
    throw new Error("回测模拟失败");
  }
};

export const runFactorAnalysis = async (dataContext: string, factorDef: string): Promise<FactorAnalysisResult> => {
  try {
    const ai = getAIClient();
    const model = "gemini-2.5-flash";

    const prompt = `
      You are a Quantitative Factor Analyst (Alphalens expert).
      
      Task: Analyze the effectiveness of the Factor defined as: "${factorDef}" on the provided market data.
      
      Data Context (Sample):
      \`\`\`csv
      ${dataContext}
      \`\`\`

      Interpretation Rules:
      1. If "${factorDef}" is a single ID (e.g., "pe_ratio", "volatility_30d"), analyze it as a standard single factor.
      2. If "${factorDef}" is a formula (e.g. "0.5*rank(A) + 0.5*rank(B)"), assume it is a **Multi-Factor** construction. Simulate the scoring, ranking, and combination process before calculating IC.
      3. For "mf_value_mom" (Value+Momentum), assume a strategy that longs low PE and high Momentum.
      
      Requirements:
      1. Simulate calculation of IC (Information Coefficient), ICIR, and Turnover.
      2. Simulate Quantile Returns (Group 1 to Group 5) to check monotonicity.
      3. Generate a time-series of IC values matching the dates in the data.
      
      Output JSON Format:
      {
        "icMean": "0.05", 
        "icStd": "0.15",
        "ir": "0.33",
        "turnover": "12%",
        "icSeries": [
          {"date": "2023-01-01", "value": 0.02},
          {"date": "2023-01-02", "value": -0.01},
          ... (Generate realistic series for ~30-50 points)
        ],
        "quantiles": [
           {"name": "Group 1 (Low)", "value": -5.5, "fill": "#ef4444"},
           {"name": "Group 2", "value": -2.0, "fill": "#f97316"},
           {"name": "Group 3", "value": 1.2, "fill": "#eab308"},
           {"name": "Group 4", "value": 3.5, "fill": "#84cc16"},
           {"name": "Group 5 (High)", "value": 8.8, "fill": "#22c55e"}
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(response.text || "{}");
    
    // Client-side processing: Calculate cumulative IC
    let cum = 0;
    const processedICSeries = (result.icSeries || []).map((d: any) => {
      cum += d.value;
      return { ...d, cumulative: Number(cum.toFixed(3)) };
    });

    return {
      icMean: result.icMean || "0.00",
      icStd: result.icStd || "0.00",
      ir: result.ir || "0.00",
      turnover: result.turnover || "0%",
      icSeries: processedICSeries,
      quantiles: result.quantiles || []
    };

  } catch (error) {
    console.error("Factor Analysis Error", error);
    throw new Error("因子分析失败");
  }
};

export const generateFactorExpression = async (userRequest: string) => {
  try {
    const ai = getAIClient();
    const model = "gemini-2.5-flash";
    const prompt = `
      You are a Quant Factor Engineering Assistant.
      User Request: "${userRequest}"
      
      Task: Convert this request into a Python/Pandas expression representing a financial factor.
      assume 'df' is the DataFrame containing OHLCV and fundamental data.
      Available columns often include: close, open, high, low, volume, pe_ratio, pb_ratio, market_cap.
      
      Examples:
      Request: "Equal weight PE and Momentum"
      Output: 0.5 * (1/df['pe_ratio']) + 0.5 * df['close'].pct_change(20)
      
      Request: "RSI 14 days"
      Output: ta.rsi(df['close'], length=14)
      
      Return ONLY the one-line expression or short code snippet. No markdown.
    `;
    
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Factor Gen Error", error);
    return "df['close'] # 自动生成失败";
  }
};

export const fetchAKShareData = async (functionName: string, params: string) => {
  try {
    const ai = getAIClient();
    const model = "gemini-2.5-flash";

    const prompt = `
      You are a financial data simulation engine for the Python library 'AKShare'.
      
      User Request: Call function \`ak.${functionName}(${params})\`
      
      Task:
      Generate a realistic CSV string representing the output DataFrame.
      
      Rules:
      1. Use correct column names for the specific AKShare function.
      2. Generate ~50 rows of data (enough for a small backtest).
      3. Return ONLY CSV string.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    let csv = response.text || "";
    csv = csv.replace(/```csv/g, "").replace(/```/g, "").trim();
    return csv;

  } catch (error) {
    console.error("AKShare Fetch Error:", error);
    throw error;
  }
};

export const runBuilderAgent = async (
  conversation: { role: string; content: string }[],
  currentModelMetadata: any
): Promise<AgentResponse> => {
  try {
    const ai = getAIClient();
    const model = "gemini-2.5-flash";

    const validCategories = [
      "策略回测", "技术分析", "量化建模", "风险与定价", "投资组合管理", "机器学习", "实用工具", "我的模型"
    ].join(", ");
    
    const systemInstruction = `
      You are an expert Quant Finance Architect Agent.
      AKShare (ak) for data. Backtrader (bt) for backtesting strategies.
      Output valid JSON.
    `;
    
    const prompt = `
      Conversation History:
      ${conversation.map(c => `${c.role.toUpperCase()}: ${c.content}`).join('\n')}
      User: ${conversation[conversation.length - 1].content}
      Respond in JSON.
    `;

    const result = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: "application/json", systemInstruction }
    });
    
    return JSON.parse(result.text || "{}");

  } catch (error) {
    console.error("Agent Builder Error:", error);
    return { reply: "抱歉，智能体遇到错误，请重试。" };
  }
};
