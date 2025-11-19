import React from 'react';
import Card from '../ui/Card';

interface ChartData {
  label: string;
  value: number;
  color: string;
}

interface AnalyticsChartProps {
  title: string;
  data: ChartData[];
  type?: 'bar' | 'donut';
}

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ title, data, type = 'bar' }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const total = data.reduce((sum, d) => sum + d.value, 0);

  const renderBarChart = () => (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="flex items-center">
          <div className="w-24 text-sm font-medium text-slate-600 truncate">
            {item.label}
          </div>
          <div className="flex-1 mx-3">
            <div className="bg-slate-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
          <div className="w-10 text-sm font-semibold text-right">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );

  const renderDonutChart = () => {
    let cumulativePercentage = 0;
    
    return (
      <div className="flex items-center justify-center">
        <div className="relative w-32 h-32">
          <svg width="128" height="128" className="transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="transparent"
              stroke="#e2e8f0"
              strokeWidth="16"
            />
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const strokeDasharray = `${percentage * 3.52} 352`;
              const strokeDashoffset = -cumulativePercentage * 3.52;
              cumulativePercentage += percentage;
              
              return (
                <circle
                  key={index}
                  cx="64"
                  cy="64"
                  r="56"
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth="16"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-300"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">{total}</div>
              <div className="text-xs text-slate-500">Total</div>
            </div>
          </div>
        </div>
        <div className="ml-6 space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-slate-600">{item.label}</span>
              <span className="ml-auto text-sm font-semibold">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      </div>
      {type === 'bar' ? renderBarChart() : renderDonutChart()}
    </Card>
  );
};

export default AnalyticsChart;
