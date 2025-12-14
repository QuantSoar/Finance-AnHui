
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ScatterChart, Scatter, AreaChart, Area, Legend } from 'recharts';
import { FinancialAlgorithm } from '../types';
import { BarChart3 } from 'lucide-react';

// Mock Data Generator
const generateMockData = (days = 100) => {
  const data = [];
  let price = 100;
  for (let i = 0; i < days; i++) {
    const change = (Math.random() - 0.5) * 5;
    price += change;
    data.push({
      date: `第 ${i + 1} 天`,
      price: Number(price.toFixed(2)),
      volume: Math.floor(Math.random() * 1000) + 500,
      sma: Number((price + (Math.random() * 5)).toFixed(2)),
      upper: Number((price + 10).toFixed(2)),
      lower: Number((price - 10).toFixed(2)),
      histogram: Math.random() * 10 - 5,
      x: Math.random() * 100, // For scatter
      y: Math.random() * 100, // For scatter
    });
  }
  return data;
};

interface ChartRendererProps {
  algorithm?: FinancialAlgorithm;
  customData?: any[];
  customType?: string;
  color?: string; // NEW: Allow forcing a color
}

export const ChartRenderer: React.FC<ChartRendererProps> = ({ algorithm, customData, customType, color }) => {
  // Use custom data if available, otherwise generate mock data based on algorithm ID
  const data = useMemo(() => {
    if (customData && customData.length > 0) return customData;
    return generateMockData();
  }, [algorithm?.id, customData]);

  const type = customType || algorithm?.visualizationType || 'none';

  if (type === 'none') {
    return (
      <div className="h-64 flex flex-col items-center justify-center bg-zinc-900/50 rounded-lg border border-zinc-800 text-zinc-500 gap-4">
        <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center border border-zinc-700/50">
           <BarChart3 size={32} className="opacity-50" />
        </div>
        <p className="text-sm">暂无可视化数据</p>
      </div>
    );
  }

  // Helper to dynamically render Lines/Bars for custom data keys (excluding the 'name' key)
  const renderDynamicSeries = (ChartComponent: any) => {
    if (!customData || customData.length === 0) return null;
    const keys = Object.keys(customData[0]).filter(k => k !== 'name');
    const colors = ['#3b82f6', '#10b981', '#f43f5e', '#8b5cf6', '#f59e0b'];
    
    return keys.map((key, index) => {
      // Logic for color override or default scheme
      let strokeColor = colors[index % colors.length];
      let fillColor = colors[index % colors.length];

      if (color) {
        strokeColor = color;
        fillColor = color;
      } else if (key === 'value') {
         // Default logic: Equity green, drawdown logic handled by parent passing color
         strokeColor = '#10b981';
         fillColor = '#10b981';
      }

      if (ChartComponent === Line) {
        return <Line key={key} type="monotone" dataKey={key} stroke={strokeColor} dot={false} strokeWidth={2} />;
      }
      if (ChartComponent === Bar) {
        return <Bar key={key} dataKey={key} fill={fillColor} />;
      }
      if (ChartComponent === Area) {
         return <Area key={key} type="monotone" dataKey={key} stroke={strokeColor} fill={fillColor} fillOpacity={0.2} />;
      }
      return null;
    });
  };

  const renderChart = () => {
    // Custom Data Logic (Used by Simulation & Backtest Lab)
    if (customData) {
       switch (type) {
        case 'line':
          return (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#666" fontSize={10} tickFormatter={(v) => v.toString().slice(5)} />
              <YAxis stroke="#666" fontSize={10} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ backgroundColor: '#27272a', borderColor: '#3f3f46', color: '#fff', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              {renderDynamicSeries(Line)}
            </LineChart>
          );
        case 'bar':
          return (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#666" fontSize={10} tickFormatter={(v) => v.toString().slice(5)} />
              <YAxis stroke="#666" fontSize={10} />
              <Tooltip contentStyle={{ backgroundColor: '#27272a', borderColor: '#3f3f46', color: '#fff', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              {renderDynamicSeries(Bar)}
            </BarChart>
          );
        case 'area':
          return (
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#666" fontSize={10} tickFormatter={(v) => v.toString().slice(5)} />
              <YAxis stroke="#666" fontSize={10} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ backgroundColor: '#27272a', borderColor: '#3f3f46', color: '#fff', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              {renderDynamicSeries(Area)}
            </AreaChart>
          );
         case 'scatter':
          return (
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis type="number" dataKey="x" name="X" stroke="#666" fontSize={10} />
              <YAxis type="number" dataKey="y" name="Y" stroke="#666" fontSize={10} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#27272a', borderColor: '#3f3f46', color: '#fff' }} />
              <Scatter name="Data" data={data} fill="#f43f5e" />
            </ScatterChart>
          );
       }
    }

    // Default Logic for Built-in Algorithms
    switch (type) {
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="date" stroke="#666" fontSize={12} />
            <YAxis stroke="#666" fontSize={12} domain={['auto', 'auto']} />
            <Tooltip contentStyle={{ backgroundColor: '#27272a', borderColor: '#3f3f46', color: '#fff' }} />
            <Legend />
            <Line name="价格" type="monotone" dataKey="price" stroke="#3b82f6" dot={false} strokeWidth={2} />
            {algorithm?.id.includes('sma') && <Line name="SMA均线" type="monotone" dataKey="sma" stroke="#10b981" dot={false} strokeWidth={2} />}
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="date" stroke="#666" fontSize={12} />
            <YAxis stroke="#666" fontSize={12} domain={['auto', 'auto']} />
            <Tooltip contentStyle={{ backgroundColor: '#27272a', borderColor: '#3f3f46', color: '#fff' }} />
            <Legend />
            <Area name="上轨" type="monotone" dataKey="upper" stackId="1" stroke="transparent" fill="#3b82f6" fillOpacity={0.1} />
            <Area name="下轨" type="monotone" dataKey="lower" stackId="1" stroke="transparent" fill="transparent" />
            <Line name="价格" type="monotone" dataKey="price" stroke="#fff" dot={false} strokeWidth={2} />
          </AreaChart>
        );
      case 'bar':
        return (
          <BarChart data={data.slice(0, 20)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="date" stroke="#666" fontSize={12} />
            <YAxis stroke="#666" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: '#27272a', borderColor: '#3f3f46', color: '#fff' }} />
            <Legend />
            <Bar name="数值" dataKey="histogram" fill="#8b5cf6" />
          </BarChart>
        );
      case 'scatter':
        return (
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis type="number" dataKey="x" name="风险" stroke="#666" fontSize={12} unit="%" />
            <YAxis type="number" dataKey="y" name="回报" stroke="#666" fontSize={12} unit="%" />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#27272a', borderColor: '#3f3f46', color: '#fff' }} />
            <Scatter name="资产" data={data} fill="#f43f5e" />
          </ScatterChart>
        );
      default:
        return null;
    }
  };

  const chartElement = renderChart();

  if (!chartElement) {
    return null;
  }

  return (
    <div className="h-[300px] w-full bg-[#1e1e1e] rounded-lg border border-zinc-800 p-2 shadow-lg">
       <ResponsiveContainer width="100%" height="100%">
         {chartElement}
       </ResponsiveContainer>
    </div>
  );
};
