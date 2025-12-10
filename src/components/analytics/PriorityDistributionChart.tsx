'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ChartContainer } from './ChartContainer';
import { FeedbackPriority, PRIORITY_LABELS } from '@/types';

interface PriorityData {
  priority: FeedbackPriority;
  count: number;
}

interface PriorityDistributionChartProps {
  data: PriorityData[];
  title?: string;
  subtitle?: string;
  className?: string;
}

const PRIORITY_CHART_COLORS: Record<FeedbackPriority, string> = {
  low: '#6B7280',
  medium: '#F59E0B',
  high: '#F97316',
  urgent: '#EF4444',
};

export function PriorityDistributionChart({
  data,
  title = 'Distribuicao por Prioridade',
  subtitle,
  className,
}: PriorityDistributionChartProps) {
  const chartData = data.map(d => ({
    name: PRIORITY_LABELS[d.priority],
    value: d.count,
    color: PRIORITY_CHART_COLORS[d.priority],
    priority: d.priority,
  }));

  return (
    <ChartContainer title={title} subtitle={subtitle} className={className}>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1A1A1A',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '12px',
              }}
              formatter={(value: number) => [`${value} feedbacks`, 'Quantidade']}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
}
