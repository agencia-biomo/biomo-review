'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { ChartContainer } from './ChartContainer';
import { FeedbackStatus, STATUS_LABELS } from '@/types';

interface StatusData {
  status: FeedbackStatus;
  count: number;
}

interface StatusDistributionChartProps {
  data: StatusData[];
  title?: string;
  subtitle?: string;
  className?: string;
}

const STATUS_CHART_COLORS: Record<FeedbackStatus, string> = {
  new: '#EF4444',
  in_review: '#F59E0B',
  in_progress: '#3B82F6',
  waiting_client: '#A855F7',
  rejected: '#6B7280',
  completed: '#22C55E',
};

export function StatusDistributionChart({
  data,
  title = 'Distribuicao por Status',
  subtitle,
  className,
}: StatusDistributionChartProps) {
  const chartData = data
    .filter(d => d.count > 0)
    .map(d => ({
      name: STATUS_LABELS[d.status],
      value: d.count,
      color: STATUS_CHART_COLORS[d.status],
    }));

  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <ChartContainer title={title} subtitle={subtitle} className={className}>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1A1A1A',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '12px',
              }}
              formatter={(value: number, name: string) => [
                `${value} (${Math.round((value / total) * 100)}%)`,
                name,
              ]}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center -mt-8">
          <div className="text-2xl font-bold text-white">{total}</div>
          <div className="text-xs text-white/40">Total</div>
        </div>
      </div>
    </ChartContainer>
  );
}
