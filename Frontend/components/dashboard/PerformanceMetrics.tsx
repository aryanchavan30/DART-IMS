import React from 'react';
import Card from '../ui/Card';
import { ChevronUpIcon, ChevronDownIcon } from '../icons';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
    period: string;
  };
  icon: React.ReactNode;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon, color }) => {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mb-2">{value}</p>
          {change && (
            <div className="flex items-center">
              {change.type === 'increase' ? (
                <ChevronUpIcon className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <ChevronDownIcon className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${
                change.type === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}>
                {change.type === 'increase' ? '+' : ''}{change.value}%
              </span>
              <span className="text-sm text-slate-500 ml-1">vs {change.period}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
};

interface PerformanceMetricsProps {
  candidateStats?: any;
  internStats?: any;
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ candidateStats, internStats }) => {
  // Calculate some basic metrics
  const totalCandidates = candidateStats?.total || 0;
  const selectedCandidates = candidateStats?.by_status?.SELECTED || 0;
  const onboardedCandidates = candidateStats?.by_status?.ONBOARDED || 0;
  const rejectedCandidates = candidateStats?.by_status?.REJECTED || 0;
  
  const conversionRate = totalCandidates > 0 ? 
    ((selectedCandidates + onboardedCandidates) / totalCandidates * 100).toFixed(1) : 0;
  
  const rejectionRate = totalCandidates > 0 ? 
    (rejectedCandidates / totalCandidates * 100).toFixed(1) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Conversion Rate"
        value={`${conversionRate}%`}
        change={{
          value: 12,
          type: 'increase',
          period: 'last month'
        }}
        icon={<ChevronUpIcon className="w-6 h-6 text-white" />}
        color="bg-green-500"
      />
      
      <MetricCard
        title="Total Candidates"
        value={totalCandidates}
        change={{
          value: 8,
          type: 'increase',
          period: 'last month'
        }}
        icon={<span className="text-white font-bold">👥</span>}
        color="bg-blue-500"
      />
      
      <MetricCard
        title="Active Interns"
        value={internStats?.total || 0}
        icon={<span className="text-white font-bold">💼</span>}
        color="bg-purple-500"
      />
      
      <MetricCard
        title="Rejection Rate"
        value={`${rejectionRate}%`}
        change={{
          value: 5,
          type: 'decrease',
          period: 'last month'
        }}
        icon={<ChevronDownIcon className="w-6 h-6 text-white" />}
        color="bg-red-500"
      />
    </div>
  );
};

export default PerformanceMetrics;
