import { FinancialAlgorithm, AlgorithmCategory } from '../types';

const STORAGE_KEY = 'fin_algo_studio_custom_algos';

export const DEFAULT_PYTHON_TEMPLATE = `# 常用金融分析库自动导入
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats

# 设置绘图风格
plt.style.use('dark_background')

# 在此处编写您的策略逻辑...
# 示例：
# df = pd.DataFrame(...)
# plt.plot(df)
# plt.show()
`;

export const saveCustomAlgorithm = (algo: FinancialAlgorithm): void => {
  const existing = getCustomAlgorithms();
  const index = existing.findIndex(a => a.id === algo.id);
  
  if (index >= 0) {
    existing[index] = { ...algo, lastModified: Date.now() };
  } else {
    existing.push({ ...algo, createdAt: Date.now(), lastModified: Date.now(), isCustom: true });
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
};

export const getCustomAlgorithms = (): FinancialAlgorithm[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to parse custom algorithms", e);
    return [];
  }
};

export const deleteCustomAlgorithm = (id: string): void => {
  const existing = getCustomAlgorithms();
  const filtered = existing.filter(a => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const createNewAlgorithm = (): FinancialAlgorithm => {
  return {
    id: `custom_${Date.now()}`,
    title: '未命名模型',
    category: AlgorithmCategory.CUSTOM,
    description: '在此处描述您的算法逻辑...',
    pythonCode: DEFAULT_PYTHON_TEMPLATE,
    visualizationType: 'none',
    isCustom: true
  };
};

export const forkAlgorithm = (original: FinancialAlgorithm): FinancialAlgorithm => {
  const newAlgo: FinancialAlgorithm = {
    ...original,
    id: `custom_${Date.now()}`,
    title: `${original.title} (副本)`,
    category: AlgorithmCategory.CUSTOM,
    description: `基于 ${original.title} 的二次开发。\n\n${original.description}`,
    isCustom: true,
    createdAt: Date.now(),
    lastModified: Date.now()
  };
  saveCustomAlgorithm(newAlgo);
  return newAlgo;
};